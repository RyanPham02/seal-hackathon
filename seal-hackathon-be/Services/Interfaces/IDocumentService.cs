using SEAL.NET.Services.Common;

namespace SEAL.NET.Services.Interfaces
{
    /// <summary>A document's bytes ready to stream back to the client.</summary>
    public sealed record DocumentDownload(byte[] Content, string ContentType, string FileName);

    public interface IDocumentService
    {
        Task<ServiceResult> GetDocumentsAsync();
        Task<ServiceResult> UploadAsync(Guid? uploaderId, string fileName, string? contentType, long length, Stream content);
        Task<DocumentDownload?> GetDownloadAsync(Guid id);
        Task<ServiceResult> DeleteAsync(Guid id, Guid? currentUserId, bool isAdmin);
        Task<ServiceResult> GetStorageStatsAsync();
    }
}
