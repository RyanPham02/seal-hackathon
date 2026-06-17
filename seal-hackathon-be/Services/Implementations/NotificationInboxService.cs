using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;
using SEAL.NET.Data;
using SEAL.NET.DTOs.Notification;
using SEAL.NET.Models.Entities;
using SEAL.NET.Services.Common;
using SEAL.NET.Services.Interfaces;

namespace SEAL.NET.Services.Implementations
{
    public class NotificationInboxService : INotificationInboxService
    {
        private readonly ApplicationDbContext _context;
        private readonly UserManager<ApplicationUser> _userManager;

        public NotificationInboxService(ApplicationDbContext context, UserManager<ApplicationUser> userManager)
        {
            _context = context;
            _userManager = userManager;
        }

        public async Task<ServiceResult> GetMyNotificationsAsync(Guid? currentUserId)
        {
            if (currentUserId == null) return ServiceResult.Unauthorized("Invalid authentication token.");

            var notifications = await _context.Notifications
                .Where(n => n.UserId == currentUserId.Value)
                .OrderByDescending(n => n.CreatedAt)
                .Select(n => new
                {
                    n.Id,
                    n.Title,
                    n.Message,
                    n.Type,
                    n.IsRead,
                    n.CreatedAt
                })
                .ToListAsync();

            return ServiceResult.Ok(notifications);
        }

        public async Task<ServiceResult> MarkAsReadAsync(Guid? currentUserId, Guid notificationId)
        {
            if (currentUserId == null) return ServiceResult.Unauthorized("Invalid authentication token.");

            var notification = await _context.Notifications
                .FirstOrDefaultAsync(n => n.Id == notificationId && n.UserId == currentUserId.Value);

            if (notification == null)
                return ServiceResult.NotFound("Notification not found.");

            notification.IsRead = true;
            await _context.SaveChangesAsync();

            return ServiceResult.OkMessage("Notification marked as read.");
        }

        public async Task<ServiceResult> MarkAllAsReadAsync(Guid? currentUserId)
        {
            if (currentUserId == null) return ServiceResult.Unauthorized("Invalid authentication token.");

            var notifications = await _context.Notifications
                .Where(n => n.UserId == currentUserId.Value && !n.IsRead)
                .ToListAsync();

            foreach (var notification in notifications)
            {
                notification.IsRead = true;
            }

            await _context.SaveChangesAsync();

            return ServiceResult.OkMessage("All notifications marked as read.");
        }

        public async Task<ServiceResult> BroadcastAsync(BroadcastNotificationRequest request)
        {
            var allUsers = await _userManager.Users.ToListAsync();

            if (allUsers.Count == 0)
                return ServiceResult.BadRequest("No users found to broadcast to.");

            var broadcastId = Guid.NewGuid();
            var now = DateTime.UtcNow;

            var notifications = allUsers.Select(u => new Notification
            {
                UserId = u.Id,
                Title = request.Title,
                Message = request.Message,
                Type = request.Type,
                BroadcastId = broadcastId,
                IsBroadcast = true,
                CreatedAt = now
            }).ToList();

            _context.Notifications.AddRange(notifications);
            await _context.SaveChangesAsync();

            return ServiceResult.Ok(new
            {
                message = "Broadcast notification sent successfully.",
                broadcastId,
                recipientCount = notifications.Count
            });
        }

        public async Task<ServiceResult> GetBroadcastHistoryAsync()
        {
            var history = await _context.Notifications
                .Where(n => n.IsBroadcast && n.BroadcastId != null)
                .GroupBy(n => n.BroadcastId)
                .Select(g => new BroadcastNotificationHistoryDto
                {
                    BroadcastId = g.Key!.Value,
                    Title = g.First().Title,
                    Message = g.First().Message,
                    Type = g.First().Type,
                    CreatedAt = g.First().CreatedAt,
                    RecipientCount = g.Count()
                })
                .OrderByDescending(h => h.CreatedAt)
                .ToListAsync();

            return ServiceResult.Ok(history);
        }
    }
}
