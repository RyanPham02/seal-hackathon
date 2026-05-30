using Microsoft.EntityFrameworkCore;
using SEAL.NET.Data;
using SEAL.NET.Models.Entities;
using SEAL.NET.Repositories.Interfaces;

namespace SEAL.NET.Repositories.Implementations
{
    public class EventRepository : GenericRepository<Event>, IEventRepository
    {
        public EventRepository(ApplicationDbContext context) : base(context)
        {
        }

        public async Task<List<Event>> GetEventsWithDetailsAsync()
        {
            return await _context.Events
                .Include(e => e.Categories)
                    .ThenInclude(c => c.Teams)
                .Include(e => e.Rounds)
                .OrderByDescending(e => e.CreatedAt)
                .ToListAsync();
        }

        public async Task<Event?> GetEventDetailAsync(Guid eventId)
        {
            return await _context.Events
                .Include(e => e.Categories)
                    .ThenInclude(c => c.Teams)
                .Include(e => e.Rounds)
                .FirstOrDefaultAsync(e => e.EventId == eventId);
        }
    }
}
