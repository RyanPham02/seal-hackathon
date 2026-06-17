using System.ComponentModel.DataAnnotations;

namespace SEAL.NET.DTOs.Team
{
    public class TransferLeaderRequest
    {
        [Required]
        public string NewLeaderStudentCodeOrEmail { get; set; } = string.Empty;
    }
}
