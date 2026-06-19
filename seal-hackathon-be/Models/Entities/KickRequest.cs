using System;
using System.ComponentModel.DataAnnotations;

namespace SEAL.NET.Models.Entities
{
    public class KickRequest
    {
        [Key]
        public Guid KickRequestId { get; set; } = Guid.NewGuid();

        public Guid TeamId { get; set; }
        public Team Team { get; set; } = null!;

        public Guid UserId { get; set; }
        public ApplicationUser User { get; set; } = null!;

        public string Reason { get; set; } = string.Empty;
        public string Status { get; set; } = "Pending"; // Pending, Approved, Rejected

        public DateTime RequestedAt { get; set; } = DateTime.UtcNow;
    }
}
