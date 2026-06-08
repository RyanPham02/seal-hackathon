using Microsoft.AspNetCore.Identity;
using System.ComponentModel.DataAnnotations;
using SEAL.NET.Models.Enums;

namespace SEAL.NET.Models.Entities
{
    public class ApplicationUser : IdentityUser<Guid>
    {
        [Required]
        [MaxLength(100)]
        public string FullName { get; set; } = string.Empty;

        public bool IsApproved { get; set; } = false;
        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

        public StudentType? StudentType { get; set; }

        [MaxLength(50)]
        public string? StudentCode { get; set; }

        [MaxLength(150)]
        public string? SchoolName { get; set; }

        [MaxLength(100)]
        public string? PlainPassword { get; set; }

        public ICollection<Team> LedTeams { get; set; } = new List<Team>();
        public ICollection<TeamMember> TeamMemberships { get; set; } = new List<TeamMember>();
        public ICollection<JudgeAssignment> JudgeAssignments { get; set; } = new List<JudgeAssignment>();
        public ICollection<Score> ScoresGiven { get; set; } = new List<Score>();
    }
}