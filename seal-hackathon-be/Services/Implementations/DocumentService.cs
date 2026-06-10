using Microsoft.EntityFrameworkCore;
using SEAL.NET.Data;
using SEAL.NET.DTOs.Document;
using SEAL.NET.Models.Entities;
using SEAL.NET.Services.Common;
using SEAL.NET.Services.Interfaces;

namespace SEAL.NET.Services.Implementations
{
    public class DocumentService : IDocumentService
    {
        public const long MaxFileSize = 10 * 1024 * 1024; // 10 MB

        private readonly ApplicationDbContext _context;

        public DocumentService(ApplicationDbContext context)
        {
            _context = context;
        }

        public async Task<ServiceResult> GetDocumentsAsync()
        {
            var documents = await _context.Documents.AsNoTracking()
                .Include(d => d.Uploader)
                .OrderByDescending(d => d.UploadedAt)
                .Select(d => new DocumentDto
                {
                    DocumentId = d.DocumentId,
                    FileName = d.FileName,
                    ContentType = d.ContentType,
                    Size = d.Size,
                    UploaderName = d.Uploader != null ? d.Uploader.FullName : null,
                    UploadedAt = d.UploadedAt
                })
                .ToListAsync();

            return ServiceResult.Ok(documents);
        }

        public async Task<ServiceResult> UploadAsync(Guid? uploaderId, string fileName, string? contentType, long length, Stream content)
        {
            if (length <= 0)
                return ServiceResult.BadRequest("No file uploaded.");

            if (length > MaxFileSize)
                return ServiceResult.BadRequest("File exceeds the 10 MB limit.");

            using var ms = new MemoryStream();
            await content.CopyToAsync(ms);

            var document = new Document
            {
                FileName = Path.GetFileName(fileName),
                ContentType = string.IsNullOrWhiteSpace(contentType) ? "application/octet-stream" : contentType,
                Size = length,
                Content = ms.ToArray(),
                UploaderId = uploaderId
            };

            _context.Documents.Add(document);
            await _context.SaveChangesAsync();

            return ServiceResult.Ok(new DocumentDto
            {
                DocumentId = document.DocumentId,
                FileName = document.FileName,
                ContentType = document.ContentType,
                Size = document.Size,
                UploadedAt = document.UploadedAt
            });
        }

        public async Task<DocumentDownload?> GetDownloadAsync(Guid id)
        {
            var document = await _context.Documents.AsNoTracking()
                .FirstOrDefaultAsync(d => d.DocumentId == id);

            if (document == null) return null;

            return new DocumentDownload(document.Content, document.ContentType, document.FileName);
        }

        public async Task<ServiceResult> DeleteAsync(Guid id, Guid? currentUserId, bool isAdmin)
        {
            var document = await _context.Documents.FirstOrDefaultAsync(d => d.DocumentId == id);
            if (document == null) return ServiceResult.NotFound("Document not found.");

            if (!isAdmin && document.UploaderId != currentUserId)
                return ServiceResult.Forbidden();

            _context.Documents.Remove(document);
            await _context.SaveChangesAsync();
            return ServiceResult.OkMessage("Document deleted successfully.");
        }
    }
}
