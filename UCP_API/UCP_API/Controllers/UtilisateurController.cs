using Microsoft.AspNetCore.Mvc;
using UCP_API.repositories;
using UCP_API.models;
using Microsoft.AspNetCore.Identity.Data;
using Microsoft.EntityFrameworkCore;
using Microsoft.AspNetCore.Authentication;
using System.Security.Claims;
using Microsoft.AspNetCore.Authorization;
using System.ComponentModel;
using Azure.Core;
using UCP_API.dto;
using UCP_API.utils;

namespace UCP_API.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class UtilisateurController : ControllerBase
    {
        private readonly UtilisateurRepository _UtilisateurRepository;
        private readonly SiteRepository _SiteRepository;
        private readonly ProjetRepository _ProjetRepository;
        private readonly RoleRepository _RoleRepository;
        private readonly UtilisateurProjetRepository _UtilisateurProjetRepository;
        private readonly UtilisateurSiteRepository _UtilisateurSiteRepository;
        private readonly UtilisateurCCRepository _UtilisateurCCRepository;
        private readonly CircuitRepository _circuitRepository;


        public UtilisateurController(UtilisateurRepository UtilisateurRepository, SiteRepository SiteRepository, ProjetRepository ProjetRepository, RoleRepository RoleRepository, UtilisateurProjetRepository utilisateurProjetRepository, UtilisateurSiteRepository utilisateurSiteRepository, UtilisateurCCRepository UtilisateurCCRepository, CircuitRepository circuitRepository)
        {
            _UtilisateurRepository = UtilisateurRepository;
            _SiteRepository = SiteRepository;
            _ProjetRepository = ProjetRepository;
            _RoleRepository = RoleRepository;
            _UtilisateurProjetRepository = utilisateurProjetRepository;
            _UtilisateurSiteRepository = utilisateurSiteRepository;
            _UtilisateurCCRepository = UtilisateurCCRepository;
            _circuitRepository = circuitRepository;
        }
        [HttpGet("me")]
        [Authorize]
        public IActionResult Me()
        {
            int userId = 0;
            if (HttpContext.User.Claims.ToArray().Length != 0)
            {
                userId = int.Parse(HttpContext.User.Claims.ToArray()[0].Value);
            }

            if (userId == 0)
                return Unauthorized("Utilisateur non trouvé. Veuillez vérifier votre login!");

            Role role = _RoleRepository.FindByIdUtilisateur(userId);

            return Ok(role);

            /* // lit l’Id et le role dans les Claims du cookie
             var id = int.Parse(User.FindFirst("Id")!.Value);
             var role = User.FindFirst("role")!.Value;
             return Ok(new { id, role });*/
        }

        [HttpGet("infos")]
        public IActionResult Infos()
        {
            int userId = 0;
            if (HttpContext.User.Claims.ToArray().Length != 0)
            {
                userId = int.Parse(HttpContext.User.Claims.ToArray()[0].Value);
            }

            if (userId == 0)
                return Unauthorized("Utilisateur non trouvé. Veuillez vérifier votre login!");
            Utilisateur u = _UtilisateurRepository.FindByIdUtilisateur(userId);

            return Ok(u);

        }

        [HttpGet("fullname")]
        [Authorize]
        public IActionResult getFullName()
        {
            int userId = 0;
            if (HttpContext.User.Claims.ToArray().Length != 0)
            {
                userId = int.Parse(HttpContext.User.Claims.ToArray()[0].Value);
            }
            if (userId == 0)
                return Unauthorized("Utilisateur non trouvé. Veuillez vérifier votre login!");

            Utilisateur u = _UtilisateurRepository.FindByIdUtilisateur(userId);

            return Ok(new { firstname = u.firstname, lastname = u.lastname });

            /* // lit l’Id et le role dans les Claims du cookie
             var id = int.Parse(User.FindFirst("Id")!.Value);
             var role = User.FindFirst("role")!.Value;
             return Ok(new { id, role });*/
        }

        [HttpPost("logout")]
        [Authorize]
        public async Task<IActionResult> Logout()
        {
            await HttpContext.SignOutAsync("10mOyIm3S1WMbwaCE7");
            return Ok(new { message = "Déconnecté" });
        }

        [HttpPost("login")]
        public async Task<IActionResult> Login([FromBody] Login request)
        {
            var user = await _UtilisateurRepository.GetUtilisateurByUserName(request.Username);
            if (user == null)
                return Unauthorized("Utilisateur non trouvé. Veuillez vérifier votre login!");
            if (!utils.Password.IsValidPassword(request.Password, user.password))
                return Unauthorized("Mot de passe incorrect. Veuillez vérifier votre login!");

            var claimsIdentity = new ClaimsIdentity(new[] {
                new Claim("Id", user.IdUtilisateur.ToString()),
                new Claim("role", user.idrole.ToString()!)
            }, "10mOyIm3S1WMbwaCE7");
            var claimsPrincipal = new ClaimsPrincipal(claimsIdentity);
            await Request.HttpContext.SignInAsync("10mOyIm3S1WMbwaCE7", claimsPrincipal, new AuthenticationProperties
            {
                IsPersistent = true,
                ExpiresUtc = DateTime.UtcNow.AddSeconds(12 * 60 * 60)
            });

            return Ok(new
            {
                user.IdUtilisateur,
                user.username,
                user.idrole,
                user.email,
                user.phonenumber,
                user.firstname,
                user.lastname,
                user.fonction
            });
        }
        //Check the session if the cookies is expired or not
        [HttpGet("check-session")]
        public IActionResult CheckSession()
        {
            if (User.Identity?.IsAuthenticated == true)
                return Ok(new { status = "ok" });
            else
                return Unauthorized();
        }

        [HttpGet]
        public async Task<IActionResult> GetAllUtilisateur()
        {
            //var currentUserId = int.Parse(HttpContext.User.Claims.FirstOrDefault(x => x.Type == "Id")!.Value);
            /*var claim = HttpContext.User.Claims.FirstOrDefault(x => x.Type == "role");
            if (claim == null)
                return Unauthorized("Utilisateur non trouvé. Veuillez vérifier votre login!");

            var currentUserRoleId = int.Parse(claim.Value);

            //Get role by id
            var role = await _UtilisateurRepository.GetRoleById(currentUserRoleId);

            if (role.nom == "SuperAdmin")
            {*/
            List<Utilisateur> Utilisateurs = _UtilisateurRepository.GetUtilisateurs();
            for (int i = 0; i < Utilisateurs.Count(); i++)
            {
                Utilisateurs[i].Sites = _SiteRepository.GetSitesByUtilisateur(Utilisateurs[i].IdUtilisateur);
                Utilisateurs[i].Projets = _ProjetRepository.GetProjetsByUtilisateur(Utilisateurs[i].IdUtilisateur);
                Utilisateurs[i].UtilisateurCCs = _UtilisateurCCRepository.GetUtilisateurCCsByUtilisateur(Utilisateurs[i].IdUtilisateur);
            }
            return Ok(Utilisateurs);
            /*}
            else
                return Ok(new List<Utilisateur>());*/
        }

        [HttpGet("pages")]
        public async Task<IActionResult> GetNbPageUtilisateur()
        {

            int nbPage = _UtilisateurRepository.GetNbPageUtilisateurs();

            return Ok(nbPage);

        }

        [HttpGet("total")]
        public async Task<IActionResult> GetNbUtilisateur()
        {

            int nbusers = _UtilisateurRepository.GetNbUtilisateur();

            return Ok(nbusers);

        }

        [HttpGet("word/{word}/pages")]
        public async Task<IActionResult> GetNbUtilisateurByWord(string word)
        {
            int nbusers = 0;


            nbusers = _UtilisateurRepository.GetNbPageUtilisateursByWord(word);



            return Ok(nbusers);

        }

        [HttpGet("page/{page}")]
        public async Task<IActionResult> GetUtilisateursPage(int page)
        {

            List<Utilisateur> result = _UtilisateurRepository.GetUtilisateursByPage(page);
            for (int i = 0; i < result.Count(); i++)
            {
                result[i].Sites = _SiteRepository.GetSitesByUtilisateur(result[i].IdUtilisateur);
                result[i].Projets = _ProjetRepository.GetProjetsByUtilisateur(result[i].IdUtilisateur);
                result[i].UtilisateurCCs = _UtilisateurCCRepository.GetUtilisateurCCsByUtilisateur(result[i].IdUtilisateur);
            }

            return Ok(result);

        }

        [HttpGet("word/{word}/page/{page}")]
        public async Task<IActionResult> GetUtilisateursPageAndWord(string word, int page)
        {
            List<Utilisateur> result = null;


            result = _UtilisateurRepository.GetUtilisateursByPageAndWord(word, page);


            for (int i = 0; i < result.Count(); i++)
            {
                result[i].Sites = _SiteRepository.GetSitesByUtilisateur(result[i].IdUtilisateur);
                result[i].Projets = _ProjetRepository.GetProjetsByUtilisateur(result[i].IdUtilisateur);
                result[i].UtilisateurCCs = _UtilisateurCCRepository.GetUtilisateurCCsByUtilisateur(result[i].IdUtilisateur);
            }

            return Ok(result);

        }

        [HttpGet("{id:int}")]
        public async Task<IActionResult> GetUtilisateur(int id)
        {
            var utilisateur = _UtilisateurRepository.GetUtilisateurById(id);
            utilisateur.Projets = _ProjetRepository.GetProjetsByUtilisateur(id);
            utilisateur.Sites = _SiteRepository.GetSitesByUtilisateur(id);
            if (utilisateur == null)
                return NotFound("utilisateur non trouvé!");

            return Ok(utilisateur);
        }

        [HttpGet("mee")]
        public async Task<IActionResult> GetUtilisateurByCookie()
        {
            int userId = 0;
            if (HttpContext.User.Claims.ToArray().Length != 0)
            {
                userId = int.Parse(HttpContext.User.Claims.ToArray()[0].Value);
            }
            if (userId == 0)
                return Unauthorized("Utilisateur non trouvé. Veuillez vérifier votre login!");

            var utilisateur = _UtilisateurRepository.GetUtilisateurById(userId);
            utilisateur.Projets = _ProjetRepository.GetProjetsByUtilisateur(userId);
            utilisateur.Sites = _SiteRepository.GetSitesByUtilisateur(userId);
            if (utilisateur == null)
                return NotFound("utilisateur non trouvé!");

            return Ok(utilisateur);
        }

        [HttpPost("register")]
        public async Task<IActionResult> CreateUtilisateur([FromBody] UtilisateurDTO Utilisateur, [FromQuery] List<int> idSites, [FromQuery] List<int> idProjets, [FromQuery] List<string> mailccs)
        {
            var currentUserId = int.Parse(HttpContext.User.Claims.FirstOrDefault(x => x.Type == "Id")!.Value);



            //Get role by id
            var role = await _UtilisateurRepository.GetRoleById(Utilisateur.idrole);

            var exist = await _UtilisateurRepository.GetUtilisateurByUserName(Utilisateur.username);
            if (exist != null)
                return BadRequest("Utilisateur existe déjà!");
            //if (idProjets == null || !idProjets.Any())
            //    return BadRequest("Le projet doit être fourni!");
            //if (idSites == null || !idSites.Any())
            //    return BadRequest("Le site doit être fourni!");
            //if (role.nom == "AGMO" && String.IsNullOrEmpty(Utilisateur.storage))
            //    return BadRequest("Pour le type d'utilisateur AGMO, le stockage doit être fourni!");

            Utilisateur newUser = new Utilisateur();

            newUser.username = Utilisateur.username;
            newUser.password = utils.Password.HashPassword(Utilisateur.password);
            newUser.creationDate = DateTime.Now;
            newUser.phonenumber = Utilisateur.phonenumber;
            newUser.email = Utilisateur.email;
            newUser.idrole = Utilisateur.idrole;
            newUser.firstname = Utilisateur.firstname;
            newUser.lastname = Utilisateur.lastname;
            newUser.fonction = Utilisateur.fonction;
            newUser.storage = Utilisateur.storage;
            newUser.isReceivedRequete = Utilisateur.isReceivedRequete;
            newUser.idAgmo = Utilisateur.idAgmo;
            newUser.createdBy = currentUserId;
            newUser.IsClotureur = Utilisateur.isClotureur;
            newUser.canDeleteAttachment = Utilisateur.canDeleteAttachment;

            _UtilisateurRepository.AddUtilisateur(newUser);

            //utilisateur - projets
            foreach (var idProjet in idProjets)
            {
                var utilisateurProjet = new UtilisateurProjet
                {
                    IdUtilisateur = newUser.IdUtilisateur,
                    IdProjet = idProjet
                };
                await _UtilisateurRepository.AddUtilisateurProjet(utilisateurProjet);

                //Get projet by id
                var projet = await _UtilisateurRepository.GetProjetById(idProjet);
                var nomProjet = projet.nom;

                //Créate repertoire
                if (role.nom == "AGMO")
                {
                    var path = Path.Combine(Directory.GetCurrentDirectory(), "wwwroot", "Stockages", nomProjet);

                    if (!Directory.Exists(path))
                    {
                        Directory.CreateDirectory(path);
                    }
                }
            }

            //utilisateur - sites
            foreach (var idSite in idSites)
            {
                var utilisateurSite = new UtilisateurSite
                {
                    IdUtilisateur = newUser.IdUtilisateur,
                    IdSite = idSite
                };
                await _UtilisateurRepository.AddUtilisateurSite(utilisateurSite);
            }

            //utilisateur - sites
            foreach (var mail in mailccs)
            {
                var UtilisateurCC = new UtilisateurCC
                {
                    idUtilisateur = newUser.IdUtilisateur,
                    mailCC = mail
                };
                _UtilisateurCCRepository.AddUtilisateurCC(UtilisateurCC);
            }
            return Ok(Utilisateur);
        }

        [HttpPut("{id}")]
        public async Task<IActionResult> UpdateUtilisateur([FromBody] UtilisateurDTO Utilisateur, int id, [FromQuery] List<int> idSites, [FromQuery] List<int> idProjets, [FromQuery] List<string> mailccs)
        {
            var currentUserId = int.Parse(HttpContext.User.Claims.FirstOrDefault(x => x.Type == "Id")!.Value);
            Utilisateur newUser = new Utilisateur();
            newUser.IdUtilisateur = id;
            newUser.username = Utilisateur.username;
            newUser.password = utils.Password.HashPassword(Utilisateur.password);
            newUser.creationDate = DateTime.Now;
            newUser.phonenumber = Utilisateur.phonenumber;
            newUser.email = Utilisateur.email;
            newUser.idrole = Utilisateur.idrole;
            newUser.firstname = Utilisateur.firstname;
            newUser.lastname = Utilisateur.lastname;
            newUser.fonction = Utilisateur.fonction;
            newUser.storage = Utilisateur.storage;
            newUser.isReceivedRequete = Utilisateur.isReceivedRequete;
            newUser.idAgmo = Utilisateur.idAgmo;
            newUser.createdBy = currentUserId;
            newUser.IsClotureur = Utilisateur.isClotureur;
            newUser.canDeleteAttachment = Utilisateur.canDeleteAttachment;

            Console.WriteLine("clotureur");
            Console.WriteLine(newUser.IsClotureur);

            List<int> sites = new List<int>();
            List<int> projets = new List<int>();
            for (int i = 0; i < idSites.Count; i++)
            {
                sites.Add(idSites[i]);
                Console.WriteLine(idSites[i]);
            }
            for (int i = 0; i < idProjets.Count; i++)
            {
                projets.Add(idProjets[i]);
                Console.WriteLine(idProjets[i]);
            }
            var result = await _UtilisateurRepository.UpdateUtilisateur(newUser, id, sites, projets, mailccs);
            if (!result)
                return NotFound("Utilisateur non trouvé!");

            return Ok(Utilisateur);
        }

        [HttpPut("password")]
        public async Task<IActionResult> UpdateUtilisateur([FromBody] ChangePasswordDTO newPasswordDTO)
        {
            var currentUserId = int.Parse(HttpContext.User.Claims.FirstOrDefault(x => x.Type == "Id")!.Value);
            string newPassword = utils.Password.HashPassword(newPasswordDTO.NewPassword);
            Boolean result = _UtilisateurRepository.changePassword(newPassword, currentUserId);
            if (result == true)
            {
                return Ok("mot de passe modifié");
            }
            else
            {
                return Ok("une erreur s'est produite");
            }

        }

        [HttpDelete("{id}")]
        public async Task<IActionResult> DeleteUtilisateur(int id)
        {
            //var currentUserId = int.Parse(HttpContext.User.Claims.FirstOrDefault(x => x.Type == "Id")!.Value);
            var claim = HttpContext.User.Claims.FirstOrDefault(x => x.Type == "Id");
            if (claim == null)
                return Unauthorized("Utilisateur non trouvé. Veuillez vérifier votre login!");

            var currentUserId = int.Parse(claim.Value);

            var result = await _UtilisateurRepository.DeleteUtilisateur(id, currentUserId);
            if (!result)
                return NotFound("Utilisateur non trouvé!");

            return Ok(new { message = "Utilisateur supprimé avec succès!" });
        }

        [HttpPost("changepassword")]
        public async Task<IActionResult> ChangePassword([FromBody] ChangePassword request)
        {
            var utilisateur = _UtilisateurRepository.GetUtilisateurById(request.IdUtilisateur);
            if (utilisateur == null)
                return NotFound("Utilisateur non trouvé!");

            // Vérification de l'ancien mot de passe
            bool isOldPasswordValid = utils.Password.IsValidPassword(request.AncienPassword, utilisateur.password);
            if (!isOldPasswordValid)
                return BadRequest("Ancien mot de passe incorrect!");

            // Vérification : nouveau mot de passe différent de l'ancien
            bool isSamePassword = utils.Password.IsValidPassword(request.NouveauPassword, utilisateur.password);
            if (isSamePassword)
                return BadRequest("Le nouveau mot de passe doit être différent de l'ancien!");

            // Hash du nouveau mot de passe
            utilisateur.password = utils.Password.HashPassword(request.NouveauPassword);

            await _UtilisateurRepository.UpdateUtilisateurPwd(utilisateur);

            return Ok("Modification mot de passe avec succès!");
        }

        [HttpPost("listeutilisateurbylisteid")]
        public async Task<IActionResult> GetUtilisateurs([FromBody] List<int> id)
        {
            if (id == null || !id.Any())
                return NotFound("Utilisateur non trouvé!");

            var utilisateur = await _UtilisateurRepository.GetUtilisateursByIds(id);

            return Ok(utilisateur);
        }

        [HttpPost("changeentete")]
        public async Task<IActionResult> ChangeEntete([FromBody] Entete entete, int id)
        {
            //var currentUserId = int.Parse(HttpContext.User.Claims.FirstOrDefault(x => x.Type == "Id")!.Value);
            var claim = HttpContext.User.Claims.FirstOrDefault(x => x.Type == "Id");
            if (claim == null)
                return Unauthorized("Utilisateur non trouvé. Veuillez vérifier votre login!");

            var currentUserId = int.Parse(claim.Value);

            //Delete ENTETE by idUtilisateur de type AGMO
            var isEntete = await _UtilisateurRepository.DeleteEnteteAGMO(id);

            entete.idUtilisateurAGMO = id;
            await _UtilisateurRepository.AddEnteteAGMO(entete, currentUserId);

            return Ok("Entete enregistré avec succès!");
        }

        // Endpoint temporaire pour générer un hash de mot de passe
        [HttpGet("generate-hash/{password}")]
        public IActionResult GenerateHash(string password)
        {
            string hashedPassword = Password.HashPassword(password);
            return Ok(new
            {
                plainPassword = password,
                hashedPassword = hashedPassword
            });
        }

        [HttpPost("listagmo")]
        public async Task<IActionResult> GetAgmoByIdUser([FromBody] FiltresDTO filtres)
        {
            //var currentUserId = int.Parse(HttpContext.User.Claims.FirstOrDefault(x => x.Type == "Id")!.Value);
            var claim = HttpContext.User.Claims.FirstOrDefault(x => x.Type == "role");
            if (claim == null)
                return Unauthorized("Utilisateur non trouvé. Veuillez vérifier votre login!");

            var currentUserRoleId = int.Parse(claim.Value);

            var currentUserId = int.Parse(HttpContext.User.Claims.FirstOrDefault(x => x.Type == "Id")!.Value);

            //Get role by id
            var role = await _UtilisateurRepository.GetRoleById(currentUserRoleId);

            if (role.nom == "AGMO")
            {
                var Agmos = _UtilisateurRepository.GetUtilisateurById(currentUserId);
                return Ok(Agmos);
            }
            else
            {
                int idRoleAgmo = await _UtilisateurRepository.GetRoleByName("AGMO");

                var Agmos = _UtilisateurRepository.GetAgmosSameProjetSite(currentUserId, idRoleAgmo, filtres);
                return Ok(Agmos);
            }
        }


        //Call the function GetCircuitByRequeteId in CircuitRepository
        [HttpGet("requete/{idRequete}/circuit")]
        [Authorize]
        public async Task<IActionResult> GetCircuitByRequete(int idRequete)
        {
            try
            {
                var circuit = await _circuitRepository.GetCircuitByRequeteId(idRequete);

                if (circuit == null)
                    return NotFound(new { message = "Aucun circuit trouvé pour cette requête" });

                return Ok(circuit);
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { message = "Erreur interne du serveur", error = ex.Message });
            }
        }

        [HttpGet("droitSuppHistoPj")]
        [Authorize]
        public async Task<IActionResult> GetDroitSuppPj()
        {
            //var currentUserId = int.Parse(HttpContext.User.Claims.FirstOrDefault(x => x.Type == "Id")!.Value);
            var claim = HttpContext.User.Claims.FirstOrDefault(x => x.Type == "role");
            if (claim == null)
                return Unauthorized("Utilisateur non trouvé. Veuillez vérifier votre login!");

            var currentUserId = int.Parse(HttpContext.User.Claims.FirstOrDefault(x => x.Type == "Id")!.Value);

            //Get role by id
            var user =  _UtilisateurRepository.GetUtilisateurById(currentUserId);

            if(user == null)
            {
                return Unauthorized("Utilisateur non trouvé. Veuillez vérifier votre login!");
            }
            else
            {
                return Ok(user.canDeleteAttachment);
            }          
        }


    }


}