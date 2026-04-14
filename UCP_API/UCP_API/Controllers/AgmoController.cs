using Microsoft.AspNetCore.Mvc;
using UCP_API.repositories;
using UCP_API.models;
using UCP_API.dto;

namespace WebApplication2.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class AgmoController : ControllerBase
    {
        private readonly AgmoRepository _AgmoRepository;

        public AgmoController(AgmoRepository AgmoRepository)
        {
            _AgmoRepository = AgmoRepository;
        }

        [HttpGet]
        public async Task<IActionResult> GetAllAgmos()
        {
            var agmos = await _AgmoRepository.GetAgmos();
            return Ok(agmos);
        }

        [HttpGet("{id}")]
        public IActionResult GetAgmo(int id)
        {
            Agmo Agmo = _AgmoRepository.GetAgmoById(id);

            if (Agmo == null)
                return NotFound("Agmo non trouvé!");

            return Ok(Agmo);
        }

        [HttpPost]
        public async Task<IActionResult> CreateAgmo([FromBody] Agmo Agmo)
        {
            //var currentUserId = int.Parse(HttpContext.User.Claims.FirstOrDefault(x => x.Type == "Id")!.Value);
            var claim = HttpContext.User.Claims.FirstOrDefault(x => x.Type == "Id");
            if (claim == null)
                return Unauthorized("Utilisateur non trouvé. Veuillez vérifier votre login!");

            var currentUserId = int.Parse(claim.Value);

            var exist = await _AgmoRepository.GetAgmoByName(Agmo.nom);
            if (exist != null)
                return BadRequest("Agmo existe déjà!");

            _AgmoRepository.AddAgmo(Agmo, currentUserId);
            return Ok(Agmo);
        }

        [HttpPut]
        public async Task<IActionResult> UpdateAgmo([FromBody] Agmo Agmo, int id)
        {
            var exist = await _AgmoRepository.GetAgmoByNameId(Agmo.nom, id);
            if (exist != null)
                return BadRequest("Agmo existe déjà!");

            var result = _AgmoRepository.UpdateAgmo(Agmo, id);
            if (!result)
                return NotFound("Agmo non trouvé!");

            return Ok(Agmo);
        }

        [HttpDelete("{id}")]
        public IActionResult DeleteAgmo(int id)
        {
            //var currentUserId = int.Parse(HttpContext.User.Claims.FirstOrDefault(x => x.Type == "Id")!.Value);
            var claim = HttpContext.User.Claims.FirstOrDefault(x => x.Type == "Id");
            if (claim == null)
                return Unauthorized("Utilisateur non trouvé. Veuillez vérifier votre login!");

            var currentUserId = int.Parse(claim.Value);

            var result = _AgmoRepository.DeleteAgmo(id, currentUserId);
            if (!result)
                return NotFound("Agmo non trouvé!");

            return Ok(new { message = "Agmo supprimé avec succès!" });
        }

        // Get storage Agmo by ID Agmo en relation utilisateur même Agmo si existe
        [HttpGet("getstorage/{idAgmo}")]
        public async Task<IActionResult> GetStorage(int idAgmo)
        {
            var Agmo = await _AgmoRepository.GetStorageAgmoByIdAgmo(idAgmo);

            if (string.IsNullOrWhiteSpace(Agmo))
                return Ok("");

            return Ok(Agmo);
        }
    }

}