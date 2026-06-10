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

        public ScoreService(ApplicationDbContext context)
        {
            _context = context;
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
                a.CategoryId == submission.Team!.CategoryId);

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
            var assignments = await _context.JudgeAssignments
                .Where(a => a.JudgeId == judgeId)
                .ToListAsync();

            var roundIds = assignments.Select(a => a.RoundId).ToList();
            var categoryIds = assignments.Select(a => a.CategoryId).ToList();

            var submissions = await _context.Submissions
                .Include(s => s.Team)
                    .ThenInclude(t => t.Category)
                .Include(s => s.Round)
                .Where(s =>
                    roundIds.Contains(s.RoundId) &&
                    categoryIds.Contains(s.Team!.CategoryId))
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
                    a.CategoryId == submission.Team!.CategoryId);

                if (!isAssigned)
                    return ServiceResult.Forbidden();
            }

            var criteria = await _context.Criteria
                .Where(c => c.RoundId == submission.RoundId)
                .ToListAsync();

            var existingScores = await _context.Scores
                .Where(s => s.SubmissionId == submissionId && s.JudgeId == judgeId)
                .ToListAsync();

            var isLocked = existingScores.Any() && existingScores.All(s => s.IsLocked);

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
                    var existing = existingScores.FirstOrDefault(s => s.CriteriaId == c.CriteriaId);
                    return new CriterionScoreItemDto
                    {
                        CriteriaId = c.CriteriaId,
                        CriteriaName = c.CriteriaName,
                        Description = c.Description,
                        Weight = c.Weight,
                        MaxScore = c.MaxScore,
                        ScoreValue = existing?.ScoreValue,
                        Comment = existing?.Comment
                    };
                }).ToList()
            };

            return ServiceResult.Ok(response);
        }

        public async Task<ServiceResult> SaveEvaluationAsync(Guid judgeId, SaveEvaluationRequest request, bool isAdmin)
        {
            var submission = await _context.Submissions
                .Include(s => s.Team)
                .Include(s => s.Round)
                .FirstOrDefaultAsync(s => s.SubmissionId == request.SubmissionId);

            if (submission == null)
                return ServiceResult.NotFound("Submission not found.");

            if (!isAdmin)
            {
                var isAssigned = await _context.JudgeAssignments.AnyAsync(a =>
                    a.JudgeId == judgeId &&
                    a.RoundId == submission.RoundId &&
                    a.CategoryId == submission.Team!.CategoryId);

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

            var msg = request.Finalize
                ? "Scores finalized and locked successfully."
                : "Draft scores saved successfully.";

            return ServiceResult.OkMessage(msg);
        }
    }
}
