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

        public SubmissionService(ApplicationDbContext context)
        {
            _context = context;
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
                .Where(s => s.TeamId == teamId)
                .OrderByDescending(s => s.SubmittedAt)
                .Select(s => new
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
                    }
                })
                .ToListAsync();

            return ServiceResult.Ok(submissions);
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
                var assignments = await _context.JudgeAssignments
                    .Where(a => a.JudgeId == userId)
                    .ToListAsync();

                var roundIds = assignments.Select(a => a.RoundId).ToList();
                var categoryIds = assignments.Select(a => a.CategoryId).ToList();

                query = query.Where(s =>
                    roundIds.Contains(s.RoundId) &&
                    categoryIds.Contains(s.Team!.CategoryId));
            }

            var submissions = await query
                .Include(s => s.Team)
                    .ThenInclude(t => t.Category)
                .Include(s => s.Round)
                .ToListAsync();

            var submissionIds = submissions.Select(s => s.SubmissionId).ToList();

            var userScores = await _context.Scores
                .Where(s => submissionIds.Contains(s.SubmissionId) && s.JudgeId == userId)
                .ToListAsync();

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
