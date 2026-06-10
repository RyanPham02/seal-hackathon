using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using SEAL.NET.Services.Common;
using SEAL.NET.Services.Interfaces;

namespace SEAL.NET.Controllers
{
    [Route("api/admin/audit-logs")]
    [ApiController]
    [Authorize(Roles = "Admin")]
    public class AdminAuditLogsController : ControllerBase
    {
        private readonly IAuditLogQueryService _auditLogQueryService;

        public AdminAuditLogsController(IAuditLogQueryService auditLogQueryService)
        {
            _auditLogQueryService = auditLogQueryService;
        }

        [HttpGet]
        public async Task<IActionResult> GetAuditLogs()
            => this.ToActionResult(await _auditLogQueryService.GetAuditLogsAsync());
    }
}
