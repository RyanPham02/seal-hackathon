using Microsoft.EntityFrameworkCore;
using SEAL.NET.Data;
using SEAL.NET.DTOs.Score;
using SEAL.NET.Models.Entities;
using SEAL.NET.Services.Common;
using SEAL.NET.Services.Interfaces;

namespace SEAL.NET.Services.Implementations
{
    public class ScoreService : IScoreService
    {
        private readonly ApplicationDbContext _context;
        private readonly INotificationService _notificationService;

        public ScoreService(ApplicationDbContext context, INotificationService notificationService)
        {
            _context = context;
            _notificationService = notificationService;
        }

        public async Task<ServiceResult> SubmitScoreAsync(Guid judgeId, CreateScoreRequest request)
        {
            var submission = await _context.Submissions
                .Include(s => s.Team)
                .Include(s => s.Round)
                .FirstOrDefaultAsync(s => s.SubmissionId == request.SubmissionId);

            if (submission == null)
                return ServiceResult.NotFound("Submission not found.");

            var criteria = await _context.Criteria
                .FirstOrDefaultAsync(c =>
                    c.CriteriaId == request.CriteriaId &&
                    c.RoundId == submission.RoundId);

            if (criteria == null)
                return ServiceResult.BadRequest("Criteria does not belong to this submission round.");

            if (request.ScoreValue < 0 || request.ScoreValue > criteria.MaxScore)
                return ServiceResult.BadRequest($"Score must be between 0 and {criteria.MaxScore}.");

            var isAssigned = await _context.JudgeAssignments.AnyAsync(a =>
                a.JudgeId == judgeId &&
                a.RoundId == submission.RoundId &&
                a.CategoryId == submission.Team!.CategoryId &&
                (a.TeamId == null || a.TeamId == submission.TeamId));

            if (!isAssigned)
                return ServiceResult.Forbidden();

            var existingScore = await _context.Scores.FirstOrDefaultAsync(s =>
                s.SubmissionId == request.SubmissionId &&
                s.JudgeId == judgeId &&
                s.CriteriaId == request.CriteriaId);

            if (existingScore != null)
            {
                existingScore.ScoreValue = request.ScoreValue;
                existingScore.Comment = request.Comment;
                existingScore.CreatedAt = DateTime.UtcNow;

                await _context.SaveChangesAsync();

                return ServiceResult.OkMessage("Score updated successfully.");
            }

            var score = new Score
            {
                SubmissionId = request.SubmissionId,
                JudgeId = judgeId,
                CriteriaId = request.CriteriaId,
                ScoreValue = request.ScoreValue,
                Comment = request.Comment
            };

            _context.Scores.Add(score);
            await _context.SaveChangesAsync();

            return ServiceResult.Ok(new { message = "Score submitted successfully.", score.ScoreId });
        }

        public async Task<ServiceResult> GetMyAssignedSubmissionsAsync(Guid judgeId)
        {
            var submissions = await _context.Submissions
                .Include(s => s.Team)
                    .ThenInclude(t => t.Category)
                .Include(s => s.Round)
                .Where(s => _context.JudgeAssignments.Any(a =>
                    a.JudgeId == judgeId &&
                    a.RoundId == s.RoundId &&
                    a.CategoryId == s.Team!.CategoryId &&
                    (a.TeamId == null || a.TeamId == s.TeamId)))
                .Select(s => new
                {
                    s.SubmissionId,
                    s.RepositoryUrl,
                    s.DemoUrl,
                    s.SlideUrl,
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
                })
                .ToListAsync();

            return ServiceResult.Ok(submissions);
        }

