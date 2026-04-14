using Microsoft.AspNetCore.Mvc;
using System.Threading.Tasks;
using UCP_API.repositories;

namespace UCP_API.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class DashboardController : ControllerBase
    {
        private readonly DashboardRepository _dashboardRepository;

        public DashboardController(DashboardRepository dashboardRepository)
        {
            _dashboardRepository = dashboardRepository;
        }

        [HttpGet("retard-validation")]
        public async Task<IActionResult> GetRequetesEnRetard()
        {
            var data = await _dashboardRepository.GetRequetesRetardValidation();
            return Ok(data);
        }
    }
}