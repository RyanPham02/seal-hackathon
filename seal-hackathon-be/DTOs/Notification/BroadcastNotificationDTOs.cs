using System.ComponentModel.DataAnnotations;

namespace SEAL.NET.DTOs.Notification
{
    public class BroadcastNotificationRequest
    {
        [Required]
        [MaxLength(150)]
        public string Title { get; set; } = string.Empty;

        [Required]
        [MaxLength(1000)]
        public string Message { get; set; } = string.Empty;

        [MaxLength(50)]
        public string Type { get; set; } = "info";
    }

    public class BroadcastNotificationHistoryDto
    {
        public Guid BroadcastId { get; set; }
        public string Title { get; set; } = string.Empty;
        public string Message { get; set; } = string.Empty;
        public string Type { get; set; } = string.Empty;
        public DateTime CreatedAt { get; set; }
        public int RecipientCount { get; set; }
    }
}
