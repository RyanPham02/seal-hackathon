using SEAL.NET.DTOs.Notification;
using SEAL.NET.Services.Common;

namespace SEAL.NET.Services.Interfaces
{
    /// <summary>
    /// User-facing notification inbox + admin broadcast endpoints behind
    /// <c>NotificationsController</c>. Distinct from <see cref="INotificationService"/>,
    /// which is the write-only API other services use to raise notifications.
    /// </summary>
    public interface INotificationInboxService
    {
        Task<ServiceResult> GetMyNotificationsAsync(Guid? currentUserId);
        Task<ServiceResult> MarkAsReadAsync(Guid? currentUserId, Guid notificationId);
        Task<ServiceResult> MarkAllAsReadAsync(Guid? currentUserId);
        Task<ServiceResult> BroadcastAsync(BroadcastNotificationRequest request);
        Task<ServiceResult> GetBroadcastHistoryAsync();
    }
}
