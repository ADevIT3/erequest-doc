
using Microsoft.AspNetCore.Mvc;
using UCP_API.repositories;
using UCP_API.utils;
using UCP_API.models;
using UCP_API.dto;
using Microsoft.AspNetCore.Components.Server.Circuits;
using static UCP_API.repositories.TraitementJustifRepository;
using static UCP_API.repositories.TraitementRequeteRepository;
using Newtonsoft.Json;

namespace UCP_API.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class TraitementJustifController : Controller
    {
        private readonly TraitementJustifRepository _TraitementJustifRepository;
        private readonly CircuitRepository _CircuitRepository;
        private readonly MetaCloudWhatsAppService _waService;
        private readonly HistoriqueValidationJustificatifPjRepository _HistoriqueValidationJustificatifPjRepository;

        public TraitementJustifController(TraitementJustifRepository TraitementJustifRepository, CircuitRepository circuitRepository, MetaCloudWhatsAppService waService, HistoriqueValidationJustificatifPjRepository HistoriqueValidationJustificatifPjRepository)
        {
            _TraitementJustifRepository = TraitementJustifRepository;
            _CircuitRepository = circuitRepository;
            _waService = waService;
            _HistoriqueValidationJustificatifPjRepository = HistoriqueValidationJustificatifPjRepository;
        }

        //accusé de réception (receveur de requete )
        [HttpPost("receptionjustif/{idjustif}")]
        public async Task<IActionResult> ReceptionJustif(int idjustif)
        {
            //var currentUserId = int.Parse(HttpContext.User.Claims.FirstOrDefault(x => x.Type == "Id")!.Value);
            var claim = HttpContext.User.Claims.FirstOrDefault(x => x.Type == "Id");
            if (claim == null)
                return Unauthorized("Utilisateur non trouvé. Veuillez vérifier votre login!");

            var currentUserId = int.Parse(claim.Value);

            var success = await _TraitementJustifRepository.ReceptionJustif(idjustif, currentUserId);

            if (!success)
                return NotFound("Justificatif non trouvé!");

            return Ok(new { message = "Accusé de réception avec succès!" });
        }

        //circuit - justificatif RATTACHEMENT
        [HttpPost("rattachementcircuitjustif/{idjustif}/{idcircuit}")]
        public async Task<IActionResult> AttachCircuit(int idjustif, int idcircuit)
        {
            //var currentUserId = int.Parse(HttpContext.User.Claims.FirstOrDefault(x => x.Type == "Id")!.Value);
            var claim = HttpContext.User.Claims.FirstOrDefault(x => x.Type == "Id");
            if (claim == null)
                return Unauthorized("Utilisateur non trouvé. Veuillez vérifier votre login!");

            var currentUserId = int.Parse(claim.Value);

            var result = await _TraitementJustifRepository.RattJustifToCircuit(idjustif, idcircuit, currentUserId);

            return result switch
            {
                JustifToCircuitResult.NotFound => NotFound(new { message = "Circuit non trouvé!" }),
                JustifToCircuitResult.NoStep => BadRequest(new { message = "Le circuit ne contient aucune étape!" }),
                JustifToCircuitResult.NoStepValidateur => BadRequest(new { message = "L'une des étapes dans le circuit ne contient aucun validateur!" }),
                JustifToCircuitResult.Success => Ok(new { message = "Rattachement du justificatif au circuit effectué avec succès!" }),
                //_ => StatusCode(500, "Erreur inconnue lors du rattachement.") /* tokony tsy tonga ato fa aleo eto ftsn io code io */
            };
        }

        //circuit - justificatif DETACHEMENT ou REINITIALISTION CIRCUIT (sans touché à ACCUSE RECEPTION)
        [HttpPost("detachementcircuitjustif/{idjustif}")]
        public async Task<IActionResult> DetachCircuit(int idjustif)
        {
            var claim = HttpContext.User.Claims.FirstOrDefault(x => x.Type == "Id");
            if (claim == null)
                return Unauthorized("Utilisateur non trouvé. Veuillez vérifier votre login!");

            var currentUserId = int.Parse(claim.Value);

            var result = await _TraitementJustifRepository.DetachJustifFromCircuit(idjustif);

            return result switch
            {
                JustifToCircuitDetachResult.NotFound => NotFound(new { message = "Aucun circuit rattaché à ce justificatif!" }),
                JustifToCircuitDetachResult.Success => Ok(new { message = "Détachement du circuit effectué avec succès!" }),
                //_ => StatusCode(500, "Erreur inconnue lors du détachement.") /* tokony tsy tonga ato fa aleo eto ftsn io code io */
            };
        }

       

        [HttpPost("validationjustif/{idjustif}/")]
        public async Task<IActionResult> ValidationRequete(int idjustif, [FromForm] ValidationJustificatifPjDTO validationdata)
        {
            //var currentUserId = int.Parse(HttpContext.User.Claims.FirstOrDefault(x => x.Type == "Id")!.Value);


            var claim = HttpContext.User.Claims.FirstOrDefault(x => x.Type == "Id");
            if (claim == null)
                return Unauthorized("Utilisateur non trouvé. Veuillez vérifier votre login!");

            var currentUserId = int.Parse(claim.Value); //id validateur

            var validationnext = JsonConvert.DeserializeObject<ValidationJustifDTO>(validationdata.validationnext);

            var nexetape = await _TraitementJustifRepository.checkNextEtape(idjustif, currentUserId, validationnext);
            if (nexetape != null)
            {

                if (validationnext.idValidateurNext == null || !validationnext.idValidateurNext.Any())
                    return BadRequest("Veuillez renseigner au moins un validateur pour l'étape suivante!");
            }



            if (string.IsNullOrWhiteSpace(validationnext.commentaire))
                return BadRequest("Commentaire obligatoire pour la validation de la requête!");

            var result = await _TraitementJustifRepository.ValidateJustif(idjustif, currentUserId, validationnext);

            string folderPath = ".\\wwwroot\\Stockages\\justificatifs";
            string fileName = ""; // e.g. "resume.pdf"
            string fullPath = "";
            Boolean isFileCreated = false;

            string extension = "";
            string uniqueName = "";

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
                        HistoriqueValidationJustificatifPj rj = new HistoriqueValidationJustificatifPj();
                        rj.IdHistoriqueValidationJustificatif = result.idHistoriqueValidationJustificatif;
                        rj.Src = fullPath;
                        rj.DateCreation = DateTime.Now;

                        _HistoriqueValidationJustificatifPjRepository.AddHistoriqueValidationJustificatifPj(rj);
                    }
                }
            }


            /*return result switch
            {
                ValidateRequeteResult.NotFoundHisto => NotFound(new { message = "Aucun circuit rattaché à cette requête!" }),
                ValidateRequeteResult.NotFoundRequete => NotFound(new { message = "Requête non trouvée!" }),
                ValidateRequeteResult.Success => Ok(new { message = "Validation de la requête effectuée avec succès!" }),
                //_ => StatusCode(500, "Erreur inconnue lors de la validation.") /* tokony tsy tonga ato fa aleo eto ftsn io code io */
            //};

            if (result == null)
            {
                //ValidateRequeteResult.NotFoundHisto => NotFound(new { message = "Aucun circuit rattaché à cette requête!" }),
                return NotFound(new { message = "Requête non trouvée!" });
            }
            else
            {
                return Ok(new { message = "Validation du justificatif effectuée avec succès!" });
            }
        }

        //circuit - justificatif VALIDATION MULTIPLE
        [HttpPost("validationmultiplejustif")]
        public async Task<IActionResult> ValidationJustif([FromQuery] List<int> idjustif)
        {
            //var currentUserId = int.Parse(HttpContext.User.Claims.FirstOrDefault(x => x.Type == "Id")!.Value);
            var claim = HttpContext.User.Claims.FirstOrDefault(x => x.Type == "Id");
            if (claim == null)
                return Unauthorized("Utilisateur non trouvé. Veuillez vérifier votre login!");

            var currentUserId = int.Parse(claim.Value); //id validateur

            if (idjustif == null || !idjustif.Any())
                return BadRequest("Veuillez sélectionner au moins un justificatif à valider!");

            var result = await _TraitementJustifRepository.ValidateMultipleJustif(idjustif, currentUserId);

            return Ok(new { message = "Validation des justificatifs effectué avec succès!" });
        }

        //circuit - justificatif REFUS justificatif
        [HttpPost("refusjustif/{idjustif}/")]
        public async Task<IActionResult> RefusJustife(int idjustif, [FromBody] RefusJustifDTO refus)
        {
            //var currentUserId = int.Parse(HttpContext.User.Claims.FirstOrDefault(x => x.Type == "Id")!.Value);
            var claim = HttpContext.User.Claims.FirstOrDefault(x => x.Type == "Id");
            if (claim == null)
                return Unauthorized("Utilisateur non trouvé. Veuillez vérifier votre login!");

            var currentUserId = int.Parse(claim.Value); //id validateur

            if (string.IsNullOrWhiteSpace(refus.commentaire))
                return BadRequest("Commentaire obligatoire pour le refus du justificatif!");

            var result = await _TraitementJustifRepository.RefusJustif(idjustif, currentUserId, refus);

            return result switch
            {
                RefusJustifResult.NotFoundHisto => NotFound(new { message = "Aucun circuit rattaché à ce justificatif!" }),
                RefusJustifResult.NotFoundRequete => NotFound(new { message = "Justificatif non trouvé!" }),
                RefusJustifResult.Success => Ok(new { message = "Refus du justificatif effectué avec succès!" }),
                //_ => StatusCode(500, "Erreur inconnue lors du refus.") /* tokony tsy tonga ato fa aleo eto ftsn io code io */
            };
        }

        //circuit - justificatif REDIRECTION
        [HttpPost("redirectionjustif/{idjustif}/")]
        public async Task<IActionResult> RedirectionRequete(int idjustif, [FromBody] RedirectionJustifDTO redirection)
        {
            //var currentUserId = int.Parse(HttpContext.User.Claims.FirstOrDefault(x => x.Type == "Id")!.Value);
            var claim = HttpContext.User.Claims.FirstOrDefault(x => x.Type == "Id");
            if (claim == null)
                return Unauthorized("Utilisateur non trouvé. Veuillez vérifier votre login!");

            var currentUserId = int.Parse(claim.Value); //id validateur

            if (redirection.idCircuitEtapeRedirection == 0)
                return BadRequest("Veuillez renseigner l'étape de redirection du justificatif!");

            if (string.IsNullOrWhiteSpace(redirection.commentaire))
                return BadRequest("Commentaire obligatoire pour la redirection du justificatif!");

            var result = await _TraitementJustifRepository.RedirectionJustif(idjustif, currentUserId, redirection);

            return result switch
            {
                RedirectionJustifResult.NotFoundHisto => NotFound(new { message = "Aucun circuit rattaché à ce justificatif!" }),
                RedirectionJustifResult.NotFoundRequete => NotFound(new { message = "Justificatif non trouvé!" }),
                RedirectionJustifResult.NotFoundStepNext => NotFound(new { message = "Etape actuelle non trouvée!" }),
                RedirectionJustifResult.NotFoundStepActuelle => NotFound(new { message = "Etape de redirection non trouvée!" }),
                RedirectionJustifResult.InvalidRedirection => BadRequest(new { message = "La redirection doit se faire vers une étape précédente déjà validée!" }),
                RedirectionJustifResult.Success => Ok(new { message = "Redirection du justificatif avec succès!" }),
                //_ => StatusCode(500, "Erreur inconnue lors de la redirection.") /* tokony tsy tonga ato fa aleo eto ftsn io code io */
            };
        }

        [HttpGet("gethistojustif/{idjustif}")]
        public async Task<ActionResult<List<HistoValidationDTO>>> GetValidationHistory(int idjustif)
        {
            var result = await _TraitementJustifRepository.GetValidationHistoryDetails(idjustif);

            if (result == null || result.Count == 0)
                return NotFound($"Aucun historique trouvé pour le justificatif!");

            return Ok(result);
        }

        [HttpGet("gethistojustifrefus/{idjustif}")]
        public async Task<ActionResult<List<HistoValidationDTO>>> GetRefusHistory(int idjustif)
        {
            var result = await _TraitementJustifRepository.GetCanceledHistoryDetails(idjustif);

            if (result == null || result.Count == 0)
                return NotFound($"Aucun refus trouvé pour le justificatif!");

            return Ok(result);
        }

        [HttpGet("gethistojustifredirection/{idjustif}")]
        public async Task<ActionResult<List<HistoValidationDTO>>> GetRedirectionHistory(int idjustif)
        {
            var result = await _TraitementJustifRepository.GetRedirectionHistoryDetails(idjustif);

            if (result == null || result.Count == 0)
                return NotFound($"Aucune redirection trouvée pour le justificatif!");

            return Ok(result);
        }
    }
}
