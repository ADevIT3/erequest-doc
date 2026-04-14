using Microsoft.AspNetCore.Mvc;
using UCP_API.services;

namespace UCP_API.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class DistanceController : ControllerBase
    {
        private readonly GraphService _graphService;

        public DistanceController(GraphService graphService)
        {
            _graphService = graphService;
        }

        [HttpGet]
        public IActionResult GetDistance(string from, string to)
        {
            var result = _graphService.GetShortestPath(from, to);

            return Ok(new
            {
                path = result.path,
                distance = result.distance
            });
        }

        [HttpGet("villes")]
        public IActionResult GetVilles()
        {
            var villes = _graphService.GetAllVilles();
            return Ok(villes);
        }
    }

}