using System.ComponentModel.DataAnnotations;

namespace SEAL.NET.DTOs.Judge
{
    public class CreateJudgeAssignmentRequest
    {
        [Required]
        public Guid JudgeId { get; set; }

        [Required]
        public Guid RoundId { get; set; }

        [Required]
        public Guid CategoryId { get; set; }

        public List<Guid> TeamIds { get; set; } = [];
    }
}