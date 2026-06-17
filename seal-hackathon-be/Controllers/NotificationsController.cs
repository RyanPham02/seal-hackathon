using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using SEAL.NET.DTOs.Notification;
using SEAL.NET.Services.Common;
using SEAL.NET.Services.Interfaces;
using System.Security.Claims;

namespace SEAL.NET.Controllers
{
    [Route("api/notifications")]
    [ApiController]
    [Authorize]
    public class NotificationsController : ControllerBase
    {
        private readonly INotificationInboxService _inboxService;

        public NotificationsController(INotificationInboxService inboxService)
        {
            _inboxService = inboxService;
        }

        private Guid? TryGetCurrentUserId()
        {
            var raw = User.FindFirstValue(ClaimTypes.NameIdentifier);
            return Guid.TryParse(raw, out var id) ? id : null;
        }

        [HttpGet]
        public async Task<IActionResult> GetMyNotifications()
            => this.ToActionResult(await _inboxService.GetMyNotificationsAsync(TryGetCurrentUserId()));

        [HttpPost("{id}/read")]
        public async Task<IActionResult> MarkAsRead(Guid id)
            => this.ToActionResult(await _inboxService.MarkAsReadAsync(TryGetCurrentUserId(), id));

        [HttpPost("read-all")]
        public async Task<IActionResult> MarkAllAsRead()
            => this.ToActionResult(await _inboxService.MarkAllAsReadAsync(TryGetCurrentUserId()));

        [HttpPost("broadcast")]
        [Authorize(Roles = "Admin")]
        public async Task<IActionResult> BroadcastNotification([FromBody] BroadcastNotificationRequest request)
            => this.ToActionResult(await _inboxService.BroadcastAsync(request));

        [HttpGet("broadcast-history")]
        [Authorize(Roles = "Admin")]
        public async Task<IActionResult> GetBroadcastHistory()
            => this.ToActionResult(await _inboxService.GetBroadcastHistoryAsync());
    }
}
