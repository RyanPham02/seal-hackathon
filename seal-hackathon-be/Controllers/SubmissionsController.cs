using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using SEAL.NET.DTOs.Submission;
using SEAL.NET.Services.Common;
using SEAL.NET.Services.Interfaces;
using System.Security.Claims;

namespace SEAL.NET.Controllers
{
    [Route("api/submissions")]
    [ApiController]
    [Authorize]
    public class SubmissionsController : ControllerBase
    {
        private readonly ISubmissionService _submissionService;

        public SubmissionsController(ISubmissionService submissionService)
        {
            _submissionService = submissionService;
        }

        private Guid GetCurrentUserId()
        {
            return Guid.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier)!);
        }

        [HttpPost]
        [Authorize(Roles = "Member,TeamLeader")]
        public async Task<IActionResult> SubmitProject([FromBody] CreateSubmissionRequest request)
            => this.ToActionResult(await _submissionService.SubmitProjectAsync(GetCurrentUserId(), request));

        [HttpGet("team/{teamId}")]
        public async Task<IActionResult> GetTeamSubmissions(Guid teamId)
            => this.ToActionResult(await _submissionService.GetTeamSubmissionsAsync(
                GetCurrentUserId(), teamId, User.IsInRole("Admin") || User.IsInRole("Judge")));

        [HttpGet("round/{roundId}")]
        [Authorize(Roles = "Admin,Judge")]
        public async Task<IActionResult> GetRoundSubmissions(Guid roundId)
            => this.ToActionResult(await _submissionService.GetRoundSubmissionsAsync(roundId));

        [HttpGet("scoring-queue")]
        [Authorize(Roles = "Admin,Judge")]
        public async Task<IActionResult> GetScoringQueue()
            => this.ToActionResult(await _submissionService.GetScoringQueueAsync(GetCurrentUserId(), User.IsInRole("Admin")));
    }
}
