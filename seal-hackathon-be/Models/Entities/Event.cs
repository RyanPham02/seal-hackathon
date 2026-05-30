using System.ComponentModel.DataAnnotations;
using SEAL.NET.Models.Enums;

namespace SEAL.NET.Models.Entities
{
    public class Event
    {
        public Guid EventId { get; set; } = Guid.NewGuid();

        [MaxLength(150)]
        public string EventName { get; set; } = string.Empty;

        [MaxLength(1000)]
        public string? Description { get; set; }

        public DateTime StartDate { get; set; }
        public DateTime EndDate { get; set; }
        public EventStatus Status { get; set; } = EventStatus.Upcoming;
        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

        public List<Category> Categories { get; set; } = [];
        public List<Round> Rounds { get; set; } = [];
    }
}
