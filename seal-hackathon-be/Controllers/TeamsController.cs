using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using SEAL.NET.DTOs.Team;
using SEAL.NET.Services.Common;
using SEAL.NET.Services.Interfaces;
using System.Security.Claims;

namespace SEAL.NET.Controllers
{
    [Route("api/teams")]
    [ApiController]
    [Authorize]
    public class TeamsController : ControllerBase
    {
        private readonly ITeamService _teamService;

        public TeamsController(ITeamService teamService)
        {
            _teamService = teamService;
        }

        private Guid GetCurrentUserId()
        {
            var raw = User.FindFirstValue(ClaimTypes.NameIdentifier);
            return Guid.TryParse(raw, out var id) ? id : Guid.Empty;
        }

        private bool IsPrivileged() =>
            User.IsInRole("Admin") || User.IsInRole("Judge") || User.IsInRole("Mentor");

        private IActionResult ToActionResult(ServiceResult result) => result.Outcome switch
        {
            ServiceOutcome.Ok => Ok(result.Body),
            ServiceOutcome.BadRequest => BadRequest(result.Body),
            ServiceOutcome.NotFound => NotFound(result.Body),
            ServiceOutcome.Forbidden => Forbid(),
            _ => StatusCode(500)
        };

        [HttpPost]
        [Authorize(Roles = "Member,TeamLeader")]
        public async Task<IActionResult> CreateTeam([FromBody] CreateTeamRequest request)
            => ToActionResult(await _teamService.CreateTeamAsync(GetCurrentUserId(), request));

        [HttpGet("my-team")]
        public async Task<IActionResult> GetMyTeam()
            => ToActionResult(await _teamService.GetMyTeamAsync(GetCurrentUserId()));

        [HttpPost("my-team/members")]
        [Authorize(Roles = "Member,TeamLeader")]
        public async Task<IActionResult> AddMemberToMyTeam([FromBody] AddTeamMemberByStudentCodeRequest request)
            => ToActionResult(await _teamService.AddMemberToMyTeamAsync(GetCurrentUserId(), request));

        [HttpDelete("my-team/members/{studentCode}")]
        [Authorize(Roles = "Member,TeamLeader")]
        public async Task<IActionResult> RemoveMemberFromMyTeam(string studentCode)
            => ToActionResult(await _teamService.RemoveMemberFromMyTeamAsync(GetCurrentUserId(), studentCode));

        [HttpPost("my-team/members/{userId}/kick-request")]
        [Authorize(Roles = "Member,TeamLeader")]
        public async Task<IActionResult> CreateKickRequest(Guid userId, [FromBody] CreateKickRequestRequest request)
            => ToActionResult(await _teamService.CreateKickRequestAsync(GetCurrentUserId(), userId, request));

        [HttpPost("leave")]
        [Authorize(Roles = "Member,TeamLeader")]
        public async Task<IActionResult> LeaveTeam()
            => ToActionResult(await _teamService.LeaveTeamAsync(GetCurrentUserId()));

        [HttpPut("my-team")]
        [Authorize(Roles = "Member,TeamLeader")]
        public async Task<IActionResult> UpdateMyTeam([FromBody] UpdateMyTeamRequest request)
            => ToActionResult(await _teamService.UpdateMyTeamAsync(GetCurrentUserId(), request));

        [HttpPut("transfer-leader")]
        [Authorize(Roles = "Member,TeamLeader")]
        public async Task<IActionResult> TransferLeader([FromBody] TransferLeaderRequest request)
            => ToActionResult(await _teamService.TransferLeaderAsync(GetCurrentUserId(), request));

        [HttpPost("{teamId}/members")]
        [Authorize(Roles = "Member,TeamLeader")]
        public async Task<IActionResult> AddMember(Guid teamId, [FromBody] AddTeamMemberRequest request)
            => ToActionResult(await _teamService.AddMemberAsync(GetCurrentUserId(), teamId, request));

        [HttpDelete("{teamId}/members/{userId}")]
        [Authorize(Roles = "Member,TeamLeader")]
        public async Task<IActionResult> RemoveMember(Guid teamId, Guid userId)
            => ToActionResult(await _teamService.RemoveMemberAsync(GetCurrentUserId(), teamId, userId));

        [HttpGet("mentors")]
        public async Task<IActionResult> GetMentors()
            => ToActionResult(await _teamService.GetMentorsAsync());

        [HttpGet("{id}")]
        public async Task<IActionResult> GetTeamById(Guid id)
            => ToActionResult(await _teamService.GetTeamByIdAsync(GetCurrentUserId(), id, IsPrivileged()));

        [HttpPost("my-team/mentor")]
        [Authorize(Roles = "Member,TeamLeader")]
        public async Task<IActionResult> AssignMentorToMyTeam([FromBody] ChooseMentorRequest request)
            => ToActionResult(await _teamService.AssignMentorToMyTeamAsync(GetCurrentUserId(), request));

        [HttpDelete("my-team/mentor")]
        [Authorize(Roles = "Member,TeamLeader")]
        public async Task<IActionResult> RemoveMentorFromMyTeam()
            => ToActionResult(await _teamService.RemoveMentorFromMyTeamAsync(GetCurrentUserId()));

        [HttpGet("recruiting")]
        [Authorize(Roles = "Member,TeamLeader")]
        public async Task<IActionResult> GetRecruitingTeams()
            => ToActionResult(await _teamService.GetRecruitingTeamsAsync(GetCurrentUserId()));

        [HttpPost("{teamId}/join-request")]
        [Authorize(Roles = "Member,TeamLeader")]
        public async Task<IActionResult> RequestToJoinTeam(Guid teamId)
            => ToActionResult(await _teamService.RequestToJoinTeamAsync(GetCurrentUserId(), teamId));
    }
}
