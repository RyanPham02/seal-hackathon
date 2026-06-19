using Microsoft.EntityFrameworkCore;
using SEAL.NET.Data;
using SEAL.NET.Services.Common;
using SEAL.NET.Services.Interfaces;

namespace SEAL.NET.Services.Implementations
{
    public class AuditLogQueryService : IAuditLogQueryService
    {
        private readonly ApplicationDbContext _context;

        public AuditLogQueryService(ApplicationDbContext context)
        {
            _context = context;
        }

        public async Task<ServiceResult> GetAuditLogsAsync()
        {
            var logs = await _context.AuditLogs
                .Include(log => log.ActorUser)
                .OrderByDescending(log => log.CreatedAt)
                .Take(200)
                .Select(log => new
                {
                    log.Id,
                    log.ActorUserId,
                    actorName = log.ActorUser == null ? null : log.ActorUser.FullName,
                    actorEmail = log.ActorUser == null ? null : log.ActorUser.Email,
                    log.Action,
                    log.EntityType,
                    log.EntityId,
                    log.Description,
                    log.CreatedAt
                })
                .ToListAsync();

            return ServiceResult.Ok(logs);
        }
    }
}
