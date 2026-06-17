using Microsoft.EntityFrameworkCore;
using SEAL.NET.Data;
using SEAL.NET.DTOs.Submission;
using SEAL.NET.Models.Entities;
using SEAL.NET.Models.Enums;
using SEAL.NET.Services.Common;
using SEAL.NET.Services.Interfaces;

namespace SEAL.NET.Services.Implementations
{
    public class SubmissionService : ISubmissionService
    {
        private readonly ApplicationDbContext _context;
        private readonly INotificationService _notificationService;

        public SubmissionService(ApplicationDbContext context, INotificationService notificationService)
        {
            _context = context;
            _notificationService = notificationService;
        }

        private async Task NotifySubmissionReceivedAsync(Team team, Round round, bool isUpdate)
        {
            var action = isUpdate ? "updated their submission" : "submitted their project";

            var adminIds = await _context.UserRoles
                .Join(_context.Roles.Where(r => r.Name == "Admin"),
                    ur => ur.RoleId, r => r.Id, (ur, r) => ur.UserId)
                .ToListAsync();

            await _notificationService.CreateForUsersAsync(
                adminIds,
                "New submission received",
                $"Team '{team.TeamName}' {action} for round '{round.RoundName}'. Assign judges to start grading.");

            var assignedJudgeIds = await _context.JudgeAssignments
                .Where(a => a.RoundId == round.RoundId && a.CategoryId == team.CategoryId)
                .Select(a => a.JudgeId)
                .ToListAsync();

            await _notificationService.CreateForUsersAsync(
                assignedJudgeIds,
                "New submission to grade",
                $"Team '{team.TeamName}' {action} for round '{round.RoundName}'. It is ready for evaluation.");
        }

        public async Task<ServiceResult> SubmitProjectAsync(Guid currentUserId, CreateSubmissionRequest request)
        {
            var team = await _context.Teams
                .Include(t => t.Members)
                .FirstOrDefaultAsync(t => t.TeamId == request.TeamId);

            if (team == null)
                return ServiceResult.NotFound("Team not found.");

            if (team.LeaderId != currentUserId)
                return ServiceResult.Forbidden();

            if (team.Status != TeamStatus.Approved)
                return ServiceResult.BadRequest("Only approved teams can submit.");

            if (team.CurrentRoundId != request.RoundId)
                return ServiceResult.BadRequest("Team can only submit for its current round.");

            var round = await _context.Rounds.FindAsync(request.RoundId);
            if (round == null)
                return ServiceResult.NotFound("Round not found.");

            if (DateTime.UtcNow > round.SubmissionDeadline)
                return ServiceResult.BadRequest("Submission deadline has passed.");

            var existingSubmission = await _context.Submissions
                .FirstOrDefaultAsync(s => s.TeamId == request.TeamId && s.RoundId == request.RoundId);

            if (existingSubmission != null)
            {
                existingSubmission.RepositoryUrl = request.RepositoryUrl;
                existingSubmission.DemoUrl = request.DemoUrl;
                existingSubmission.SlideUrl = request.SlideUrl;
                existingSubmission.SubmittedAt = DateTime.UtcNow;

                await _context.SaveChangesAsync();
                await NotifySubmissionReceivedAsync(team, round, isUpdate: true);

                return ServiceResult.Ok(new
                {
                    message = "Submission updated successfully.",
                    existingSubmission.SubmissionId
                });
            }

            var submission = new Submission
            {
                TeamId = request.TeamId,
                RoundId = request.RoundId,
                RepositoryUrl = request.RepositoryUrl,
                DemoUrl = request.DemoUrl,
                SlideUrl = request.SlideUrl
            };

            _context.Submissions.Add(submission);
            await _context.SaveChangesAsync();
            await NotifySubmissionReceivedAsync(team, round, isUpdate: false);

            return ServiceResult.Ok(new
            {
                message = "Submission created successfully.",
                submission.SubmissionId
            });
        }

