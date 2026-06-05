using SEAL.NET.Services.Interfaces;
using System.Net;
using System.Net.Mail;

namespace SEAL.NET.Services.Implementations
{
    public class EmailService : IEmailService
    {
        private readonly IConfiguration _configuration;

        public EmailService(IConfiguration configuration)
        {
            _configuration = configuration;
        }

        public async Task SendPasswordResetOtpAsync(string toEmail, string fullName, string otp)
        {
            var host = _configuration["Email:Smtp:Host"];
            var username = _configuration["Email:Smtp:Username"];
            var password = _configuration["Email:Smtp:Password"];
            var fromEmail = _configuration["Email:Smtp:FromEmail"] ?? username;
            var fromName = _configuration["Email:Smtp:FromName"] ?? "SEAL Hackathon";

            if (string.IsNullOrWhiteSpace(host) ||
                string.IsNullOrWhiteSpace(username) ||
                string.IsNullOrWhiteSpace(password) ||
                string.IsNullOrWhiteSpace(fromEmail) ||
                password == "PASTE_GMAIL_APP_PASSWORD_HERE")
            {
                throw new InvalidOperationException("Gmail App Password is missing. Please update Email:Smtp:Password in appsettings.json.");
            }

            var port = _configuration.GetValue("Email:Smtp:Port", 587);
            var enableSsl = _configuration.GetValue("Email:Smtp:EnableSsl", true);
            var safeName = WebUtility.HtmlEncode(string.IsNullOrWhiteSpace(fullName) ? toEmail : fullName);

            using var message = new MailMessage
            {
                From = new MailAddress(fromEmail, fromName),
                Subject = "SEAL password reset OTP",
                Body = $@"
                    <div style=""font-family:Arial,sans-serif;line-height:1.6;color:#111827"">
                        <h2>Reset your SEAL password</h2>
                        <p>Hello {safeName},</p>
                        <p>Your password reset OTP is:</p>
                        <div style=""font-size:28px;font-weight:700;letter-spacing:6px;margin:20px 0"">{otp}</div>
                        <p>This code expires in 10 minutes. If you did not request it, you can ignore this email.</p>
                    </div>",
                IsBodyHtml = true
            };

            message.To.Add(toEmail);

            using var smtpClient = new SmtpClient(host, port)
            {
                EnableSsl = enableSsl,
                Credentials = new NetworkCredential(username, password)
            };

            await smtpClient.SendMailAsync(message);
        }
    }
}
