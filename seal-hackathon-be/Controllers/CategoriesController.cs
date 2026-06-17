using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using SEAL.NET.DTOs.Category;
using SEAL.NET.Services.Common;
using SEAL.NET.Services.Interfaces;

namespace SEAL.NET.Controllers
{
    [Route("api/events/{eventId}/categories")]
    [ApiController]
    [Authorize(Roles = "Admin")]
    public class CategoriesController : ControllerBase
    {
        private readonly ICategoryService _categoryService;

        public CategoriesController(ICategoryService categoryService)
        {
            _categoryService = categoryService;
        }

        [HttpGet]
        [AllowAnonymous]
        public async Task<IActionResult> GetCategories(Guid eventId)
            => this.ToActionResult(await _categoryService.GetCategoriesAsync(eventId));

        [HttpGet("{categoryId}")]
        [AllowAnonymous]
        public async Task<IActionResult> GetCategoryById(Guid eventId, Guid categoryId)
            => this.ToActionResult(await _categoryService.GetCategoryByIdAsync(eventId, categoryId));

        [HttpPost]
        public async Task<IActionResult> CreateCategory(Guid eventId, [FromBody] CreateCategoryRequest request)
            => this.ToActionResult(await _categoryService.CreateCategoryAsync(eventId, request));

        [HttpPut("{categoryId}")]
        public async Task<IActionResult> UpdateCategory(Guid eventId, Guid categoryId, [FromBody] UpdateCategoryRequest request)
            => this.ToActionResult(await _categoryService.UpdateCategoryAsync(eventId, categoryId, request));

        [HttpDelete("{categoryId}")]
        public async Task<IActionResult> DeleteCategory(Guid eventId, Guid categoryId)
            => this.ToActionResult(await _categoryService.DeleteCategoryAsync(eventId, categoryId));
    }
}
