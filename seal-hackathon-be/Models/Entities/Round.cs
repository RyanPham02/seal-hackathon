using System.ComponentModel.DataAnnotations;

namespace SEAL.NET.Models.Entities
{
    public class Round
    {
        public Guid RoundId { get; set; } = Guid.NewGuid();

        [MaxLength(100)]
        public string RoundName { get; set; } = string.Empty;

        public int RoundOrder { get; set; }
        public int MaxTeamsAdvancing { get; set; }
        public DateTime? SubmissionDeadline { get; set; }

        public Guid EventId { get; set; }
        public Event Event { get; set; } = null!;

        public List<Criteria> CriteriaList { get; set; } = [];
        public List<JudgeAssignment> JudgeAssignments { get; set; } = [];
        public List<Submission> Submissions { get; set; } = [];
    }
}
