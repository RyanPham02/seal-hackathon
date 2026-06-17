using System;
using System.Collections.Generic;

namespace SEAL.NET.DTOs.Team
{
    public class CreateInvitationRequest
    {
        public Guid? InviteeUserId { get; set; }
        public string? StudentCodeOrEmail { get; set; }
        public string? Message { get; set; }
    }

    public class InvitationResponseDto
    {
        public Guid Id { get; set; }
        public Guid TeamId { get; set; }
        public string TeamName { get; set; } = string.Empty;
        public Guid InviterUserId { get; set; }
        public string InviterUserName { get; set; } = string.Empty;
        public Guid InviteeUserId { get; set; }
        public string InviteeUserName { get; set; } = string.Empty;
        public string InviteeUserEmail { get; set; } = string.Empty;
        public string Status { get; set; } = string.Empty;
        public string? Message { get; set; }
        public DateTime CreatedAt { get; set; }
        public DateTime? RespondedAt { get; set; }
    }

    public class FreeAgentDto
    {
        public Guid Id { get; set; }
        public string Name { get; set; } = string.Empty;
        public string Email { get; set; } = string.Empty;
        public string? StudentCode { get; set; }
        public string? SchoolName { get; set; }
        public string StudentType { get; set; } = string.Empty;
        public string Role { get; set; } = string.Empty;
        public List<string> Skills { get; set; } = [];
        public int Xp { get; set; }
    }

    public class MatchmakingSuggestionDto
    {
        public Guid Id { get; set; }
        public string Name { get; set; } = string.Empty;
        public string Email { get; set; } = string.Empty;
        public string Role { get; set; } = string.Empty;
        public List<string> Skills { get; set; } = [];
        public int Xp { get; set; }
        public int MatchPercentage { get; set; }
        public List<string> MatchReasons { get; set; } = [];
    }

    public class RecruitingTeamDto
    {
        public Guid TeamId { get; set; }
        public string TeamName { get; set; } = string.Empty;
        public string CategoryName { get; set; } = string.Empty;
        public string LeaderName { get; set; } = string.Empty;
        public int MemberCount { get; set; }
        public List<string> Members { get; set; } = [];
        public bool HasPendingRequest { get; set; }
    }
}
