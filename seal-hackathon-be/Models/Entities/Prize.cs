using System.ComponentModel.DataAnnotations;

namespace SEAL.NET.Models.Entities
{
    public class Prize
    {
        public Guid PrizeId { get; set; } = Guid.NewGuid();

        public Guid EventId { get; set; }
        public Event? Event { get; set; }

        [MaxLength(150)]
        public string Title { get; set; } = string.Empty;

        [MaxLength(50)]
        public string? Amount { get; set; }

        [MaxLength(150)]
        public string? Track { get; set; }

        [MaxLength(1000)]
        public string? Description { get; set; }

        public int Rank { get; set; }

        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    }
}
