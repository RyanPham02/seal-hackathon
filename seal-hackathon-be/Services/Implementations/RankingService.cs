using Microsoft.EntityFrameworkCore;
using SEAL.NET.Data;
using SEAL.NET.Services.Interfaces;

namespace SEAL.NET.Services.Implementations
{
    public class RankingService : IRankingService
    {
        private readonly ApplicationDbContext _context;

        public RankingService(ApplicationDbContext context)
        {
            _context = context;
        }

        public async Task<object> GetRoundRankingAsync(Guid roundId)
        {
            var ranking = await _context.Submissions
                .Include(s => s.Team)
                    .ThenInclude(t => t.Category)
                .Include(s => s.Scores)
                    .ThenInclude(sc => sc.Criteria)
                .Where(s => s.RoundId == roundId)
                .Select(s => new
                {
                    s.SubmissionId,
                    teamId = s.Team!.TeamId,
                    teamName = s.Team.TeamName,
                    categoryName = s.Team.Category!.CategoryName,
                    totalScore = s.Scores.Sum(sc =>
                        sc.Criteria == null || sc.Criteria.MaxScore == 0
                            ? 0
                            : (sc.ScoreValue / sc.Criteria.MaxScore) * sc.Criteria.Weight),
                    submittedAt = s.SubmittedAt
                })
                .OrderByDescending(x => x.totalScore)
                .ThenBy(x => x.submittedAt)
                .ToListAsync();

            return ranking.Select((r, index) => new
            {
                rank = index + 1,
                r.SubmissionId,
                r.teamId,
                r.teamName,
                r.categoryName,
                r.totalScore,
                r.submittedAt
            });
        }

        public async Task<object> GetCategoryRoundRankingAsync(Guid categoryId, Guid roundId)
        {
            var ranking = await _context.Submissions
                .Include(s => s.Team)
                .Include(s => s.Scores)
                    .ThenInclude(sc => sc.Criteria)
                .Where(s =>
                    s.RoundId == roundId &&
                    s.Team!.CategoryId == categoryId)
                .Select(s => new
                {
                    s.SubmissionId,
                    teamId = s.Team!.TeamId,
                    teamName = s.Team.TeamName,
                    totalScore = s.Scores.Sum(sc =>
                        sc.Criteria == null || sc.Criteria.MaxScore == 0
                            ? 0
                            : (sc.ScoreValue / sc.Criteria.MaxScore) * sc.Criteria.Weight),
                    submittedAt = s.SubmittedAt
                })
                .OrderByDescending(x => x.totalScore)
                .ThenBy(x => x.submittedAt)
                .ToListAsync();

            return ranking.Select((r, index) => new
            {
                rank = index + 1,
                r.SubmissionId,
                r.teamId,
                r.teamName,
                r.totalScore,
                r.submittedAt
            });
        }
    }
}
