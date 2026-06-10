using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using SEAL.NET.DTOs.Team;
using SEAL.NET.Services.Common;
using SEAL.NET.Services.Interfaces;
using System.Security.Claims;

namespace SEAL.NET.Controllers
{
    [Route("api/admin/teams")]
    [ApiController]
    [Authorize(Roles = "Admin")]
    public class AdminTeamsController : ControllerBase
    {
        private readonly IAdminTeamService _adminTeamService;

        public AdminTeamsController(IAdminTeamService adminTeamService)
        {
            _adminTeamService = adminTeamService;
        }

        private Guid? GetActorUserId()
        {
            var userId = User.FindFirstValue(ClaimTypes.NameIdentifier);
            return Guid.TryParse(userId, out var parsed) ? parsed : null;
        }

        [HttpGet]
        public async Task<IActionResult> GetTeams()
            => this.ToActionResult(await _adminTeamService.GetTeamsAsync());

        [HttpPut("{teamId}/approve")]
        public async Task<IActionResult> ApproveTeam(Guid teamId)
            => this.ToActionResult(await _adminTeamService.ApproveTeamAsync(GetActorUserId(), teamId));

        [HttpPut("{teamId}/reject")]
        public async Task<IActionResult> RejectTeam(Guid teamId)
            => this.ToActionResult(await _adminTeamService.RejectTeamAsync(GetActorUserId(), teamId));

        [HttpPut("{teamId}/eliminate")]
        public async Task<IActionResult> EliminateTeam(Guid teamId, [FromBody] EliminateTeamRequest request)
            => this.ToActionResult(await _adminTeamService.EliminateTeamAsync(GetActorUserId(), teamId, request));
    }
}
