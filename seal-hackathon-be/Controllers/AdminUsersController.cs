using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using SEAL.NET.DTOs.User;
using SEAL.NET.Models.Entities;
using SEAL.NET.Services.Interfaces;
using System.Security.Claims;

namespace SEAL.NET.Controllers
{
    [Route("api/admin/users")]
    [ApiController]
    [Authorize(Roles = "Admin")]
    public class AdminUsersController : ControllerBase
    {
        private readonly UserManager<ApplicationUser> _userManager;
        private readonly RoleManager<IdentityRole<Guid>> _roleManager;
        private readonly INotificationService _notificationService;
        private readonly IAuditLogService _auditLogService;

        private static readonly string[] AllowedRoles =
        {
            "Admin",
            "Member",
            "TeamLeader",
            "Judge",
            "Mentor"
        };

        public AdminUsersController(
            UserManager<ApplicationUser> userManager,
            RoleManager<IdentityRole<Guid>> roleManager,
            INotificationService notificationService,
            IAuditLogService auditLogService)
        {
            _userManager = userManager;
            _roleManager = roleManager;
            _notificationService = notificationService;
            _auditLogService = auditLogService;
        }

        private Guid? GetActorUserId()
        {
            var userId = User.FindFirstValue(ClaimTypes.NameIdentifier);
            return Guid.TryParse(userId, out var parsed) ? parsed : null;
        }

        [HttpGet]
        public async Task<IActionResult> GetUsers()
        {
            var users = await _userManager.Users
                .OrderByDescending(u => u.CreatedAt)
                .ToListAsync();

            var result = new List<object>();

            foreach (var user in users)
            {
                var roles = await _userManager.GetRolesAsync(user);

                result.Add(new
                {
                    user.Id,
                    user.FullName,
                    user.Email,
                    studentType = user.StudentType == null ? null : user.StudentType.ToString(),
                    user.StudentCode,
                    user.SchoolName,
                    user.IsApproved,
                    user.CreatedAt,
                    roles
                });
            }

            return Ok(result);
        }

        [HttpGet("pending")]
        public async Task<IActionResult> GetPendingUsers()
        {
            var users = await _userManager.Users
                .Where(u => !u.IsApproved)
                .OrderByDescending(u => u.CreatedAt)
                .ToListAsync();

            var result = new List<object>();

            foreach (var user in users)
            {
                var roles = await _userManager.GetRolesAsync(user);

                result.Add(new
                {
                    user.Id,
                    user.FullName,
                    user.Email,
                    studentType = user.StudentType == null ? null : user.StudentType.ToString(),
                    user.StudentCode,
                    user.SchoolName,
                    user.CreatedAt,
                    roles
                });
            }

            return Ok(result);
        }

        [HttpPut("{userId}/approve")]
        public async Task<IActionResult> ApproveUser(Guid userId)
        {
            var user = await _userManager.FindByIdAsync(userId.ToString());

            if (user == null)
                return NotFound(new { message = "User not found." });

            user.IsApproved = true;

            var result = await _userManager.UpdateAsync(user);

            if (!result.Succeeded)
                return BadRequest(result.Errors);

            await _notificationService.CreateAsync(
                user.Id,
                "Account approved",
                "Your SEAL account has been approved. You can now sign in.",
                "account");
            await _auditLogService.LogAsync(
                GetActorUserId(),
                "approve_user",
                "User",
                user.Id.ToString(),
                $"Approved user {user.Email}.");

            return Ok(new { message = "User approved successfully." });
        }

