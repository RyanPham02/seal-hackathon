using SEAL.NET.Models.Enums;
using System.ComponentModel.DataAnnotations;

namespace SEAL.NET.Models.Entities
{
    public class Team
    {
        public Guid TeamId { get; set; } = Guid.NewGuid();

        [MaxLength(100)]
        public string TeamName { get; set; } = string.Empty;

        public TeamStatus Status { get; set; } = TeamStatus.Pending;
        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

        public int? FinalRank { get; set; }

        [MaxLength(200)]
        public string? FinalPrize { get; set; }

        [MaxLength(500)]
        public string? EliminationReason { get; set; }

        public DateTime? EliminatedAt { get; set; }

        public Guid LeaderId { get; set; }
        public ApplicationUser Leader { get; set; } = null!;

        public Guid? CurrentRoundId { get; set; }
        public Round? CurrentRound { get; set; }

        public Guid CategoryId { get; set; }
        public Category Category { get; set; } = null!;

        public List<TeamMember> Members { get; set; } = [];
        public List<Submission> Submissions { get; set; } = [];
    }
}
