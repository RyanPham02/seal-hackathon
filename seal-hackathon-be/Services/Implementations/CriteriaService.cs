using Microsoft.EntityFrameworkCore;
using SEAL.NET.Data;
using SEAL.NET.DTOs.Criteria;
using SEAL.NET.Models.Entities;
using SEAL.NET.Services.Common;
using SEAL.NET.Services.Interfaces;

namespace SEAL.NET.Services.Implementations
{
    public class CriteriaService : ICriteriaService
    {
        private readonly ApplicationDbContext _context;

        public CriteriaService(ApplicationDbContext context)
        {
            _context = context;
        }

        public async Task<ServiceResult> GetCriteriaAsync(Guid roundId)
        {
            var roundExists = await _context.Rounds.AnyAsync(r => r.RoundId == roundId);
            if (!roundExists)
                return ServiceResult.NotFound("Round not found.");

            var criteria = await _context.Criteria
                .Where(c => c.RoundId == roundId)
                .Select(c => new
                {
                    c.CriteriaId,
                    c.CriteriaName,
                    c.MaxScore,
                    c.Weight,
                    c.RoundId
                })
                .ToListAsync();

            return ServiceResult.Ok(criteria);
        }

        public async Task<ServiceResult> CreateCriteriaAsync(Guid roundId, CreateCriteriaRequest request)
        {
            var roundExists = await _context.Rounds.AnyAsync(r => r.RoundId == roundId);
            if (!roundExists)
                return ServiceResult.NotFound("Round not found.");

            var currentTotalWeight = await _context.Criteria
                .Where(c => c.RoundId == roundId)
                .SumAsync(c => c.Weight);

            if (currentTotalWeight + request.Weight > 100)
                return ServiceResult.BadRequest("Total criteria weight cannot exceed 100.");

            var duplicate = await _context.Criteria.AnyAsync(c =>
                c.RoundId == roundId &&
                c.CriteriaName.ToLower() == request.CriteriaName.ToLower());

            if (duplicate)
                return ServiceResult.BadRequest("Criteria name already exists in this round.");

            var criteria = new Criteria
            {
                RoundId = roundId,
                CriteriaName = request.CriteriaName,
                MaxScore = request.MaxScore,
                Weight = request.Weight
            };

            _context.Criteria.Add(criteria);
            await _context.SaveChangesAsync();

            return ServiceResult.Ok(new
            {
                message = "Criteria created successfully.",
                criteria.CriteriaId
            });
        }

        public async Task<ServiceResult> UpdateCriteriaAsync(Guid roundId, Guid criteriaId, UpdateCriteriaRequest request)
        {
            var criteria = await _context.Criteria
                .FirstOrDefaultAsync(c => c.RoundId == roundId && c.CriteriaId == criteriaId);

            if (criteria == null)
                return ServiceResult.NotFound("Criteria not found.");

            var otherWeights = await _context.Criteria
                .Where(c => c.RoundId == roundId && c.CriteriaId != criteriaId)
                .SumAsync(c => c.Weight);

            if (otherWeights + request.Weight > 100)
                return ServiceResult.BadRequest("Total criteria weight cannot exceed 100.");

            criteria.CriteriaName = request.CriteriaName;
            criteria.MaxScore = request.MaxScore;
            criteria.Weight = request.Weight;

            await _context.SaveChangesAsync();

            return ServiceResult.OkMessage("Criteria updated successfully.");
        }

        public async Task<ServiceResult> DeleteCriteriaAsync(Guid roundId, Guid criteriaId)
        {
            var criteria = await _context.Criteria
                .Include(c => c.Scores)
                .FirstOrDefaultAsync(c => c.RoundId == roundId && c.CriteriaId == criteriaId);

            if (criteria == null)
                return ServiceResult.NotFound("Criteria not found.");

            if (criteria.Scores.Any())
                return ServiceResult.BadRequest("Cannot delete criteria because it already has scores.");

            _context.Criteria.Remove(criteria);
            await _context.SaveChangesAsync();

            return ServiceResult.OkMessage("Criteria deleted successfully.");
        }
    }
}
