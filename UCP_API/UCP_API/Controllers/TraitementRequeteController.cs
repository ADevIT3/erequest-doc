using Microsoft.AspNetCore.Mvc;
using UCP_API.repositories;
using UCP_API.models;
using UCP_API.dto;
using Microsoft.AspNetCore.Components.Server.Circuits;
using static UCP_API.repositories.TraitementRequeteRepository;
using UCP_API.utils;
using Newtonsoft.Json;


namespace WebApplication2.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class TraitementRequeteController : ControllerBase
    {
        private readonly TraitementRequeteRepository _TraitementRequeteRepository;
        private readonly CircuitRepository _CircuitRepository;
        private readonly MetaCloudWhatsAppService _waService;
        private readonly HistoriqueValidationRequetePjRepository _HistoriqueValidationRequetePjRepository;
        private readonly CircuitRequeteRepository _CircuitRequeteRepository;
        private readonly RequeteRepository _RequeteRepository;

        public TraitementRequeteController(TraitementRequeteRepository TraitementRequeteRepository, CircuitRepository circuitRepository, MetaCloudWhatsAppService waService, HistoriqueValidationRequetePjRepository historiqueValidationRequetePjRepository, CircuitRequeteRepository circuitRequeteRepository,RequeteRepository requeteRepository)
        {
            _TraitementRequeteRepository = TraitementRequeteRepository;
            _CircuitRepository = circuitRepository;
            _waService = waService;
            _HistoriqueValidationRequetePjRepository = historiqueValidationRequetePjRepository;
            _CircuitRequeteRepository = circuitRequeteRepository;
            _RequeteRepository = requeteRepository;
        }

        //accusé de réception (receveur de requête )
        [HttpPost("receptionrequete/{idrequete}")]
        public async Task<IActionResult> ReceptionRequete(int idrequete)
        {
            //var currentUserId = int.Parse(HttpContext.User.Claims.FirstOrDefault(x => x.Type == "Id")!.Value);
            var claim = HttpContext.User.Claims.FirstOrDefault(x => x.Type == "Id");
            if (claim == null)
                return Unauthorized("Utilisateur non trouvé. Veuillez vérifier votre login!");

            var currentUserId = int.Parse(claim.Value);

            var success = await _TraitementRequeteRepository.ReceptionRequete(idrequete, currentUserId);

            if (!success)
                return NotFound("Requête non trouvée!");

            return Ok(new { message = "Accusé de réception avec succès!" });
        }

        //circuit - requête RATTACHEMENT
        [HttpPost("rattachementcircuitrequete/{idrequete}/{idcircuit}")]
        public async Task<IActionResult> AttachCircuit(int idrequete, int idcircuit)
        {
            //var currentUserId = int.Parse(HttpContext.User.Claims.FirstOrDefault(x => x.Type == "Id")!.Value);
            var claim = HttpContext.User.Claims.FirstOrDefault(x => x.Type == "Id");
            if (claim == null)
                return Unauthorized("Utilisateur non trouvé. Veuillez vérifier votre login!");

            var currentUserId = int.Parse(claim.Value);

            var checkRattachement = _CircuitRequeteRepository.GetCircuitRequetesByIdRequete(idrequete);

            if(checkRattachement == null)
            {
                var result = await _TraitementRequeteRepository.RattRequeteToCircuit(idrequete, idcircuit, currentUserId);

                return result switch
                {
                    RequeteToCircuitResult.NotFound => NotFound(new { message = "Circuit non trouvé!" }),
                    RequeteToCircuitResult.NoStep => BadRequest(new { message = "Le circuit ne contient aucune étape!" }),
                    RequeteToCircuitResult.NoStepValidateur => BadRequest(new { message = "L'une des étapes dans le circuit ne contient aucun validateur!" }),
                    RequeteToCircuitResult.Success => Ok(new { message = "Rattachement de la requête au circuit effectué avec succès!" }),
                    //_ => StatusCode(500, "Erreur inconnue lors du rattachement.") /* tokony tsy tonga ato fa aleo eto ftsn io code io */
                };
            }
            else
            {
                return BadRequest(new { message = "La requête est déja rattachée à un circuit" });
            }
            
        }

        //circuit - requête DETACHEMENT ou REINITIALISTION CIRCUIT (sans touché à ACCUSE RECEPTION
        [HttpPost("detachementcircuitrequete/{idrequete}")]
        public async Task<IActionResult> DetachCircuit(int idrequete)
        {
            var claim = HttpContext.User.Claims.FirstOrDefault(x => x.Type == "Id");
            if (claim == null)
                return Unauthorized("Utilisateur non trouvé. Veuillez vérifier votre login!");

            var currentUserId = int.Parse(claim.Value);

            var result = await _TraitementRequeteRepository.DetachRequeteFromCircuit(idrequete);

            return result switch
            {
                RequeteToCircuitDetachResult.NotFound => NotFound(new { message = "Aucun circuit rattaché à cette requête!" }),
                RequeteToCircuitDetachResult.Success => Ok(new { message = "Détachement du circuit effectué avec succès!" }),
                //_ => StatusCode(500, "Erreur inconnue lors du détachement.") /* tokony tsy tonga ato fa aleo eto ftsn io code io */
            };
        }

        //circuit - requête VALIDATION par requête
        [HttpPost("validationrequete/{idrequete}/")]
        public async Task<IActionResult> ValidationRequete(int idrequete,[FromForm] ValidationRequetePjDTO validationdata)
        {
            //var currentUserId = int.Parse(HttpContext.User.Claims.FirstOrDefault(x => x.Type == "Id")!.Value);

            
            var claim = HttpContext.User.Claims.FirstOrDefault(x => x.Type == "Id");
            if (claim == null)
                return Unauthorized("Utilisateur non trouvé. Veuillez vérifier votre login!");

            var currentUserId = int.Parse(claim.Value); //id validateur

            var validationnext = JsonConvert.DeserializeObject<ValidationRequeteDTO>(validationdata.validationnext);

            var nexetape = await _TraitementRequeteRepository.checkNextEtape(idrequete, currentUserId, validationnext);
            if(nexetape  != null)
            {
                
                if (validationnext.idValidateurNext == null || !validationnext.idValidateurNext.Any())
                    return BadRequest("Veuillez renseigner au moins un validateur pour l'étape suivante!");
            }

            

            if (string.IsNullOrWhiteSpace(validationnext.commentaire))
                return BadRequest("Commentaire obligatoire pour la validation de la requête!");

            var result = await _TraitementRequeteRepository.ValidateRequete(idrequete, currentUserId, validationnext);

            string folderPath = ".\\wwwroot\\Stockages\\justificatifs";
            string fileName = ""; // e.g. "resume.pdf"
            string fullPath = "";

            string extension = "";
            string uniqueName = "";
            Boolean isFileCreated = false;
            if (validationdata.justificatifs != null)
            {
                for (int i = 0; i < validationdata.justificatifs.Length; i++)
                {
                    //fileName = Path.GetFileName(validationdata.justificatifs[i].FileName); // e.g. "resume.pdf"

                    fileName = Path.GetFileNameWithoutExtension(validationdata.justificatifs[i].FileName);
                    extension = Path.GetExtension(validationdata.justificatifs[i].FileName);

                    uniqueName = $"{fileName}_{Guid.NewGuid()}{extension}";

                    fullPath = Path.Combine(folderPath, uniqueName);

                    isFileCreated = FileUtil.SaveFile(validationdata.justificatifs[i], fullPath);
                    if (isFileCreated == true)
                    {
                        HistoriqueValidationRequetePj rj = new HistoriqueValidationRequetePj();
                        rj.IdHistoriqueValidationRequete = result.idHistoriqueValidationRequete;
                        rj.Src = fullPath;
                        rj.DateCreation = DateTime.Now;
                        
                        _HistoriqueValidationRequetePjRepository.AddHistoriqueValidationRequetePj(rj);
                    }
                }
            }
            
            if(validationnext.numBr != "")
            {
                _RequeteRepository.UpdateNumBr(idrequete,validationnext.numBr);
            }

            /*return result switch
            {
                ValidateRequeteResult.NotFoundHisto => NotFound(new { message = "Aucun circuit rattaché à cette requête!" }),
                ValidateRequeteResult.NotFoundRequete => NotFound(new { message = "Requête non trouvée!" }),
                ValidateRequeteResult.Success => Ok(new { message = "Validation de la requête effectuée avec succès!" }),
                //_ => StatusCode(500, "Erreur inconnue lors de la validation.") /* tokony tsy tonga ato fa aleo eto ftsn io code io */
            //};

            if(result == null)
            {
                //ValidateRequeteResult.NotFoundHisto => NotFound(new { message = "Aucun circuit rattaché à cette requête!" }),
                return NotFound(new { message = "Requête non trouvée!" });
            }
            else
            {
                return Ok(new { message = "Validation de la requête effectuée avec succès!" });
            }
        }

        //circuit - requête VALIDATION MULTIPLE
        [HttpPost("validationmultiplerequete")]
        public async Task<IActionResult> ValidationRequete([FromQuery] List<int> idrequete)
        {
            //var currentUserId = int.Parse(HttpContext.User.Claims.FirstOrDefault(x => x.Type == "Id")!.Value);
            var claim = HttpContext.User.Claims.FirstOrDefault(x => x.Type == "Id");
            if (claim == null)
                return Unauthorized("Utilisateur non trouvé. Veuillez vérifier votre login!");

            var currentUserId = int.Parse(claim.Value); //id validateur

            if (idrequete == null || !idrequete.Any())
                return BadRequest("Veuillez sélectionner au moins une requête à valider!");

            var result = await _TraitementRequeteRepository.ValidateMultipleRequete(idrequete, currentUserId);

            return Ok(new { message = "Validation des requêtes effectuée avec succès!" });
        }

        //circuit - requête REFUS requête
        [HttpPost("refusrequete/{idrequete}")]
        public async Task<IActionResult> RefusRequete(int idrequete, [FromBody] RefusRequeteDTO refus)
        {
            //var currentUserId = int.Parse(HttpContext.User.Claims.FirstOrDefault(x => x.Type == "Id")!.Value);
            var claim = HttpContext.User.Claims.FirstOrDefault(x => x.Type == "Id");
            if (claim == null)
                return Unauthorized("Utilisateur non trouvé. Veuillez vérifier votre login!");

            var currentUserId = int.Parse(claim.Value); //id validateur

            if (string.IsNullOrWhiteSpace(refus.commentaire))
                return BadRequest("Commentaire obligatoire pour le refus de la requête!");

            var result = await _TraitementRequeteRepository.RefusRequete(idrequete, currentUserId, refus);

            return result switch
            {
                RefusRequeteResult.NotFoundHisto => NotFound(new { message = "Aucun circuit rattaché à cette requête!" }),
                RefusRequeteResult.NotFoundRequete => NotFound(new { message = "Requête non trouvée!" }),
                RefusRequeteResult.Success => Ok(new { message = "Refus de la requête effectué avec succès!" }),
                RefusRequeteResult.NotFoundAccuse => NotFound(new { message = "aucun accusé de récéption " }),
                //_ => StatusCode(500, "Erreur inconnue lors du refus.") /* tokony tsy tonga ato fa aleo eto ftsn io code io */
            };
        }

        //circuit - requête REDIRECTION
        [HttpPost("redirectionrequete/{idrequete}")]
        public async Task<IActionResult> RedirectionRequete(int idrequete, [FromBody] RedirectionRequeteDTO redirection)
        {
            //var currentUserId = int.Parse(HttpContext.User.Claims.FirstOrDefault(x => x.Type == "Id")!.Value);
            var claim = HttpContext.User.Claims.FirstOrDefault(x => x.Type == "Id");
            if (claim == null)
                return Unauthorized("Utilisateur non trouvé. Veuillez vérifier votre login!");

            var currentUserId = int.Parse(claim.Value); //id validateur

            if (redirection.idCircuitEtapeRedirection == 0)
                return BadRequest("Veuillez renseigner l'étape de redirection de la requête!");

            if (string.IsNullOrWhiteSpace(redirection.commentaire))
                return BadRequest("Commentaire obligatoire pour la redirection de la requête!");

            var result = await _TraitementRequeteRepository.RedirectionRequete(idrequete, currentUserId, redirection);

            return result switch
            {
                RedirectionRequeteResult.NotFoundHisto => NotFound(new { message = "Aucun circuit rattaché à cette requête!" }),
                RedirectionRequeteResult.NotFoundRequete => NotFound(new { message = "Requête non trouvée!" }),
                RedirectionRequeteResult.NotFoundStepNext => NotFound(new { message = "Etape actuelle non trouvée!" }),
                RedirectionRequeteResult.NotFoundStepActuelle => NotFound(new { message = "Etape de redirection non trouvée!" }),
                RedirectionRequeteResult.InvalidRedirection => BadRequest(new { message = "La redirection doit se faire vers une étape précédente déjà validée!" }),
                RedirectionRequeteResult.Success => Ok(new { message = "Redirection de la requête avec succès!" }),
                //_ => StatusCode(500, "Erreur inconnue lors de la redirection.") /* tokony tsy tonga ato fa aleo eto ftsn io code io */
            };
        }

        [HttpGet("gethisto/{idrequete}")]
        public async Task<ActionResult<List<HistoValidationDTO>>> GetValidationHistory(int idrequete)
        {
            var result = await _TraitementRequeteRepository.GetValidationHistoryDetails(idrequete);

            if (result == null || result.Count == 0)
                return NotFound($"Aucun historique trouvé pour la requête!");

            return Ok(result);
        }

        [HttpGet("gethistorefus/{idrequete}")]
        public async Task<ActionResult<List<HistoValidationDTO>>> GetRefusHistory(int idrequete)
        {
            var result = await _TraitementRequeteRepository.GetCanceledHistoryDetails(idrequete);

            if (result == null || result.Count == 0)
                return NotFound($"Aucun refus trouvé pour la requête!");

            return Ok(result);
        }

        [HttpGet("gethistoredirection/{idrequete}")]
        public async Task<ActionResult<List<HistoValidationDTO>>> GetRedirectionHistory(int idrequete)
        {
            var result = await _TraitementRequeteRepository.GetRedirectionHistoryDetails(idrequete);

            if (result == null || result.Count == 0)
                return NotFound($"Aucune redirection trouvée pour la requête!");

            return Ok(result);
        }

        [HttpPost("sendnotifwhatsapp/{to}")]
        public async Task<IActionResult> Send(string to)
        {
            await _waService.SendWhatsAppMessage(
                to,
                "Achat fournitures",
                "RQ20240526-001",
                "850 000 Ar",
                "En cours de traitement"
            );
            return Ok("Message envoyé !");
        }
    }

}