namespace SEAL.NET.DTOs.Analytics
{
    public class CriterionReliabilityDto
    {
        public Guid CriteriaId { get; set; }
        public string Criterion { get; set; } = string.Empty;
        public double? Icc { get; set; }
        public string Agreement { get; set; } = "Insufficient data";
        public double AvgScore { get; set; }
    }

    public class JudgeAverageDto
    {
        public string Judge { get; set; } = string.Empty;
        public double AvgScore { get; set; }
    }

    public class TeamVarianceDto
    {
        public string Team { get; set; } = string.Empty;
        public List<JudgeAverageDto> Judges { get; set; } = [];
    }

    public class CriterionAverageDto
    {
        public string Criterion { get; set; } = string.Empty;
        public double AvgScore { get; set; }
    }

    public class InterRaterAnalyticsDto
    {
        public double? OverallIcc { get; set; }
        public int JudgeCount { get; set; }
        public int SubmissionCount { get; set; }
        public int CriteriaCount { get; set; }
        public List<CriterionReliabilityDto> ByCriterion { get; set; } = [];
        public List<TeamVarianceDto> Variance { get; set; } = [];
        public List<CriterionAverageDto> CriterionAverages { get; set; } = [];
    }
}
