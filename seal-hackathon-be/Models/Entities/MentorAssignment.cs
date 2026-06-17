using System;
using System.ComponentModel.DataAnnotations;

namespace SEAL.NET.Models.Entities
{
    public class MentorAssignment
    {
        public Guid Id { get; set; } = Guid.NewGuid();

        public Guid MentorUserId { get; set; }
        public ApplicationUser Mentor { get; set; } = null!;

        public Guid TeamId { get; set; }
        public Team Team { get; set; } = null!;

        public Guid? AssignedByUserId { get; set; }
        public ApplicationUser? AssignedBy { get; set; }

        public DateTime AssignedAt { get; set; } = DateTime.UtcNow;

        public bool IsActive { get; set; } = true;

        public string? Notes { get; set; }
    }
}
