using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using SEAL.NET.DTOs.Team;
using SEAL.NET.Services.Common;
using SEAL.NET.Services.Interfaces;
using System.Security.Claims;

namespace SEAL.NET.Controllers
{
    [Route("api/admin/mentors")]
    [ApiController]
    [Authorize(Roles = "Admin")]
    public class AdminMentorsController : ControllerBase
    {
        private readonly IMentorAdminService _mentorAdminService;

        public AdminMentorsController(IMentorAdminService mentorAdminService)
        {
            _mentorAdminService = mentorAdminService;
        }

        private Guid GetCurrentUserId()
        {
            var userId = User.FindFirstValue(ClaimTypes.NameIdentifier);
            return Guid.Parse(userId!);
        }

        [HttpGet("assignments")]
        public async Task<IActionResult> GetAssignments()
            => this.ToActionResult(await _mentorAdminService.GetAssignmentsAsync());

        [HttpPost("assign")]
        public async Task<IActionResult> AssignMentor([FromBody] AssignMentorRequest request)
            => this.ToActionResult(await _mentorAdminService.AssignMentorAsync(GetCurrentUserId(), request));

        [HttpDelete("assignments/{id}")]
        public async Task<IActionResult> DeactivateAssignment(Guid id)
            => this.ToActionResult(await _mentorAdminService.DeactivateAssignmentAsync(id));
    }
}
