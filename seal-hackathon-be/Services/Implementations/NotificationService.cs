using SEAL.NET.Data;
using SEAL.NET.Models.Entities;
using SEAL.NET.Services.Interfaces;

namespace SEAL.NET.Services.Implementations
{
    public class NotificationService : INotificationService
    {
        private readonly ApplicationDbContext _context;

        public NotificationService(ApplicationDbContext context)
        {
            _context = context;
        }

        public async Task CreateAsync(Guid userId, string title, string message, string type = "info")
        {
            _context.Notifications.Add(new Notification
            {
                UserId = userId,
                Title = title,
                Message = message,
                Type = type
            });

            await _context.SaveChangesAsync();
        }

        public async Task CreateForUsersAsync(IEnumerable<Guid> userIds, string title, string message, string type = "info")
        {
            var distinctUserIds = userIds.Distinct().ToList();
            if (!distinctUserIds.Any()) return;

            foreach (var userId in distinctUserIds)
            {
                _context.Notifications.Add(new Notification
                {
                    UserId = userId,
                    Title = title,
                    Message = message,
                    Type = type
                });
            }

            await _context.SaveChangesAsync();
        }
    }
}