        public async Task<ServiceResult> GetTeamSubmissionsAsync(Guid currentUserId, Guid teamId, bool isAdminOrJudge)
        {
            var team = await _context.Teams
                .Include(t => t.Members)
                .FirstOrDefaultAsync(t => t.TeamId == teamId);

            if (team == null)
                return ServiceResult.NotFound("Team not found.");

            var isMember = team.Members.Any(m => m.UserId == currentUserId);

            if (!isMember && !isAdminOrJudge)
                return ServiceResult.Forbidden();

            var submissions = await _context.Submissions
                .Include(s => s.Round)
                .Include(s => s.Scores.Where(sc => sc.IsLocked))
                    .ThenInclude(sc => sc.Criteria)
                .Include(s => s.Scores.Where(sc => sc.IsLocked))
                    .ThenInclude(sc => sc.Judge)
                .Where(s => s.TeamId == teamId)
                .OrderByDescending(s => s.SubmittedAt)
                .ToListAsync();

            var result = submissions.Select(s =>
            {
                // Teams only ever see finalized (locked) scores.
                var judges = s.Scores
                    .GroupBy(sc => sc.JudgeId)
                    .Select(g => new
                    {
                        judgeName = g.First().Judge?.FullName ?? "Judge",
                        totalScore = Math.Round(g.Sum(sc =>
                            sc.Criteria == null || sc.Criteria.MaxScore == 0
                                ? 0
                                : (sc.ScoreValue / sc.Criteria.MaxScore) * sc.Criteria.Weight), 2),
                        criteria = g.Select(sc => new
                        {
                            criteriaName = sc.Criteria?.CriteriaName ?? "",
                            sc.ScoreValue,
                            maxScore = sc.Criteria?.MaxScore ?? 0,
                            weight = sc.Criteria?.Weight ?? 0,
                            comment = sc.Comment
                        }).ToList()
                    })
                    .ToList();

                return new
                {
                    s.SubmissionId,
                    s.RepositoryUrl,
                    s.DemoUrl,
                    s.SlideUrl,
                    s.SubmittedAt,
                    round = new
                    {
                        s.Round!.RoundId,
                        s.Round.RoundName
                    },
                    evaluation = new
                    {
                        isScored = judges.Count > 0,
                        averageScore = judges.Count > 0 ? Math.Round(judges.Average(j => j.totalScore), 2) : 0,
                        judges
                    }
                };
            }).ToList();

            return ServiceResult.Ok(result);
        }

        public async Task<ServiceResult> GetRoundSubmissionsAsync(Guid roundId)
        {
            var submissions = await _context.Submissions
                .Include(s => s.Team)
                    .ThenInclude(t => t.Category)
                .Where(s => s.RoundId == roundId)
                .Select(s => new
                {
                    s.SubmissionId,
                    s.RepositoryUrl,
                    s.DemoUrl,
                    s.SlideUrl,
                    s.SubmittedAt,
                    team = new
                    {
                        s.Team!.TeamId,
                        s.Team.TeamName,
                        category = s.Team.Category!.CategoryName
                    }
                })
                .ToListAsync();

            return ServiceResult.Ok(submissions);
        }

        public async Task<ServiceResult> GetScoringQueueAsync(Guid userId, bool isAdmin)
        {
            IQueryable<Submission> query = _context.Submissions;

            if (!isAdmin)
            {
                query = query.Where(s => _context.JudgeAssignments.Any(a =>
                    a.JudgeId == userId &&
                    a.RoundId == s.RoundId &&
                    a.CategoryId == s.Team!.CategoryId &&
                    (a.TeamId == null || a.TeamId == s.TeamId)));
            }

            var submissions = await query
                .Include(s => s.Team)
                    .ThenInclude(t => t.Category)
                .Include(s => s.Round)
                .ToListAsync();

            var submissionIds = submissions.Select(s => s.SubmissionId).ToList();

            var scoresQuery = _context.Scores
                .Where(s => submissionIds.Contains(s.SubmissionId));

            if (!isAdmin)
            {
                scoresQuery = scoresQuery.Where(s => s.JudgeId == userId);
            }

            var userScores = await scoresQuery.ToListAsync();

            var result = submissions.Select(s =>
            {
                var scoresForSub = userScores.Where(sc => sc.SubmissionId == s.SubmissionId).ToList();
                var status = "pending";
                if (scoresForSub.Any())
                {
                    status = scoresForSub.All(sc => sc.IsLocked) ? "locked" : "scored";
                }

                return new
                {
                    s.SubmissionId,
                    s.RepositoryUrl,
                    s.DemoUrl,
                    s.SlideUrl,
                    s.SubmittedAt,
                    status,
                    team = new
                    {
                        s.Team!.TeamId,
                        s.Team.TeamName,
                        category = s.Team.Category!.CategoryName
                    },
                    round = new
                    {
                        s.Round!.RoundId,
                        s.Round.RoundName
                    }
                };
            }).ToList();

            return ServiceResult.Ok(result);
        }
    }
}
