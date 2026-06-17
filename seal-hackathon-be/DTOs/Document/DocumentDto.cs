namespace SEAL.NET.DTOs.Document
{
    public class DocumentDto
    {
        public Guid DocumentId { get; set; }
        public string FileName { get; set; } = string.Empty;
        public string ContentType { get; set; } = string.Empty;
        public long Size { get; set; }
        public string? UploaderName { get; set; }
        public DateTime UploadedAt { get; set; }
    }
}
