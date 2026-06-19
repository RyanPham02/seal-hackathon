using SEAL.NET.Services.Common;

namespace SEAL.NET.Services.Interfaces
{
    /// <summary>
    /// Read side of audit logs (for <c>AdminAuditLogsController</c>). Separate from
    /// <see cref="IAuditLogService"/>, which is the write-only API used to record actions.
    /// </summary>
    public interface IAuditLogQueryService
    {
        Task<ServiceResult> GetAuditLogsAsync();
    }
}
