using SEAL.NET.Data;
using SEAL.NET.Models.Entities;
using SEAL.NET.Services.Interfaces;

namespace SEAL.NET.Services.Implementations
{
    public class AuditLogService : IAuditLogService
    {
        private readonly ApplicationDbContext _context;

        public AuditLogService(ApplicationDbContext context)
        {
            _context = context;
        }

        public async Task LogAsync(Guid? actorUserId, string action, string entityType, string? entityId, string? description)
        {
            _context.AuditLogs.Add(new AuditLog
            {
                ActorUserId = actorUserId,
                Action = action,
                EntityType = entityType,
                EntityId = entityId,
                Description = description
            });

            await _context.SaveChangesAsync();
        }
    }
}
