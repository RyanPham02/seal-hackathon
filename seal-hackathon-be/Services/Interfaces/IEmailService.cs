namespace SEAL.NET.Services.Interfaces
{
    public interface IEmailService
    {
        Task SendPasswordResetOtpAsync(string toEmail, string fullName, string otp);
    }
}
