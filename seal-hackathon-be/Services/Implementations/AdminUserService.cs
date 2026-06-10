using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;
using SEAL.NET.DTOs.User;
using SEAL.NET.Models.Entities;
using SEAL.NET.Services.Common;
using SEAL.NET.Services.Interfaces;

namespace SEAL.NET.Services.Implementations
{
    public class AdminUserService : IAdminUserService
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

        public AdminUserService(
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

        public async Task<ServiceResult> GetUsersAsync()
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

            return ServiceResult.Ok(result);
        }

        public async Task<ServiceResult> GetPendingUsersAsync()
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

            return ServiceResult.Ok(result);
        }

        public async Task<ServiceResult> ApproveUserAsync(Guid? actorUserId, Guid userId)
        {
            var user = await _userManager.FindByIdAsync(userId.ToString());

            if (user == null)
                return ServiceResult.NotFound("User not found.");

            user.IsApproved = true;

            var result = await _userManager.UpdateAsync(user);

            if (!result.Succeeded)
                return ServiceResult.BadRequestBody(result.Errors);

            await _notificationService.CreateAsync(
                user.Id,
                "Account approved",
                "Your SEAL account has been approved. You can now sign in.",
                "account");
            await _auditLogService.LogAsync(
                actorUserId,
                "approve_user",
                "User",
                user.Id.ToString(),
                $"Approved user {user.Email}.");

            return ServiceResult.OkMessage("User approved successfully.");
        }

        public async Task<ServiceResult> RejectUserAsync(Guid? actorUserId, Guid userId)
        {
            var user = await _userManager.FindByIdAsync(userId.ToString());

            if (user == null)
                return ServiceResult.NotFound("User not found.");

            user.IsApproved = false;

            var result = await _userManager.UpdateAsync(user);

            if (!result.Succeeded)
                return ServiceResult.BadRequestBody(result.Errors);

            // Invalidate the user's existing JWTs so the rejection takes effect immediately.
            await _userManager.UpdateSecurityStampAsync(user);

            await _notificationService.CreateAsync(
                user.Id,
                "Account rejected",
                "Your SEAL account approval was rejected.",
                "account");
            await _auditLogService.LogAsync(
                actorUserId,
                "reject_user",
                "User",
                user.Id.ToString(),
                $"Rejected user {user.Email}.");

            return ServiceResult.OkMessage("User rejected successfully.");
        }

        public async Task<ServiceResult> UpdateUserRoleAsync(Guid? actorUserId, Guid userId, UpdateUserRoleRequest request)
        {
            if (!AllowedRoles.Contains(request.Role))
                return ServiceResult.BadRequest("Invalid role.");

            var user = await _userManager.FindByIdAsync(userId.ToString());

            if (user == null)
                return ServiceResult.NotFound("User not found.");

            if (!await _roleManager.RoleExistsAsync(request.Role))
                await _roleManager.CreateAsync(new IdentityRole<Guid>(request.Role));

            var currentRoles = await _userManager.GetRolesAsync(user);

            if (currentRoles.Any())
            {
                var removeResult = await _userManager.RemoveFromRolesAsync(user, currentRoles);

                if (!removeResult.Succeeded)
                    return ServiceResult.BadRequestBody(removeResult.Errors);
            }

            var addResult = await _userManager.AddToRoleAsync(user, request.Role);

            if (!addResult.Succeeded)
                return ServiceResult.BadRequestBody(addResult.Errors);

            // Invalidate the user's existing JWTs so the new role takes effect immediately
            // instead of lingering until the old token expires.
            await _userManager.UpdateSecurityStampAsync(user);

            await _auditLogService.LogAsync(
                actorUserId,
                "update_user_role",
                "User",
                user.Id.ToString(),
                $"Updated user {user.Email} role to {request.Role}.");

            return ServiceResult.Ok(new
            {
                message = "User role updated successfully.",
                userId = user.Id,
                role = request.Role
            });
        }

        public async Task<ServiceResult> DeleteUserAsync(Guid userId)
        {
            var user = await _userManager.FindByIdAsync(userId.ToString());

            if (user == null)
                return ServiceResult.NotFound("User not found.");

            var roles = await _userManager.GetRolesAsync(user);

            if (roles.Contains("Admin"))
                return ServiceResult.BadRequest("Cannot delete an Admin account.");

            var result = await _userManager.DeleteAsync(user);

            if (!result.Succeeded)
                return ServiceResult.BadRequestBody(result.Errors);

            return ServiceResult.OkMessage("User deleted successfully.");
        }

        public async Task<ServiceResult> CreateGuestJudgeAsync(Guid? actorUserId, CreateGuestJudgeRequest request)
        {
            var existing = await _userManager.FindByEmailAsync(request.Email);
            if (existing != null)
                return ServiceResult.BadRequest("Email is already in use.");

            var tempPassword = "Judge@" + Guid.NewGuid().ToString("N").Substring(0, 8) + "1!";

            var user = new ApplicationUser
            {
                UserName = request.Email,
                Email = request.Email,
                FullName = request.Name,
                SchoolName = request.Company,
                PlainPassword = tempPassword,
                IsApproved = true,
                CreatedAt = DateTime.UtcNow
            };

            var result = await _userManager.CreateAsync(user, tempPassword);
            if (!result.Succeeded)
                return ServiceResult.BadRequestBody(result.Errors);

            if (!await _roleManager.RoleExistsAsync("Judge"))
                await _roleManager.CreateAsync(new IdentityRole<Guid>("Judge"));

            await _userManager.AddToRoleAsync(user, "Judge");

            await _auditLogService.LogAsync(
                actorUserId,
                "create_guest_judge",
                "User",
                user.Id.ToString(),
                $"Created guest judge {user.Email}.");

            return ServiceResult.Ok(new
            {
                message = "Guest judge account created successfully.",
                email = user.Email,
                password = tempPassword
            });
        }
    }
}
