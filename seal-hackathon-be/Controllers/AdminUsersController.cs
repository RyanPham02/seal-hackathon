using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using SEAL.NET.DTOs.User;
using SEAL.NET.Services.Common;
using SEAL.NET.Services.Interfaces;
using System.Security.Claims;

namespace SEAL.NET.Controllers
{
    [Route("api/admin/users")]
    [ApiController]
    [Authorize(Roles = "Admin")]
    public class AdminUsersController : ControllerBase
    {
        private readonly IAdminUserService _adminUserService;

        public AdminUsersController(IAdminUserService adminUserService)
        {
            _adminUserService = adminUserService;
        }

        private Guid? GetActorUserId()
        {
            var userId = User.FindFirstValue(ClaimTypes.NameIdentifier);
            return Guid.TryParse(userId, out var parsed) ? parsed : null;
        }

        [HttpGet]
        public async Task<IActionResult> GetUsers()
            => this.ToActionResult(await _adminUserService.GetUsersAsync());

        [HttpGet("pending")]
        public async Task<IActionResult> GetPendingUsers()
            => this.ToActionResult(await _adminUserService.GetPendingUsersAsync());

        [HttpPut("{userId}/approve")]
        public async Task<IActionResult> ApproveUser(Guid userId)
            => this.ToActionResult(await _adminUserService.ApproveUserAsync(GetActorUserId(), userId));

        [HttpPut("{userId}/reject")]
        public async Task<IActionResult> RejectUser(Guid userId)
            => this.ToActionResult(await _adminUserService.RejectUserAsync(GetActorUserId(), userId));

        [HttpPut("{userId}/role")]
        public async Task<IActionResult> UpdateUserRole(Guid userId, [FromBody] UpdateUserRoleRequest request)
            => this.ToActionResult(await _adminUserService.UpdateUserRoleAsync(GetActorUserId(), userId, request));

        [HttpDelete("{userId}")]
        public async Task<IActionResult> DeleteUser(Guid userId)
            => this.ToActionResult(await _adminUserService.DeleteUserAsync(userId));

        [HttpPost("create-judge")]
        public async Task<IActionResult> CreateGuestJudge([FromBody] CreateGuestJudgeRequest request)
            => this.ToActionResult(await _adminUserService.CreateGuestJudgeAsync(GetActorUserId(), request));
    }
}
