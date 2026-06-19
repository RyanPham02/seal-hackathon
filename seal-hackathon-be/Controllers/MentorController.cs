using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using SEAL.NET.DTOs.Team;
using SEAL.NET.Services.Common;
using SEAL.NET.Services.Interfaces;
using System.Security.Claims;

namespace SEAL.NET.Controllers
{
    [Route("api/mentor")]
    [ApiController]
    [Authorize(Roles = "Mentor")]
    public class MentorController : ControllerBase
    {
        private readonly IMentorService _mentorService;

        public MentorController(IMentorService mentorService)
        {
            _mentorService = mentorService;
        }

        private Guid GetCurrentUserId()
        {
            var userId = User.FindFirstValue(ClaimTypes.NameIdentifier);
            return Guid.Parse(userId!);
        }

        [HttpGet("teams")]
        public async Task<IActionResult> GetAssignedTeams()
            => this.ToActionResult(await _mentorService.GetAssignedTeamsAsync(GetCurrentUserId()));

        [HttpGet("teams/{teamId}")]
        public async Task<IActionResult> GetAssignedTeamDetail(Guid teamId)
            => this.ToActionResult(await _mentorService.GetAssignedTeamDetailAsync(GetCurrentUserId(), teamId));

        [HttpPost("teams/{teamId}/notes")]
        public async Task<IActionResult> SaveTeamNotes(Guid teamId, [FromBody] SaveNotesRequest request)
            => this.ToActionResult(await _mentorService.SaveTeamNotesAsync(GetCurrentUserId(), teamId, request));
    }
}
