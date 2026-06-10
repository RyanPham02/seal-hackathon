using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;
using SEAL.NET.Data;
using SEAL.NET.DTOs.Judge;
using SEAL.NET.Models.Entities;
using SEAL.NET.Services.Common;
using SEAL.NET.Services.Interfaces;

namespace SEAL.NET.Services.Implementations
{
    public class JudgeAssignmentService : IJudgeAssignmentService
    {
        private readonly ApplicationDbContext _context;
        private readonly UserManager<ApplicationUser> _userManager;

        public JudgeAssignmentService(ApplicationDbContext context, UserManager<ApplicationUser> userManager)
        {
            _context = context;
            _userManager = userManager;
        }

        public async Task<ServiceResult> GetAssignmentsAsync()
        {
            var assignments = await _context.JudgeAssignments
                .Include(a => a.Judge)
                .Include(a => a.Round)
                .Include(a => a.Category)
                .Select(a => new
                {
                    a.AssignmentId,
                    judge = new
                    {
                        a.JudgeId,
                        a.Judge!.FullName,
                        a.Judge.Email
                    },
                    round = new
                    {
                        a.RoundId,
                        a.Round!.RoundName
                    },
                    category = new
                    {
                        a.CategoryId,
                        a.Category!.CategoryName
                    }
                })
                .ToListAsync();

            return ServiceResult.Ok(assignments);
        }

        public async Task<ServiceResult> CreateAssignmentAsync(CreateJudgeAssignmentRequest request)
        {
            var judge = await _userManager.FindByIdAsync(request.JudgeId.ToString());
            if (judge == null)
                return ServiceResult.NotFound("Judge not found.");

            var isJudge = await _userManager.IsInRoleAsync(judge, "Judge");
            if (!isJudge)
                return ServiceResult.BadRequest("This user is not a Judge.");

            var round = await _context.Rounds.FindAsync(request.RoundId);
            if (round == null)
                return ServiceResult.NotFound("Round not found.");

            var category = await _context.Categories.FindAsync(request.CategoryId);
            if (category == null)
                return ServiceResult.NotFound("Category not found.");

            if (round.EventId != category.EventId)
                return ServiceResult.BadRequest("Round and category must belong to the same event.");

            var duplicate = await _context.JudgeAssignments.AnyAsync(a =>
                a.JudgeId == request.JudgeId &&
                a.RoundId == request.RoundId &&
                a.CategoryId == request.CategoryId);

            if (duplicate)
                return ServiceResult.BadRequest("Judge assignment already exists.");

            var assignment = new JudgeAssignment
            {
                JudgeId = request.JudgeId,
                RoundId = request.RoundId,
                CategoryId = request.CategoryId
            };

            _context.JudgeAssignments.Add(assignment);
            await _context.SaveChangesAsync();

            return ServiceResult.Ok(new
            {
                message = "Judge assigned successfully.",
                assignment.AssignmentId
            });
        }

        public async Task<ServiceResult> DeleteAssignmentAsync(Guid assignmentId)
        {
            var assignment = await _context.JudgeAssignments.FindAsync(assignmentId);

            if (assignment == null)
                return ServiceResult.NotFound("Assignment not found.");

            _context.JudgeAssignments.Remove(assignment);
            await _context.SaveChangesAsync();

            return ServiceResult.OkMessage("Judge assignment removed successfully.");
        }
    }
}
