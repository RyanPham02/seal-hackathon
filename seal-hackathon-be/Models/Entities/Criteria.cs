using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace SEAL.NET.Models.Entities
{
    public class Criteria
    {
        public Guid CriteriaId { get; set; } = Guid.NewGuid();

        [MaxLength(100)]
        public string CriteriaName { get; set; } = string.Empty;

        public string? Description { get; set; }

        [Column(TypeName = "decimal(5,2)")]
        public decimal Weight { get; set; }

        [Column(TypeName = "decimal(5,2)")]
        public decimal MaxScore { get; set; }

        public Guid RoundId { get; set; }
        public Round Round { get; set; } = null!;

        public List<Score> Scores { get; set; } = [];
    }
}
