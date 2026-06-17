using SEAL.NET.Models.Enums;
using System;
using System.ComponentModel.DataAnnotations;

namespace SEAL.NET.Models.Entities
{
    public class TeamInvitation
    {
        public Guid Id { get; set; } = Guid.NewGuid();

        public Guid TeamId { get; set; }
        public Team Team { get; set; } = null!;

        public Guid InviterUserId { get; set; }
        public ApplicationUser InviterUser { get; set; } = null!;

        public Guid InviteeUserId { get; set; }
        public ApplicationUser InviteeUser { get; set; } = null!;

        public InvitationStatus Status { get; set; } = InvitationStatus.Pending;

        [MaxLength(500)]
        public string? Message { get; set; }

        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

        public DateTime? RespondedAt { get; set; }
    }
}
