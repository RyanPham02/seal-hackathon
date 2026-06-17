namespace SEAL.NET.Services.Interfaces
{
    public interface INotificationService
    {
        Task CreateAsync(Guid userId, string title, string message, string type = "info");
        Task CreateForUsersAsync(IEnumerable<Guid> userIds, string title, string message, string type = "info");
    }
}
