using System.ComponentModel.DataAnnotations;

namespace SEAL.NET.Models.Entities
{
    public class Submission
    {
        public Guid SubmissionId { get; set; } = Guid.NewGuid();
        public string Title { get; set; } = string.Empty;

        [MaxLength(500)]
        public string? FileUrl { get; set; }

        [MaxLength(500)]
        public string? RepositoryUrl { get; set; }

        [MaxLength(500)]
        public string? DemoUrl { get; set; }

        [MaxLength(500)]
        public string? SlideUrl { get; set; }

        public DateTime SubmittedAt { get; set; } = DateTime.UtcNow;

        public Guid RoundId { get; set; }
        public Round Round { get; set; } = null!;

        public Guid TeamId { get; set; }
        public Team Team { get; set; } = null!;

        public List<Score> Scores { get; set; } = [];
    }
}
