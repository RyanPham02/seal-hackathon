namespace SEAL.NET.Services.Interfaces
{
    public interface IAuditLogService
    {
        Task LogAsync(Guid? actorUserId, string action, string entityType, string? entityId, string? description);
    }
}
