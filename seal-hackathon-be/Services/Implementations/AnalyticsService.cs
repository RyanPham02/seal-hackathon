using Microsoft.EntityFrameworkCore;
using SEAL.NET.Data;
using SEAL.NET.DTOs.Analytics;
using SEAL.NET.Services.Interfaces;

namespace SEAL.NET.Services.Implementations
{
    public class AnalyticsService : IAnalyticsService
    {
        private readonly ApplicationDbContext _context;

        public AnalyticsService(ApplicationDbContext context)
        {
            _context = context;
        }

        public async Task<InterRaterAnalyticsDto> GetInterRaterAsync(Guid? eventId)
        {
            var query = _context.Scores.AsNoTracking()
                .Include(s => s.Criteria)
                .Include(s => s.Judge)
                .Include(s => s.Submission!).ThenInclude(sub => sub.Team)
                .Include(s => s.Submission!).ThenInclude(sub => sub.Round)
                .AsQueryable();

            if (eventId.HasValue)
                query = query.Where(s => s.Submission!.Round.EventId == eventId.Value);

            var scores = await query
                .Select(s => new ScoreRow
                {
                    CriteriaId = s.CriteriaId,
                    CriteriaName = s.Criteria!.CriteriaName,
                    SubmissionId = s.SubmissionId,
                    TeamName = s.Submission!.Team.TeamName,
                    JudgeId = s.JudgeId,
                    JudgeName = s.Judge!.FullName,
                    Value = (double)s.ScoreValue
                })
                .ToListAsync();

            var result = new InterRaterAnalyticsDto
            {
                JudgeCount = scores.Select(s => s.JudgeId).Distinct().Count(),
                SubmissionCount = scores.Select(s => s.SubmissionId).Distinct().Count(),
                CriteriaCount = scores.Select(s => s.CriteriaId).Distinct().Count()
            };

            // ICC + average per criterion
            foreach (var group in scores.GroupBy(s => new { s.CriteriaId, s.CriteriaName }))
            {
                var icc = ComputeOneWayIcc(group.Select(g => (g.SubmissionId, g.Value)));
                result.ByCriterion.Add(new CriterionReliabilityDto
                {
                    CriteriaId = group.Key.CriteriaId,
                    Criterion = group.Key.CriteriaName,
                    Icc = icc,
                    Agreement = AgreementLabel(icc),
                    AvgScore = Math.Round(group.Average(g => g.Value), 2)
                });

                result.CriterionAverages.Add(new CriterionAverageDto
                {
                    Criterion = group.Key.CriteriaName,
                    AvgScore = Math.Round(group.Average(g => g.Value), 2)
                });
            }

            var validIccs = result.ByCriterion.Where(c => c.Icc.HasValue).Select(c => c.Icc!.Value).ToList();
            result.OverallIcc = validIccs.Count > 0 ? Math.Round(validIccs.Average(), 3) : (double?)null;

            // Variance per team across judges (avg score each judge gave the team, across criteria)
            result.Variance = scores
                .GroupBy(s => s.SubmissionId)
                .Take(10)
                .Select(subGroup => new TeamVarianceDto
                {
                    Team = subGroup.First().TeamName,
                    Judges = subGroup
                        .GroupBy(s => new { s.JudgeId, s.JudgeName })
                        .Select(jg => new JudgeAverageDto
                        {
                            Judge = jg.Key.JudgeName,
                            AvgScore = Math.Round(jg.Average(g => g.Value), 2)
                        })
                        .ToList()
                })
                .ToList();

            return result;
        }

        private static string AgreementLabel(double? icc)
        {
            if (!icc.HasValue) return "Insufficient data";
            if (icc.Value >= 0.8) return "Very High";
            if (icc.Value >= 0.7) return "High";
            if (icc.Value >= 0.5) return "Moderate";
            return "Low";
        }

        // One-way random effects ICC(1) from (target, rating) pairs.
        private static double? ComputeOneWayIcc(IEnumerable<(Guid Target, double Value)> data)
        {
            var groups = data
                .GroupBy(d => d.Target)
                .Select(g => g.Select(x => x.Value).ToList())
                .Where(g => g.Count > 0)
                .ToList();

            int k = groups.Count;                 // number of targets (submissions)
            int n = groups.Sum(g => g.Count);     // total ratings
            if (k < 2 || n <= k) return null;     // need multiple targets and within-group ratings

            double grandMean = groups.SelectMany(g => g).Average();

            double ssb = groups.Sum(g => g.Count * Math.Pow(g.Average() - grandMean, 2));
            double ssw = groups.Sum(g => g.Sum(v => Math.Pow(v - g.Average(), 2)));

            double dfb = k - 1;
            double dfw = n - k;
            if (dfw <= 0) return null;

            double msb = ssb / dfb;
            double msw = ssw / dfw;

            // average group size adjusted (n0)
            double sumSq = groups.Sum(g => (double)g.Count * g.Count);
            double n0 = (n - sumSq / n) / (k - 1);
            if (n0 <= 0) return null;

            double denom = msb + (n0 - 1) * msw;
            if (Math.Abs(denom) < 1e-9) return null;

            double icc = (msb - msw) / denom;
            if (icc < 0) icc = 0;           // negative ICC has no practical meaning
            if (icc > 1) icc = 1;
            return Math.Round(icc, 3);
        }

        private class ScoreRow
        {
            public Guid CriteriaId { get; set; }
            public string CriteriaName { get; set; } = string.Empty;
            public Guid SubmissionId { get; set; }
            public string TeamName { get; set; } = string.Empty;
            public Guid JudgeId { get; set; }
            public string JudgeName { get; set; } = string.Empty;
            public double Value { get; set; }
        }
    }
}
