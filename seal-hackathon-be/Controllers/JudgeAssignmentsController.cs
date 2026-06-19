using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using SEAL.NET.DTOs.Judge;
using SEAL.NET.Services.Common;
using SEAL.NET.Services.Interfaces;

namespace SEAL.NET.Controllers
{
    [Route("api/admin/judge-assignments")]
    [ApiController]
    [Authorize(Roles = "Admin")]
    public class JudgeAssignmentsController : ControllerBase
    {
        private readonly IJudgeAssignmentService _judgeAssignmentService;

        public JudgeAssignmentsController(IJudgeAssignmentService judgeAssignmentService)
        {
            _judgeAssignmentService = judgeAssignmentService;
        }

        [HttpGet]
        public async Task<IActionResult> GetAssignments()
            => this.ToActionResult(await _judgeAssignmentService.GetAssignmentsAsync());

        [HttpPost]
        public async Task<IActionResult> CreateAssignment([FromBody] CreateJudgeAssignmentRequest request)
            => this.ToActionResult(await _judgeAssignmentService.CreateAssignmentAsync(request));

        [HttpDelete("{assignmentId}")]
        public async Task<IActionResult> DeleteAssignment(Guid assignmentId)
            => this.ToActionResult(await _judgeAssignmentService.DeleteAssignmentAsync(assignmentId));
    }
}
