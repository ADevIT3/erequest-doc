using Microsoft.AspNetCore.Mvc;
using System.Threading.Tasks;
using UCP_API.repositories;

namespace UCP_API.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class DashboardMontantController : ControllerBase
    {
        private readonly DashboardMontantRepository _montantRepository;

        public DashboardMontantController(DashboardMontantRepository montantRepository)
        {
            _montantRepository = montantRepository;
        }

        [HttpGet("requete-montant")]
        public async Task<IActionResult> GetMontantRequetes()
        {
            var data = await _montantRepository.GetMontantRequetes();
            return Ok(data);
        }
    }
}