using System;

namespace SEAL.NET.DTOs.Team
{
    public class AssignMentorRequest
    {
        public Guid MentorUserId { get; set; }
        public Guid TeamId { get; set; }
    }

    public class ChooseMentorRequest
    {
        public Guid MentorUserId { get; set; }
    }

    public class MentorAssignmentResponseDto
    {
        public Guid Id { get; set; }
        public Guid MentorUserId { get; set; }
        public string MentorName { get; set; } = string.Empty;
        public string MentorEmail { get; set; } = string.Empty;
        public Guid TeamId { get; set; }
        public string TeamName { get; set; } = string.Empty;
        public string? AssignedByName { get; set; }
        public DateTime AssignedAt { get; set; }
        public bool IsActive { get; set; }
    }

    public class MentorTeamResponseDto
    {
        public Guid TeamId { get; set; }
        public string TeamName { get; set; } = string.Empty;
        public string CategoryName { get; set; } = string.Empty;
        public string EventName { get; set; } = string.Empty;
        public string Status { get; set; } = string.Empty;
        public int MembersCount { get; set; }
        public string? Notes { get; set; }
        public MentorTeamSubmissionDto? LatestSubmission { get; set; }
    }

    public class MentorTeamSubmissionDto
    {
        public Guid SubmissionId { get; set; }
        public string? RepositoryUrl { get; set; }
        public string? DemoUrl { get; set; }
        public string? SlideUrl { get; set; }
        public DateTime SubmittedAt { get; set; }
        public string RoundName { get; set; } = string.Empty;
    }

    public class SaveNotesRequest
    {
        public string? Notes { get; set; }
    }
}
