namespace SEAL.NET.DTOs.Score
{
    public class ScoreEvaluationResponse
    {
        public Guid SubmissionId { get; set; }
        public string? RepositoryUrl { get; set; }
        public string? DemoUrl { get; set; }
        public string? SlideUrl { get; set; }
        public DateTime SubmittedAt { get; set; }

        public EvaluationTeamDto? Team { get; set; }
        public EvaluationRoundDto? Round { get; set; }

        public bool IsLocked { get; set; }
        public List<CriterionScoreItemDto> Criteria { get; set; } = [];
    }

    public class EvaluationTeamDto
    {
        public Guid TeamId { get; set; }
        public string TeamName { get; set; } = string.Empty;
        public string Category { get; set; } = string.Empty;
    }

    public class EvaluationRoundDto
    {
        public Guid RoundId { get; set; }
        public string RoundName { get; set; } = string.Empty;
    }

    public class CriterionScoreItemDto
    {
        public Guid CriteriaId { get; set; }
        public string CriteriaName { get; set; } = string.Empty;
        public string? Description { get; set; }
        public decimal Weight { get; set; }
        public decimal MaxScore { get; set; }

        /// <summary>Current judge's score for this criterion, null if not yet scored.</summary>
        public decimal? ScoreValue { get; set; }
        /// <summary>Current judge's comment for this criterion.</summary>
        public string? Comment { get; set; }
    }
}
