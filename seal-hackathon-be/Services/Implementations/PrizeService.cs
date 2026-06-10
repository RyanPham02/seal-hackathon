using Microsoft.EntityFrameworkCore;
using SEAL.NET.Data;
using SEAL.NET.DTOs.Prize;
using SEAL.NET.Models.Entities;
using SEAL.NET.Services.Common;
using SEAL.NET.Services.Interfaces;

namespace SEAL.NET.Services.Implementations
{
    public class PrizeService : IPrizeService
    {
        private readonly ApplicationDbContext _context;

        public PrizeService(ApplicationDbContext context)
        {
            _context = context;
        }

        public async Task<ServiceResult> GetPrizesAsync(Guid? eventId)
        {
            var query = _context.Prizes.AsNoTracking().Include(p => p.Event).AsQueryable();

            if (eventId.HasValue)
                query = query.Where(p => p.EventId == eventId.Value);

            var prizes = await query
                .OrderBy(p => p.Rank)
                .ThenBy(p => p.Title)
                .Select(p => new PrizeDto
                {
                    PrizeId = p.PrizeId,
                    EventId = p.EventId,
                    EventName = p.Event!.EventName,
                    Title = p.Title,
                    Amount = p.Amount,
                    Track = p.Track,
                    Description = p.Description,
                    Rank = p.Rank
                })
                .ToListAsync();

            return ServiceResult.Ok(prizes);
        }

        public async Task<ServiceResult> GetPrizeByIdAsync(Guid id)
        {
            var prize = await _context.Prizes.AsNoTracking()
                .Include(p => p.Event)
                .Where(p => p.PrizeId == id)
                .Select(p => new PrizeDto
                {
                    PrizeId = p.PrizeId,
                    EventId = p.EventId,
                    EventName = p.Event!.EventName,
                    Title = p.Title,
                    Amount = p.Amount,
                    Track = p.Track,
                    Description = p.Description,
                    Rank = p.Rank
                })
                .FirstOrDefaultAsync();

            if (prize == null) return ServiceResult.NotFound("Prize not found.");
            return ServiceResult.Ok(prize);
        }

        public async Task<ServiceResult> CreatePrizeAsync(CreatePrizeRequest request)
        {
            var eventExists = await _context.Events.AnyAsync(e => e.EventId == request.EventId);
            if (!eventExists) return ServiceResult.BadRequest("Event not found.");

            var prize = new Prize
            {
                EventId = request.EventId,
                Title = request.Title,
                Amount = request.Amount,
                Track = request.Track,
                Description = request.Description,
                Rank = request.Rank
            };

            _context.Prizes.Add(prize);
            await _context.SaveChangesAsync();

            return ServiceResult.Created(
                "GetPrizeById",
                new { id = prize.PrizeId },
                new { id = prize.PrizeId });
        }

        public async Task<ServiceResult> UpdatePrizeAsync(Guid id, UpdatePrizeRequest request)
        {
            var prize = await _context.Prizes.FirstOrDefaultAsync(p => p.PrizeId == id);
            if (prize == null) return ServiceResult.NotFound("Prize not found.");

            prize.Title = request.Title;
            prize.Amount = request.Amount;
            prize.Track = request.Track;
            prize.Description = request.Description;
            prize.Rank = request.Rank;

            await _context.SaveChangesAsync();
            return ServiceResult.OkMessage("Prize updated successfully.");
        }

        public async Task<ServiceResult> DeletePrizeAsync(Guid id)
        {
            var prize = await _context.Prizes.FirstOrDefaultAsync(p => p.PrizeId == id);
            if (prize == null) return ServiceResult.NotFound("Prize not found.");

            _context.Prizes.Remove(prize);
            await _context.SaveChangesAsync();
            return ServiceResult.OkMessage("Prize deleted successfully.");
        }
    }
}
