using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using SEAL.NET.Services.Common;
using SEAL.NET.Services.Implementations;
using SEAL.NET.Services.Interfaces;
using System.Security.Claims;

namespace SEAL.NET.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    [Authorize]
    public class DocumentsController : ControllerBase
    {
        private readonly IDocumentService _documentService;

        public DocumentsController(IDocumentService documentService)
        {
            _documentService = documentService;
        }

        private Guid? TryGetCurrentUserId()
        {
            var raw = User.FindFirstValue(ClaimTypes.NameIdentifier);
            return Guid.TryParse(raw, out var id) ? id : null;
        }

        [HttpGet]
        public async Task<IActionResult> GetDocuments()
            => this.ToActionResult(await _documentService.GetDocumentsAsync());

        [HttpPost]
        [RequestSizeLimit(DocumentService.MaxFileSize)]
        public async Task<IActionResult> Upload(IFormFile file)
        {
            if (file == null || file.Length == 0)
                return BadRequest(new { message = "No file uploaded." });

            using var stream = file.OpenReadStream();
            return this.ToActionResult(await _documentService.UploadAsync(
                TryGetCurrentUserId(), file.FileName, file.ContentType, file.Length, stream));
        }

        [HttpGet("{id:guid}/download")]
        public async Task<IActionResult> Download(Guid id)
        {
            var file = await _documentService.GetDownloadAsync(id);
            if (file == null) return NotFound(new { message = "Document not found." });

            return File(file.Content, file.ContentType, file.FileName);
        }

        [HttpDelete("{id:guid}")]
        public async Task<IActionResult> Delete(Guid id)
            => this.ToActionResult(await _documentService.DeleteAsync(id, TryGetCurrentUserId(), User.IsInRole("Admin")));

        [HttpGet("storage-stats")]
        public async Task<IActionResult> GetStorageStats()
            => this.ToActionResult(await _documentService.GetStorageStatsAsync());
    }
}
