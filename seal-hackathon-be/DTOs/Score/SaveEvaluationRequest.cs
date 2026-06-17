using System.ComponentModel.DataAnnotations;

namespace SEAL.NET.DTOs.Score
{
    public class SaveEvaluationRequest
    {
        [Required]
        public Guid SubmissionId { get; set; }

        /// <summary>When true, marks all scores as finalized and locked.</summary>
        public bool Finalize { get; set; } = false;

        [Required]
        public List<SaveCriterionScoreDto> Scores { get; set; } = [];
    }

    public class SaveCriterionScoreDto
    {
        [Required]
        public Guid CriteriaId { get; set; }

        [Range(0, 100)]
        public decimal ScoreValue { get; set; }

        public string? Comment { get; set; }
    }
}
