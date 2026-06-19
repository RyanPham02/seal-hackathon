using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using SEAL.NET.DTOs.Score;
using SEAL.NET.Services.Common;
using SEAL.NET.Services.Interfaces;
using System.Security.Claims;

namespace SEAL.NET.Controllers
{
    [Route("api/judge/scores")]
    [ApiController]
    [Authorize(Roles = "Admin,Judge")]
    public class ScoresController : ControllerBase
    {
        private readonly IScoreService _scoreService;

        public ScoresController(IScoreService scoreService)
        {
            _scoreService = scoreService;
        }

        private Guid GetCurrentUserId()
        {
            var raw = User.FindFirstValue(ClaimTypes.NameIdentifier);
            return Guid.TryParse(raw, out var id) ? id : Guid.Empty;
        }

        private IActionResult ToActionResult(ServiceResult result) => result.Outcome switch
        {
            ServiceOutcome.Ok => Ok(result.Body),
            ServiceOutcome.BadRequest => BadRequest(result.Body),
            ServiceOutcome.NotFound => NotFound(result.Body),
            ServiceOutcome.Forbidden => Forbid(),
            _ => StatusCode(500)
        };

        [HttpPost]
        [Authorize(Roles = "Judge")]
        public async Task<IActionResult> SubmitScore([FromBody] CreateScoreRequest request)
            => ToActionResult(await _scoreService.SubmitScoreAsync(GetCurrentUserId(), request));

        [HttpGet("my-assigned-submissions")]
        public async Task<IActionResult> GetMyAssignedSubmissions()
            => ToActionResult(await _scoreService.GetMyAssignedSubmissionsAsync(GetCurrentUserId()));

        [HttpGet("evaluation/{submissionId}")]
        public async Task<IActionResult> GetEvaluation(Guid submissionId)
            => ToActionResult(await _scoreService.GetEvaluationAsync(GetCurrentUserId(), submissionId, User.IsInRole("Admin")));

        [HttpPost("evaluation")]
        [Authorize(Roles = "Judge")]
        public async Task<IActionResult> SaveEvaluation([FromBody] SaveEvaluationRequest request)
            => ToActionResult(await _scoreService.SaveEvaluationAsync(GetCurrentUserId(), request, User.IsInRole("Admin")));
    }
}