        public async Task<ServiceResult> GetEvaluationAsync(Guid judgeId, Guid submissionId, bool isAdmin)
        {
            var submission = await _context.Submissions
                .Include(s => s.Team)
                    .ThenInclude(t => t.Category)
                .Include(s => s.Round)
                .FirstOrDefaultAsync(s => s.SubmissionId == submissionId);

            if (submission == null)
                return ServiceResult.NotFound("Submission not found.");

            if (!isAdmin)
            {
                var isAssigned = await _context.JudgeAssignments.AnyAsync(a =>
                    a.JudgeId == judgeId &&
                    a.RoundId == submission.RoundId &&
                    a.CategoryId == submission.Team!.CategoryId &&
                    (a.TeamId == null || a.TeamId == submission.TeamId));

                if (!isAssigned)
                    return ServiceResult.Forbidden();
            }

            var criteria = await _context.Criteria
                .Where(c => c.RoundId == submission.RoundId)
                .ToListAsync();

            var scoresQuery = _context.Scores
                .Include(s => s.Judge)
                .Where(s => s.SubmissionId == submissionId);

            if (!isAdmin)
            {
                scoresQuery = scoresQuery.Where(s => s.JudgeId == judgeId);
            }

            var existingScores = await scoresQuery.ToListAsync();

            var isLocked = isAdmin || (existingScores.Any() && existingScores.All(s => s.IsLocked));

            var response = new ScoreEvaluationResponse
            {
                SubmissionId = submission.SubmissionId,
                RepositoryUrl = submission.RepositoryUrl,
                DemoUrl = submission.DemoUrl,
                SlideUrl = submission.SlideUrl,
                SubmittedAt = submission.SubmittedAt,
                IsLocked = isLocked,
                Team = new EvaluationTeamDto
                {
                    TeamId = submission.Team!.TeamId,
                    TeamName = submission.Team.TeamName,
                    Category = submission.Team.Category?.CategoryName ?? ""
                },
                Round = new EvaluationRoundDto
                {
                    RoundId = submission.Round!.RoundId,
                    RoundName = submission.Round.RoundName
                },
                Criteria = criteria.Select(c =>
                {
                    var scoresForCrit = existingScores.Where(s => s.CriteriaId == c.CriteriaId).ToList();
                    decimal? scoreValue = null;
                    string? comment = null;

                    if (isAdmin)
                    {
                        if (scoresForCrit.Any())
                        {
                            scoreValue = Math.Round(scoresForCrit.Average(s => s.ScoreValue), 2);
                            
                            var comments = scoresForCrit
                                .Where(s => !string.IsNullOrWhiteSpace(s.Comment))
                                .Select(s => $"{(s.Judge != null ? s.Judge.FullName : "Judge")}: {s.Comment}");

                            comment = comments.Any() ? string.Join("\n", comments) : null;
                        }
                    }
                    else
                    {
                        var existing = scoresForCrit.FirstOrDefault(s => s.JudgeId == judgeId);
                        scoreValue = existing?.ScoreValue;
                        comment = existing?.Comment;
                    }

                    return new CriterionScoreItemDto
                    {
                        CriteriaId = c.CriteriaId,
                        CriteriaName = c.CriteriaName,
                        Description = c.Description,
                        Weight = c.Weight,
                        MaxScore = c.MaxScore,
                        ScoreValue = scoreValue,
                        Comment = comment
                    };
                }).ToList()
            };

            return ServiceResult.Ok(response);
        }

        public async Task<ServiceResult> SaveEvaluationAsync(Guid judgeId, SaveEvaluationRequest request, bool isAdmin)
        {
            if (isAdmin)
                return ServiceResult.Forbidden();

            var submission = await _context.Submissions
                .Include(s => s.Team)
                    .ThenInclude(t => t!.Members)
                .Include(s => s.Round)
                .FirstOrDefaultAsync(s => s.SubmissionId == request.SubmissionId);

            if (submission == null)
                return ServiceResult.NotFound("Submission not found.");

            if (!isAdmin)
            {
                var isAssigned = await _context.JudgeAssignments.AnyAsync(a =>
                    a.JudgeId == judgeId &&
                    a.RoundId == submission.RoundId &&
                    a.CategoryId == submission.Team!.CategoryId &&
                    (a.TeamId == null || a.TeamId == submission.TeamId));

                if (!isAssigned)
                    return ServiceResult.Forbidden();
            }

            // Check if already locked
            var existingScores = await _context.Scores
                .Where(s => s.SubmissionId == request.SubmissionId && s.JudgeId == judgeId)
                .ToListAsync();

            if (existingScores.Any(s => s.IsLocked))
                return ServiceResult.BadRequest("Scores have already been finalized and cannot be edited.");

            // Load criteria for this round to validate score ranges
            var roundCriteria = await _context.Criteria
                .Where(c => c.RoundId == submission.RoundId)
                .ToListAsync();

            var roundCriteriaIds = roundCriteria.Select(c => c.CriteriaId).ToHashSet();

            foreach (var item in request.Scores)
            {
                if (!roundCriteriaIds.Contains(item.CriteriaId))
                    return ServiceResult.BadRequest($"Criteria {item.CriteriaId} does not belong to this submission's round.");

                var criteriaEntity = roundCriteria.First(c => c.CriteriaId == item.CriteriaId);
                if (item.ScoreValue < 0 || item.ScoreValue > criteriaEntity.MaxScore)
                    return ServiceResult.BadRequest($"Score for '{criteriaEntity.CriteriaName}' must be between 0 and {criteriaEntity.MaxScore}.");
            }

            // Upsert scores
            foreach (var item in request.Scores)
            {
                var existing = existingScores.FirstOrDefault(s => s.CriteriaId == item.CriteriaId);
                if (existing != null)
                {
                    existing.ScoreValue = item.ScoreValue;
                    existing.Comment = item.Comment;
                    existing.IsLocked = request.Finalize;
                    existing.CreatedAt = DateTime.UtcNow;
                }
                else
                {
                    _context.Scores.Add(new Score
                    {
                        SubmissionId = request.SubmissionId,
                        JudgeId = judgeId,
                        CriteriaId = item.CriteriaId,
                        ScoreValue = item.ScoreValue,
                        Comment = item.Comment,
                        IsLocked = request.Finalize
                    });
                }
            }

            await _context.SaveChangesAsync();

            if (request.Finalize)
            {
                var memberIds = submission.Team!.Members.Select(m => m.UserId);

                await _notificationService.CreateForUsersAsync(
                    memberIds,
                    "Your submission has been scored",
                    $"A judge has finalized the evaluation of your submission for round '{submission.Round!.RoundName}'. " +
                    "Open the Submission page to view your score and the judge's feedback.",
                    "success");
            }

            var msg = request.Finalize
                ? "Scores finalized and locked successfully."
                : "Draft scores saved successfully.";

            return ServiceResult.OkMessage(msg);
        }
    }
}