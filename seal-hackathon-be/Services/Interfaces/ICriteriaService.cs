using SEAL.NET.DTOs.Criteria;
using SEAL.NET.Services.Common;

namespace SEAL.NET.Services.Interfaces
{
    public interface ICriteriaService
    {
        Task<ServiceResult> GetCriteriaAsync(Guid roundId);
        Task<ServiceResult> CreateCriteriaAsync(Guid roundId, CreateCriteriaRequest request);
        Task<ServiceResult> UpdateCriteriaAsync(Guid roundId, Guid criteriaId, UpdateCriteriaRequest request);
        Task<ServiceResult> DeleteCriteriaAsync(Guid roundId, Guid criteriaId);
    }
}