        [HttpPut("{userId}/reject")]
        public async Task<IActionResult> RejectUser(Guid userId)
        {
            var user = await _userManager.FindByIdAsync(userId.ToString());

            if (user == null)
                return NotFound(new { message = "User not found." });

            user.IsApproved = false;

            var result = await _userManager.UpdateAsync(user);

            if (!result.Succeeded)
                return BadRequest(result.Errors);

            // Invalidate the user's existing JWTs so the rejection takes effect immediately.
            await _userManager.UpdateSecurityStampAsync(user);

            await _notificationService.CreateAsync(
                user.Id,
                "Account rejected",
                "Your SEAL account approval was rejected.",
                "account");
            await _auditLogService.LogAsync(
                GetActorUserId(),
                "reject_user",
                "User",
                user.Id.ToString(),
                $"Rejected user {user.Email}.");

            return Ok(new { message = "User rejected successfully." });
        }

        [HttpPut("{userId}/role")]
        public async Task<IActionResult> UpdateUserRole(Guid userId, [FromBody] UpdateUserRoleRequest request)
        {
            if (!AllowedRoles.Contains(request.Role))
                return BadRequest(new { message = "Invalid role." });

            var user = await _userManager.FindByIdAsync(userId.ToString());

            if (user == null)
                return NotFound(new { message = "User not found." });

            if (!await _roleManager.RoleExistsAsync(request.Role))
                await _roleManager.CreateAsync(new IdentityRole<Guid>(request.Role));

            var currentRoles = await _userManager.GetRolesAsync(user);

            if (currentRoles.Any())
            {
                var removeResult = await _userManager.RemoveFromRolesAsync(user, currentRoles);

                if (!removeResult.Succeeded)
                    return BadRequest(removeResult.Errors);
            }

            var addResult = await _userManager.AddToRoleAsync(user, request.Role);

            if (!addResult.Succeeded)
                return BadRequest(addResult.Errors);

            // Invalidate the user's existing JWTs so the new role takes effect immediately
            // instead of lingering until the old token expires.
            await _userManager.UpdateSecurityStampAsync(user);

            await _auditLogService.LogAsync(
                GetActorUserId(),
                "update_user_role",
                "User",
                user.Id.ToString(),
                $"Updated user {user.Email} role to {request.Role}.");

            return Ok(new
            {
                message = "User role updated successfully.",
                userId = user.Id,
                role = request.Role
            });
        }

        [HttpDelete("{userId}")]
        public async Task<IActionResult> DeleteUser(Guid userId)
        {
            var user = await _userManager.FindByIdAsync(userId.ToString());

            if (user == null)
                return NotFound(new { message = "User not found." });

            var roles = await _userManager.GetRolesAsync(user);

            if (roles.Contains("Admin"))
                return BadRequest(new { message = "Cannot delete an Admin account." });

            var result = await _userManager.DeleteAsync(user);

            if (!result.Succeeded)
                return BadRequest(result.Errors);

            return Ok(new { message = "User deleted successfully." });
        }

        [HttpPost("create-judge")]
        public async Task<IActionResult> CreateGuestJudge([FromBody] CreateGuestJudgeRequest request)
        {
            var existing = await _userManager.FindByEmailAsync(request.Email);
            if (existing != null)
                return BadRequest(new { message = "Email is already in use." });

            var user = new ApplicationUser
            {
                UserName = request.Email,
                Email = request.Email,
                FullName = request.Name,
                SchoolName = request.Company,
                IsApproved = true,
                CreatedAt = DateTime.UtcNow
            };

            var tempPassword = "Judge@" + Guid.NewGuid().ToString("N").Substring(0, 8) + "1!";

            var result = await _userManager.CreateAsync(user, tempPassword);
            if (!result.Succeeded)
                return BadRequest(result.Errors);

            if (!await _roleManager.RoleExistsAsync("Judge"))
                await _roleManager.CreateAsync(new IdentityRole<Guid>("Judge"));

            await _userManager.AddToRoleAsync(user, "Judge");

            await _auditLogService.LogAsync(
                GetActorUserId(),
                "create_guest_judge",
                "User",
                user.Id.ToString(),
                $"Created guest judge {user.Email}.");

            return Ok(new
            {
                message = "Guest judge account created successfully.",
                email = user.Email,
                password = tempPassword
            });
        }
    }
}
