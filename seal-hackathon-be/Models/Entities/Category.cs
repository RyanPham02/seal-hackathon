using System.ComponentModel.DataAnnotations;

namespace SEAL.NET.Models.Entities
{
    public class Category
    {
        public Guid CategoryId { get; set; } = Guid.NewGuid();

        [MaxLength(100)]
        public string CategoryName { get; set; } = string.Empty;

        public string? Description { get; set; }

        public Guid EventId { get; set; }
        public Event Event { get; set; } = null!;

        public List<Team> Teams { get; set; } = [];
        public List<JudgeAssignment> JudgeAssignments { get; set; } = [];
    }
}
