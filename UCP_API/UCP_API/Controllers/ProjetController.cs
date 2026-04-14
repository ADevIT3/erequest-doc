using Microsoft.AspNetCore.Mvc;
using UCP_API.repositories;
using UCP_API.models;
using UCP_API.dto;

namespace UCP_API.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class ProjetController : ControllerBase
    {
        private readonly ProjetRepository _ProjetRepository;
        private readonly UtilisateurRepository _UtilisateurRepository;

        public ProjetController(ProjetRepository ProjetRepository, UtilisateurRepository utilisateurRepository)
        {
            _ProjetRepository = ProjetRepository;
            _UtilisateurRepository = utilisateurRepository;
        }

        [HttpGet]
        public async Task<IActionResult> GetAllProjet()
        {
            var Projets = await _ProjetRepository.GetProjets();
            return Ok(Projets);
        }

        [HttpGet("{id}")]
        public IActionResult GetProjet(int id)
        {
            Projet Projet = _ProjetRepository.GetProjetById(id);

            if (Projet == null)
                return NotFound("Projet non trouvé!");

            return Ok(Projet);
        }

        //// Get All Projet by idUser
        [HttpGet("projetsbyuser")]
        public IActionResult GetProjetByUser()
        {
            //var currentUserId = int.Parse(HttpContext.User.Claims.FirstOrDefault(x => x.Type == "Id")!.Value);
            //Console.WriteLine("id="+HttpContext.User.Claims.ToArray()[0].Value);
            //var claim = HttpContext.User.Claims.FirstOrDefault(x => x.Type == "Id");
            int userId = 0;
            if (HttpContext.User.Claims.ToArray().Length!=0)
            {
                userId = int.Parse(HttpContext.User.Claims.ToArray()[0].Value);
            }
            
            if (userId == 0)
                return Unauthorized("Utilisateur non trouvé. Veuillez vérifier votre login!");

            //var currentUserId = int.Parse(claim.Value);

            var Projet = _ProjetRepository.GetProjetsByIdUser(userId);

            if (Projet == null)
                return NotFound("Projet non trouvé!");

            return Ok(Projet);
        }

        [HttpGet("autorise_demande")]
        public IActionResult GetProjetByUserAutorises()
        {
            //var currentUserId = int.Parse(HttpContext.User.Claims.FirstOrDefault(x => x.Type == "Id")!.Value);
            //Console.WriteLine("id="+HttpContext.User.Claims.ToArray()[0].Value);
            //var claim = HttpContext.User.Claims.FirstOrDefault(x => x.Type == "Id");
            int userId = 0;
            if (HttpContext.User.Claims.ToArray().Length != 0)
            {
                userId = int.Parse(HttpContext.User.Claims.ToArray()[0].Value);
            }

            if (userId == 0)
                return Unauthorized("Utilisateur non trouvé. Veuillez vérifier votre login!");

            //var currentUserId = int.Parse(claim.Value);

            Utilisateur u = _UtilisateurRepository.FindByIdUtilisateur(userId);
           
            var Projet = _ProjetRepository.GetProjetsByDroit(userId, u.Agmo.idAgmo);

            

            return Ok(Projet);
        }



        [HttpPost]
        public async Task<IActionResult> CreateProjet([FromBody] Projet Projet)
        {
            //var currentUserId = int.Parse(HttpContext.User.Claims.FirstOrDefault(x => x.Type == "Id")!.Value);
            var claim = HttpContext.User.Claims.FirstOrDefault(x => x.Type == "Id");
            if (claim == null)
                return Unauthorized("Utilisateur non trouvé. Veuillez vérifier votre login!");

            var currentUserId = int.Parse(claim.Value);

            var exist = await _ProjetRepository.GetProjetByNameStorage(Projet.nom, Projet.storage);
            if (exist != null)
                return BadRequest("Projet existe déjà!");

            _ProjetRepository.AddProjet(Projet, currentUserId);

            //Création dossier de stockage dans wwwroot => Stockages
            string storageDocsPath = Path.Combine(Directory.GetCurrentDirectory(), "wwwroot", "Stockages");

            if (!Directory.Exists(storageDocsPath))
            {
                Directory.CreateDirectory(storageDocsPath);
            }

            string projetFolderPath = Path.Combine(storageDocsPath, Projet.storage);

            if (!Directory.Exists(projetFolderPath))
            {
                Directory.CreateDirectory(projetFolderPath);
            }

            return Ok(Projet);
        }

        [HttpPut]
        public async Task<IActionResult> UpdateProjet([FromBody] Projet Projet, int id)
        {
            var exist = await _ProjetRepository.GetProjetByNameStorageId(Projet.nom, Projet.storage, id);
            if (exist != null)
                return BadRequest("Projet existe déjà!");

            var result = _ProjetRepository.UpdateProjet(Projet, id);
            if (!result)
                return NotFound("Projet non trouvé!");

            return Ok(Projet);
        }

        [HttpDelete("{id}")]
        public IActionResult DeleteProjet(int id)
        {
            //var currentUserId = int.Parse(HttpContext.User.Claims.FirstOrDefault(x => x.Type == "Id")!.Value);
            var claim = HttpContext.User.Claims.FirstOrDefault(x => x.Type == "Id");
            if (claim == null)
                return Unauthorized("Utilisateur non trouvé. Veuillez vérifier votre login!");

            var currentUserId = int.Parse(claim.Value);

            var result = _ProjetRepository.DeleteProjet(id, currentUserId);
            if (!result)
                return NotFound("Projet non trouvé!");

            return Ok(new { message = "Projet supprimé avec succès!" });
        }

        [HttpPost("databases")]
        public async Task<ActionResult> GetDatabases(DBConnexionDetails dBConnexionDetails)
        {
            try
            {
                var databases = await _ProjetRepository.GetDatabases(dBConnexionDetails);

                return Ok(databases);
            }
            catch (Exception)
            {
                return StatusCode(403);
            }
        }
    }

}