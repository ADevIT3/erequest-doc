using Microsoft.AspNetCore.Mvc;
using UCP_API.repositories;
using UCP_API.models;
using UCP_API.dto;
using static UCP_API.repositories.CircuitRepository;

namespace WebApplication2.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class CircuitController : ControllerBase
    {
        private readonly CircuitRepository _CircuitRepository;
        private readonly UtilisateurRepository _UtilisateurRepository;

        public CircuitController(CircuitRepository CircuitRepository, UtilisateurRepository utilisateurRepository)
        {
            _CircuitRepository = CircuitRepository;
            _UtilisateurRepository = utilisateurRepository;
        }

        [HttpGet]
        public async Task<IActionResult> GetAllCircuit()
        {
            //var currentUserId = int.Parse(HttpContext.User.Claims.FirstOrDefault(x => x.Type == "Id")!.Value);
            var claim = HttpContext.User.Claims.FirstOrDefault(x => x.Type == "role");
            if (claim == null)
                return Unauthorized("Utilisateur non trouvé. Veuillez vérifier votre login!");

            var currentUserRoleId = int.Parse(claim.Value);

            var currentUserId = int.Parse(HttpContext.User.Claims.FirstOrDefault(x => x.Type == "Id")!.Value);

            //Get role by id
            var role = await _UtilisateurRepository.GetRoleById(currentUserRoleId);
            Utilisateur u = _UtilisateurRepository.FindByIdUtilisateur(currentUserId);

            /*if (role.nom == "SuperAdmin")
            {
                var Circuits = await _CircuitRepository.GetCircuits();
                return Ok(Circuits);
            }
            else if (role.nom == "Admin")
            {
                var Circuits = await _CircuitRepository.GetCircuitsByCurrentUserProjetSite(currentUserId);
                return Ok(Circuits);
            }
            else return Ok(new List<Circuit>());*/
            var Circuits = await _CircuitRepository.GetCircuits();
            return Ok(Circuits);
            
        }

        [HttpGet("utilisateur_projet")]
        public async Task<IActionResult> GetCircuitByUtilisateurProjet()
        {
            //var currentUserId = int.Parse(HttpContext.User.Claims.FirstOrDefault(x => x.Type == "Id")!.Value);
            var claim = HttpContext.User.Claims.FirstOrDefault(x => x.Type == "role");
            if (claim == null)
                return Unauthorized("Utilisateur non trouvé. Veuillez vérifier votre login!");

            var currentUserRoleId = int.Parse(claim.Value);

            var currentUserId = int.Parse(HttpContext.User.Claims.FirstOrDefault(x => x.Type == "Id")!.Value);

            //Get role by id
            var role = await _UtilisateurRepository.GetRoleById(currentUserRoleId);
            Utilisateur u = _UtilisateurRepository.FindByIdUtilisateur(currentUserId);

            /*if (role.nom == "SuperAdmin")
            {
                var Circuits = await _CircuitRepository.GetCircuits();
                return Ok(Circuits);
            }
            else if (role.nom == "Admin")
            {
                var Circuits = await _CircuitRepository.GetCircuitsByCurrentUserProjetSite(currentUserId);
                return Ok(Circuits);
            }
            else return Ok(new List<Circuit>());*/
            var Circuits = await _CircuitRepository.GetCircuitsByCurrentUserProjetSite(currentUserId);
            return Ok(Circuits);

        }

        [HttpGet("{id}")]
        public async Task<IActionResult> GetCircuit(int id)
        {
            var Circuit = await _CircuitRepository.GetCircuitById(id);

            if (Circuit == null)
                return NotFound("Circuit non trouvé!");

            return Ok(Circuit);
        }

        [HttpGet("V2/{id}")]
        public async Task<IActionResult> GetCircuitV2(int id)
        {
            var Circuit = await _CircuitRepository.GetCircuitByIdV2(id);

            if (Circuit == null)
                return NotFound("Circuit non trouvé!");

            return Ok(Circuit);
        }

        [HttpDelete("{id}")]
        public async Task<IActionResult> DeleteCircuit(int id)
        {
            //var currentUserId = int.Parse(HttpContext.User.Claims.FirstOrDefault(x => x.Type == "Id")!.Value);
            var claim = HttpContext.User.Claims.FirstOrDefault(x => x.Type == "Id");
            if (claim == null)
                return Unauthorized("Utilisateur non trouvé. Veuillez vérifier votre login!");

            var currentUserId = int.Parse(claim.Value);

            var (success, errorMessage) = await _CircuitRepository.DeleteCircuit(id, currentUserId);

            if (!success)
                return BadRequest(new { message = errorMessage });

            return Ok(new { message = "Circuit supprimé avec succès!" });
        }

        //Disable circuit
        [HttpPost("disabled/{id}")]
        public async Task<IActionResult> DisableCircuit(int id)
        {
            var Circuit = await _CircuitRepository.DisableCircuit(id);

            if (!Circuit.Success)
                return NotFound(new { message = Circuit.ErrorMessage });

            return Ok(new
            {
                message = Circuit.IsDisabled
                ? "Circuit désactivé avec succès!"
                : "Circuit activé avec succès!"
            });
        }

        [HttpPost("create")]
        public async Task<ActionResult> CreateCircuit([FromBody] CreateCircuitDTO Circuit)
        {
            //var currentUserId = int.Parse(HttpContext.User.Claims.FirstOrDefault(x => x.Type == "Id")!.Value);
            Console.WriteLine("tafiditra");
            var claim = HttpContext.User.Claims.FirstOrDefault(x => x.Type == "Id");
            if (claim == null)
                return Unauthorized("Utilisateur non trouvé. Veuillez vérifier votre login!");

            var currentUserId = int.Parse(claim.Value);

            if (!ModelState.IsValid)
                return BadRequest(ModelState);
            for (int i = 0;i< Circuit.Etapes.Count(); i++)
            {
                Circuit.Etapes[i].Numero = i + 1;
                //Circuit.Etapes[i].isRefusable = true;
            }
            var created = await _CircuitRepository.AddCircuit(Circuit, currentUserId);
            if (created == null)
                return BadRequest("Un circuit avec le même libellé existe déjà!");

            return Ok(new { message = "Circuit créé avec succès!", circuitId = created.idCircuit });
        }

        [HttpPut("{idcircuit}")]
        public async Task<IActionResult> UpdateCircuit(int idcircuit, [FromBody] CreateCircuitDTO updatedCircuit)
        {
            Console.WriteLine("--------------UPDATING-------------");
            //var currentUserId = int.Parse(HttpContext.User.Claims.FirstOrDefault(x => x.Type == "Id")!.Value);
            var claim = HttpContext.User.Claims.FirstOrDefault(x => x.Type == "Id");
            if (claim == null)
                return Unauthorized("Utilisateur non trouvé. Veuillez vérifier votre login!");

            var currentUserId = int.Parse(claim.Value);

            var CircuitUpd = await _CircuitRepository.UpdateCircuit(idcircuit, updatedCircuit, currentUserId);

            return CircuitUpd switch
            {
                UpdateCircuitResult.NotFound => NotFound("Circuit non trouvé!"),
                UpdateCircuitResult.DuplicateLibelle => BadRequest("Un circuit avec le même libellé existe déjà !"),
                UpdateCircuitResult.Updated => Ok(new { message = "Circuit mis à jour avec succès!" }),
                UpdateCircuitResult.UpdatedValiCheck => Ok(new { message = "Circuit en cours d'utilisation, les mises à jours des validateurs et/ou checklists effectuées avec succès!" })
                //_ => StatusCode(500, "Erreur inconnue lors de la mise à jour!") /* tokony tsy tonga ato fa aleo eto ftsn io code io */
            };
        }



        [HttpPost("duplicate/{idcircuit}")]
        public async Task<IActionResult> DuplicateCircuit(int idcircuit, [FromBody] string newLibelle)
        {
            //var currentUserId = int.Parse(HttpContext.User.Claims.FirstOrDefault(x => x.Type == "Id")!.Value);
            var claim = HttpContext.User.Claims.FirstOrDefault(x => x.Type == "Id");
            if (claim == null)
                return Unauthorized("Utilisateur non trouvé. Veuillez vérifier votre login!");

            var currentUserId = int.Parse(claim.Value);

            var (circuit, result) = await _CircuitRepository.DuplicateCircuit(idcircuit, newLibelle, currentUserId);

            return result switch
            {
                DuplicateCircuitResult.NotFound => NotFound(new { message = "Circuit à dupliquer non trouvé!" }),
                DuplicateCircuitResult.DuplicateLibelle => BadRequest(new { message = "Un circuit avec ce libellé existe déjà!" }),
                DuplicateCircuitResult.Success => Ok(new { message = "Circuit dupliqué avec succès!", circuit }),
                //_ => StatusCode(500, "Erreur inconnue lors de la duplication.") /* tokony tsy tonga ato fa aleo eto ftsn io code io */
            };
        }

        //Etape E => pour avoir liste des validateur étape E
        [HttpGet("getetape/{idetape}")]
        public async Task<IActionResult> GetCircuitEtapeById(int idetape)
        {
            var etape = await _CircuitRepository.GetCircuitEtapeById(idetape);

            if (etape == null)
                return NotFound("Etape non trouvée!");

            return Ok(etape);
        }

        //Etape E + 1 => pour avoir liste des validateur étape E + 1
        [HttpGet("getetapenextfirst/{idetape}")]
        public async Task<IActionResult> GetCircuitEtapeValidateurEtapeNextFirst(int idetape)
        {
            var etapenext = await _CircuitRepository.GetCircuitEtapeValidateurEtapeNextFirst(idetape);

            if (etapenext == null)
                return NotFound("Etape non trouvée!");

            return Ok(etapenext);
        }

        //Etape E + 2 => pour avoir liste des validateur étape E + 2
        [HttpGet("getetapenextseconde/{idetape}")]
        public async Task<IActionResult> GetCircuitEtapeValidateurEtapeNextSeconde(int idetape)
        {
            var etapenext = await _CircuitRepository.GetCircuitEtapeValidateurEtapeNextSeconde(idetape);

            if (etapenext == null)
                return NotFound("Etape non trouvée!");

            return Ok(etapenext);
        }

        //liste des étapes précédent pour redirection
        [HttpGet("getetapeprevious/{idetape}")]
        public async Task<IActionResult> GetCircuitEtapePrevious(int idetape)
        {
            var etapeprev = await _CircuitRepository.GetCircuitEtapePrevious(idetape);

            if (etapeprev == null)
                return NotFound("Etape non trouvée!");

            return Ok(etapeprev);
        }

        //Etape actuelle de la requete
        [HttpGet("getetaperequete/{idrequete}")]
        public async Task<IActionResult> GetCircuitEtapeByIdRequete(int idrequete)
        {
            var etape = await _CircuitRepository.GetCircuitEtapeActuelByIdRequete(idrequete);

            if (etape == null)
                return NotFound("Etape non trouvée!");

            for(int i = 0; i < etape.Validateurs.Count(); i++)
            {
                etape.Utilisateurs.Add(_UtilisateurRepository.GetUtilisateurById(etape.Validateurs[i]));
            }

            return Ok(etape);
        }

        //Etape actuelle de la requete
        [HttpGet("getetapejustif/{idjustif}")]
        public async Task<IActionResult> GetCircuitEtapeByIdJustif(int idjustif)
        {
            var etape = await _CircuitRepository.GetCircuitEtapeActuelByIdJustif(idjustif);

            if (etape == null)
                return NotFound("Etape non trouvée!");

            return Ok(etape);
        }
    }

}