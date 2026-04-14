using Microsoft.AspNetCore.Mvc;
using System.Threading.Tasks;
using UCP_API.repositories;

namespace UCP_API.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class DashboardRetardController : ControllerBase
    {
        private readonly DashboardRetardRepository _retardRepository;

        public DashboardRetardController(DashboardRetardRepository retardRepository)
        {
            _retardRepository = retardRepository;
        }

        [HttpGet("requete-retard")]
        public async Task<IActionResult> GetRequetesEnRetard()
        {
            var data = await _retardRepository.GetRequetesEnRetard();
            return Ok(data);
        }
    }
}