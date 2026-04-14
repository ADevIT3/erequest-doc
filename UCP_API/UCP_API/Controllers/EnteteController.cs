using Microsoft.AspNetCore.Mvc;
using UCP_API.repositories;
using UCP_API.models;

namespace UCP_API.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class EnteteController : ControllerBase
    {
        private readonly EnteteRepository _EnteteRepository;

        public EnteteController(EnteteRepository EnteteRepository)
        {
            _EnteteRepository = EnteteRepository;
        }

        [HttpGet]
        public IActionResult GetAllEntetex()
        {
            List<Entete> Entetes = _EnteteRepository.GetEntetes();
            return Ok(Entetes);
        }

        [HttpGet("utilisateur")]
        public IActionResult GetEnteteByUtilisateur()
        {
            var claim = HttpContext.User.Claims.FirstOrDefault(x => x.Type == "Id");
            int idUtilisateur = int.Parse(claim.Value);
            Entete Entete = _EnteteRepository.GetEnteteByUtilisateur(idUtilisateur);
            return Ok(Entete);
        }

        [HttpGet("utilisateur/check")]
        public IActionResult CheckEnteteByUtilisateur()
        {
            var claim = HttpContext.User.Claims.FirstOrDefault(x => x.Type == "Id");
            int idUtilisateur = int.Parse(claim.Value);
            Entete Entete = _EnteteRepository.GetEnteteByUtilisateur(idUtilisateur);
            if (Entete == null)
            {
                return Ok(0);
            }
            else
            {
                return Ok(1);
            }

        }

        [HttpGet("user/{idUtilisateur}")]
        public IActionResult GetEnteteBySpecificUser(int idUtilisateur)
        {
            // Vérifier si l'utilisateur qui fait la demande est un administrateur
            var claim = HttpContext.User.Claims.FirstOrDefault(x => x.Type == "Role");
            if (claim != null && claim.Value != "Admin")
            {
                return Unauthorized("Seuls les administrateurs peuvent voir les entêtes des autres utilisateurs");
            }

            Entete Entete = _EnteteRepository.GetEnteteByUtilisateur(idUtilisateur);
            return Ok(Entete);
        }

        [HttpPost("forUser/{idUtilisateur}")]
        public IActionResult CreateEnteteForUser([FromBody] Entete Entete, int idUtilisateur)
        {
            // Vérifier si l'utilisateur qui fait la demande est un administrateur
            var claim = HttpContext.User.Claims.FirstOrDefault(x => x.Type == "Role");
            if (claim != null && claim.Value != "Admin")
            {
                return Unauthorized("Seuls les administrateurs peuvent modifier les entêtes des autres utilisateurs");
            }

            var claimId = HttpContext.User.Claims.FirstOrDefault(x => x.Type == "Id");
            int idUtilisateurConnecte = int.Parse(claimId.Value);

            Entete.idUtilisateurAGMO = idUtilisateur;
            Entete.createdby = idUtilisateurConnecte;
            Entete.creationdate = DateTime.Now;
            _EnteteRepository.AddEntete(Entete);
            return Ok(Entete);
        }

        [HttpPost]
        public IActionResult CreateEntete([FromBody] Entete Entete)
        {
            var claim = HttpContext.User.Claims.FirstOrDefault(x => x.Type == "Id");
            int idUtilisateur = int.Parse(claim.Value);
            Entete.idUtilisateurAGMO = idUtilisateur;
            Entete.createdby = idUtilisateur;
            Entete.creationdate = DateTime.Now;
            _EnteteRepository.AddEntete(Entete);
            return Ok(Entete);
        }

        [HttpPut("{id}")]
        public IActionResult UpdateEntete([FromBody] Entete Entete, int id)
        {
            var claim = HttpContext.User.Claims.FirstOrDefault(x => x.Type == "Id");
            int idUtilisateur = int.Parse(claim.Value);
            Entete.idUtilisateurAGMO = idUtilisateur;
            Entete.idEntete = id;
            Entete.creationdate = DateTime.Now;
            _EnteteRepository.UpdateEntete(Entete);
            return Ok(Entete);
        }

        [HttpDelete("{id}")]
        public string DeleteEntete(int id)
        {
            _EnteteRepository.DeleteEntete(id);
            return "Entete deleted";
        }
    }

}