using Microsoft.AspNetCore.Mvc;
using UCP_API.repositories;
using UCP_API.models;

namespace UCP_API.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class UtilisateurProjetController : ControllerBase
    {/*
        private readonly UtilisateurProjetRepository _UtilisateurProjetRepository;

        public UtilisateurProjetController(UtilisateurProjetRepository UtilisateurProjetRepository)
        {
            _UtilisateurProjetRepository = UtilisateurProjetRepository;
        }

        [HttpGet]
        public IActionResult GetAllUtilisateurProjetx()
        {
            List<UtilisateurProjet> UtilisateurProjets = _UtilisateurProjetRepository.GetUtilisateurProjets();
            return Ok(UtilisateurProjets);
        }

        [HttpGet("{id}")]
        public IActionResult GetUtilisateurProjet(int id)
        {
            UtilisateurProjet UtilisateurProjet = _UtilisateurProjetRepository.GetUtilisateurProjetById(id);
            return Ok(UtilisateurProjet);
        }

        [HttpPost]
        public IActionResult CreateUtilisateurProjet([FromBody] UtilisateurProjet UtilisateurProjet)
        {
            _UtilisateurProjetRepository.AddUtilisateurProjet(UtilisateurProjet);
            return Ok(UtilisateurProjet);
        }

        [HttpPut]
        public IActionResult UpdateUtilisateurProjet([FromBody] UtilisateurProjet UtilisateurProjet)
        {
            _UtilisateurProjetRepository.UpdateUtilisateurProjet(UtilisateurProjet);
            return Ok(UtilisateurProjet);
        }

        [HttpDelete("{id}")]
        public string DeleteUtilisateurProjet(int id)
        {
            _UtilisateurProjetRepository.DeleteUtilisateurProjet(id);
            return "UtilisateurProjet deleted";
        }*/
    }

}
