using SEAL.NET.DTOs.Category;
using SEAL.NET.Services.Common;

namespace SEAL.NET.Services.Interfaces
{
    public interface ICategoryService
    {
        Task<ServiceResult> GetCategoriesAsync(Guid eventId);
        Task<ServiceResult> GetCategoryByIdAsync(Guid eventId, Guid categoryId);
        Task<ServiceResult> CreateCategoryAsync(Guid eventId, CreateCategoryRequest request);
        Task<ServiceResult> UpdateCategoryAsync(Guid eventId, Guid categoryId, UpdateCategoryRequest request);
        Task<ServiceResult> DeleteCategoryAsync(Guid eventId, Guid categoryId);
    }
}
