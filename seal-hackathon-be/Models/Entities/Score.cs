using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace SEAL.NET.Models.Entities
{
    public class Score
    {
        [Key]
        public Guid ScoreId { get; set; } = Guid.NewGuid();
        public Guid SubmissionId { get; set; }
        public Guid JudgeId { get; set; }
        public Guid CriteriaId { get; set; }

        [Column(TypeName = "decimal(5,2)")]
        public decimal ScoreValue { get; set; }   
        public string? Comment { get; set; }
        public bool IsLocked { get; set; } = false;
        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

        [ForeignKey(nameof(SubmissionId))]
        public Submission? Submission { get; set; }

        [ForeignKey(nameof(JudgeId))]
        public ApplicationUser? Judge { get; set; }

        [ForeignKey(nameof(CriteriaId))]
        public Criteria? Criteria { get; set; }
    }
}