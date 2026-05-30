using System.ComponentModel.DataAnnotations;

namespace SEAL.NET.Models.Entities
{
    public class JudgeAssignment
    {
        [Key]
        public Guid AssignmentId { get; set; } = Guid.NewGuid();

        public Guid RoundId { get; set; }
        public Round Round { get; set; } = null!;

        public Guid CategoryId { get; set; }
        public Category Category { get; set; } = null!;

        public Guid JudgeId { get; set; }
        public ApplicationUser Judge { get; set; } = null!;
    }
}
