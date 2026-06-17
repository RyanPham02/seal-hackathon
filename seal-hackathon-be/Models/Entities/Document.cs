using System.ComponentModel.DataAnnotations;

namespace SEAL.NET.Models.Entities
{
    public class Document
    {
        public Guid DocumentId { get; set; } = Guid.NewGuid();

        [MaxLength(255)]
        public string FileName { get; set; } = string.Empty;

        [MaxLength(150)]
        public string ContentType { get; set; } = "application/octet-stream";

        public long Size { get; set; }

        public byte[] Content { get; set; } = Array.Empty<byte>();

        public Guid? UploaderId { get; set; }
        public ApplicationUser? Uploader { get; set; }

        public DateTime UploadedAt { get; set; } = DateTime.UtcNow;
    }
}
