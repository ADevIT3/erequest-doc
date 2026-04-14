using Microsoft.AspNetCore.Mvc;
using UCP_API.repositories;
using UCP_API.dto;

namespace UCP_API.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class BordController : Controller
    {
        private readonly BordRepository _BordRepository;

        public BordController(BordRepository BordRepository)
        {
            _BordRepository = BordRepository;
        }

        // Tdb1 : REQUETE : Situation global des requêtes
        // filtres.statut => NULL si tous, Initie = 0, Envoye = 1, EnCours = 2, Refuse = 3, Valide = 4, Cloture = 5
        // filtres.statut => NULL si tous, 0:initié (statut=0 et non dans requeteJustificatif), 1:envoyé (statut=0 et dans requeteJustificatif), 2:encours (status=1 et 4), 3:refusé (status=2), 4:validé(status=5), 5:cloturé (colonne cloture=true)
        // Filtres : PROJET, SITE, AGMO, PERIODE, STATUT
        [HttpPost("tdb1requete")]
        public async Task<ActionResult<List<Tdb1RequeteDTO>>> Tdb1Requete([FromBody] FiltresDTO filtres)
        {
            //var currentUserId = int.Parse(HttpContext.User.Claims.FirstOrDefault(x => x.Type == "Id")!.Value);
            var claim = HttpContext.User.Claims.FirstOrDefault(x => x.Type == "Id");
            if (claim == null)
                return Unauthorized("Utilisateur non trouvé. Veuillez vérifier votre login!");

            var result = await _BordRepository.Tdb1Requete(filtres);

            return Ok(result);
        }

        // Tdb2 : JUSTIF : Situation global des justificatifs
        // filtres.statut => NULL si tous, Envoye = 0 , EnCours = 1, Refuse = 2, Valide = 3, Cloture = 4
        // filtres.statut => NULL si tous, 0:envoyé (statut=0), 1:encours (status=1 et 4), 2:refusé (status=2), 3:validé(status=5), 4:cloturé (colonne cloture=true dans requête)
        // Filtres : PROJET, SITE, AGMO, PERIODE, STATUT
        [HttpPost("tdb2justificatif")]
        public async Task<ActionResult<List<Tdb2JustifDTO>>> Tdb2Justificatif([FromBody] FiltresDTO filtres)
        {
            //var currentUserId = int.Parse(HttpContext.User.Claims.FirstOrDefault(x => x.Type == "Id")!.Value);
            var claim = HttpContext.User.Claims.FirstOrDefault(x => x.Type == "Id");
            if (claim == null)
                return Unauthorized("Utilisateur non trouvé. Veuillez vérifier votre login!");

            var result = await _BordRepository.Tdb2Justificatif(filtres);

            return Ok(result);
        }

        // Tdb3 : REQUETE : Suivi des requêtes : Suivre l’état d’avancement et les retards potentiels dans le traitement des requêtes
        // Filtres : PROJET, SITE, AGMO, PERIODE
        [HttpPost("tdb3requete")]
        public async Task<ActionResult<List<Tdb3RequeteDTO>>> Tdb3Requete([FromBody] FiltresDTO filtres)
        {
            //var currentUserId = int.Parse(HttpContext.User.Claims.FirstOrDefault(x => x.Type == "Id")!.Value);
            var claim = HttpContext.User.Claims.FirstOrDefault(x => x.Type == "Id");
            if (claim == null)
                return Unauthorized("Utilisateur non trouvé. Veuillez vérifier votre login!");

            var result = await _BordRepository.Tdb3Requete(filtres);

            return Ok(result);
        }

        // Tdb5 : REQUETE : Liste des requêtes non justifiées : izay requête mbola misy reste à justifier rehetra dia mipoitra ato
        // Filtres : PROJET, SITE, AGMO, PERIODE
        [HttpPost("tdb5requete")]
        public async Task<ActionResult<List<Tdb5RequeteDTO>>> Tdb5Requete([FromBody] FiltresDTO filtres)
        {
            //var currentUserId = int.Parse(HttpContext.User.Claims.FirstOrDefault(x => x.Type == "Id")!.Value);
            /*var claim = HttpContext.User.Claims.FirstOrDefault(x => x.Type == "Id");
            if (claim == null)
                return Unauthorized("Utilisateur non trouvé. Veuillez vérifier votre login!");*/

            var result = await _BordRepository.Tdb5Requete(filtres);

            return Ok(result);
        }

        // Filtre : REQUETE : Liste numéro requête
        // Filtres : PROJET, SITE, AGMO
        [HttpPost("listenumerorequete")]
        public async Task<ActionResult<List<string>>> ListeNumeroRequete([FromBody] FiltresDTO filtres)
        {
            //var currentUserId = int.Parse(HttpContext.User.Claims.FirstOrDefault(x => x.Type == "Id")!.Value);
            var claim = HttpContext.User.Claims.FirstOrDefault(x => x.Type == "Id");
            if (claim == null)
                return Unauthorized("Utilisateur non trouvé. Veuillez vérifier votre login!");

            var result = await _BordRepository.ListeNumeroRequete(filtres);

            return Ok(result);
        }

        // Filtre : REQUETE : Liste référence interne requête
        // Filtres : PROJET, SITE, AGMO
        [HttpPost("listerefinternerequete")]
        public async Task<ActionResult<List<string>>> ListeRefInterneRequete([FromBody] FiltresDTO filtres)
        {
            //var currentUserId = int.Parse(HttpContext.User.Claims.FirstOrDefault(x => x.Type == "Id")!.Value);
            var claim = HttpContext.User.Claims.FirstOrDefault(x => x.Type == "Id");
            if (claim == null)
                return Unauthorized("Utilisateur non trouvé. Veuillez vérifier votre login!");

            var result = await _BordRepository.ListeRefInterneRequete(filtres);

            return Ok(result);
        }

        // Tdb6 : REQUETE : Suivi de délai de traitement des requêtes
        // Filtres : PROJET, SITE, AGMO, NUMERO OU REFINTERNE REQUETE
        [HttpPost("tdb6requete")]
        public async Task<ActionResult<List<Tdb6RequeteDTO>>> Tdb6Requete([FromBody] FiltresDTO filtres)
        {
            //var currentUserId = int.Parse(HttpContext.User.Claims.FirstOrDefault(x => x.Type == "Id")!.Value);
            var claim = HttpContext.User.Claims.FirstOrDefault(x => x.Type == "Id");
            if (claim == null)
                return Unauthorized("Utilisateur non trouvé. Veuillez vérifier votre login!");

            if (string.IsNullOrWhiteSpace(filtres.refinterne) && string.IsNullOrWhiteSpace(filtres.numero))
                return BadRequest("Filtre numéro ou référence interne de la requête obligatoire!");

            var result = await _BordRepository.Tdb6Requete(filtres);

            return Ok(result);
        }

        // Filtre : JUSTIF : Liste numéro justificatif
        // Filtres : PROJET, SITE, AGMO, NUMERO OU REFINTERNE REQUETE
        [HttpPost("listenumerojustificatif")]
        public async Task<ActionResult<List<string>>> ListeNumeroJustificatif([FromBody] FiltresDTO filtres)
        {
            //var currentUserId = int.Parse(HttpContext.User.Claims.FirstOrDefault(x => x.Type == "Id")!.Value);
            var claim = HttpContext.User.Claims.FirstOrDefault(x => x.Type == "Id");
            if (claim == null)
                return Unauthorized("Utilisateur non trouvé. Veuillez vérifier votre login!");

            if (string.IsNullOrWhiteSpace(filtres.refinterne) && string.IsNullOrWhiteSpace(filtres.numero))
                return BadRequest("Filtre numéro ou référence interne de la requête obligatoire!");

            var result = await _BordRepository.ListeNumeroJustificatif(filtres);

            return Ok(result);
        }

        // Filtre : JUSTIF : Liste référence interne justificatif
        // Filtres : PROJET, SITE, AGMO, NUMERO OU REFINTERNE REQUETE
        [HttpPost("listerefinternejustificatif")]
        public async Task<ActionResult<List<string>>> ListeRefInterneJustificatif([FromBody] FiltresDTO filtres)
        {
            //var currentUserId = int.Parse(HttpContext.User.Claims.FirstOrDefault(x => x.Type == "Id")!.Value);
            var claim = HttpContext.User.Claims.FirstOrDefault(x => x.Type == "Id");
            if (claim == null)
                return Unauthorized("Utilisateur non trouvé. Veuillez vérifier votre login!");

            if (string.IsNullOrWhiteSpace(filtres.refinterne) && string.IsNullOrWhiteSpace(filtres.numero))
                return BadRequest("Filtre numéro ou référence interne de la requête obligatoire!");

            var result = await _BordRepository.ListeRefInterneJustificatif(filtres);

            return Ok(result);
        }

        // Tdb7 : JUSTIF : Suivi de délai de traitement des justificatifs
        // Filtres : PROJET, SITE, AGMO, NUMERO OU REFINTERNE JUSTIFICATIF
        [HttpPost("tdb7justificatif")]
        public async Task<ActionResult<List<Tdb7JustifDTO>>> Tdb7Justificatif([FromBody] FiltresDTO filtres)
        {
            //var currentUserId = int.Parse(HttpContext.User.Claims.FirstOrDefault(x => x.Type == "Id")!.Value);
            var claim = HttpContext.User.Claims.FirstOrDefault(x => x.Type == "Id");
            if (claim == null)
                return Unauthorized("Utilisateur non trouvé. Veuillez vérifier votre login!");

            if (string.IsNullOrWhiteSpace(filtres.refinterne) && string.IsNullOrWhiteSpace(filtres.numero))
                return BadRequest("Filtre numéro ou référence interne du justificatif obligatoire!");

            var result = await _BordRepository.Tdb7Justificatif(filtres);

            return Ok(result);
        }

        // Tdb8 : REQUETE : Liste des requêtes refusées
        // Filtres : PROJET, SITE, AGMO, PERIODE
        [HttpPost("tdb8requete")]
        public async Task<ActionResult<List<Tdb8RequeteDTO>>> Tdb8Requete([FromBody] FiltresDTO filtres)
        {
            //var currentUserId = int.Parse(HttpContext.User.Claims.FirstOrDefault(x => x.Type == "Id")!.Value);
            var claim = HttpContext.User.Claims.FirstOrDefault(x => x.Type == "Id");
            if (claim == null)
                return Unauthorized("Utilisateur non trouvé. Veuillez vérifier votre login!");

            var result = await _BordRepository.Tdb8Requete(filtres);

            return Ok(result);
        }

        // Tdb9 : JUSTIF : Liste des justificatifs refusés
        // Filtres : PROJET, SITE, AGMO, PERIODE
        [HttpPost("tdb9justificatif")]
        public async Task<ActionResult<List<Tdb9JustifDTO>>> Tdb9Justificatif([FromBody] FiltresDTO filtres)
        {
            //var currentUserId = int.Parse(HttpContext.User.Claims.FirstOrDefault(x => x.Type == "Id")!.Value);
            var claim = HttpContext.User.Claims.FirstOrDefault(x => x.Type == "Id");
            if (claim == null)
                return Unauthorized("Utilisateur non trouvé. Veuillez vérifier votre login!");

            var result = await _BordRepository.Tdb9Justificatif(filtres);

            return Ok(result);
        }

        // Tdb10 : REQUETE : Alertes et échéances à venir : Anticiper les échéances critiques et alerter les responsables. Mise en évidence des requêtes à échéance < 5 jours
        // Filtres : PROJET, SITE, AGMO, PERIODE
        [HttpPost("tdb10requete")]
        public async Task<ActionResult<List<Tdb10RequeteDTO>>> Tdb10Requete([FromBody] FiltresDTO filtres)
        {
            //var currentUserId = int.Parse(HttpContext.User.Claims.FirstOrDefault(x => x.Type == "Id")!.Value);
            var claim = HttpContext.User.Claims.FirstOrDefault(x => x.Type == "Id");
            if (claim == null)
                return Unauthorized("Utilisateur non trouvé. Veuillez vérifier votre login!");

            var result = await _BordRepository.Tdb10Requete(filtres);

            return Ok(result);
        }

        // Tdb11 : REQUETE : Statistiques générales (nombre)
        // Filtres : PROJET, SITE, AGMO
        [HttpPost("tdb11statrequete")]
        public async Task<ActionResult<List<Tdb11RequeteDTO>>> Tdb11Requete([FromBody] FiltresDTO filtres)
        {
            //var currentUserId = int.Parse(HttpContext.User.Claims.FirstOrDefault(x => x.Type == "Id")!.Value);
            var claim = HttpContext.User.Claims.FirstOrDefault(x => x.Type == "Id");
            if (claim == null)
                return Unauthorized("Utilisateur non trouvé. Veuillez vérifier votre login!");

            var result = await _BordRepository.Tdb11Requete(filtres);

            return Ok(result);
        }

        // Tdb12 : JUSTIF : Statistiques générales (nombre)
        // Filtres : PROJET, SITE, AGMO
        [HttpPost("tdb12statjustificatif")]
        public async Task<ActionResult<List<Tdb12JustifDTO>>> Tdb12Justificatif([FromBody] FiltresDTO filtres)
        {
            //var currentUserId = int.Parse(HttpContext.User.Claims.FirstOrDefault(x => x.Type == "Id")!.Value);
            var claim = HttpContext.User.Claims.FirstOrDefault(x => x.Type == "Id");
            if (claim == null)
                return Unauthorized("Utilisateur non trouvé. Veuillez vérifier votre login!");

            var result = await _BordRepository.Tdb12Justificatif(filtres);

            return Ok(result);
        }

        // Tdb13 : REQUETE et/ou JUSTIF : Liste des requetes et/ou justificatifs refusés
        // Filtres : PROJET, SITE, AGMO, PERIODE, ETAT (REQUETE OU JUSTIF OU TOUS (null) => etattrj)
        [HttpPost("tdb13requetejustif")]
        public async Task<ActionResult<List<Tdb13RequeteJustifDTO>>> Tdb13RequeteJustificatif([FromBody] FiltresDTO filtres)
        {
            //var currentUserId = int.Parse(HttpContext.User.Claims.FirstOrDefault(x => x.Type == "Id")!.Value);
            var claim = HttpContext.User.Claims.FirstOrDefault(x => x.Type == "Id");
            if (claim == null)
                return Unauthorized("Utilisateur non trouvé. Veuillez vérifier votre login!");

            var result = await _BordRepository.Tdb13RequeteJustificatif(filtres);

            return Ok(result);
        }

        // Tdb14 : REQUETE et/ou JUSTIF : Situation global des requêtes et/ou justificatifs
        // REQUETES
        // filtres.statut => NULL si tous, Initie = 0, Envoye = 1, EnCours = 2, Refuse = 3, Valide = 4, Cloture = 5
        // filtres.statut => NULL si tous, 0:initié (statut=0 et non dans requeteJustificatif), 1:envoyé (statut=0 et dans requeteJustificatif), 2:encours (status=1 et 4), 3:refusé (status=2), 4:validé(status=5), 5:cloturé (colonne cloture=true)
        // JUSTIFICATIFS
        // filtres.statut => NULL si tous, Envoye = 0 , EnCours = 1, Refuse = 2, Valide = 3, Cloture = 4
        // filtres.statut => NULL si tous, 0:envoyé (statut=0), 1:encours (status=1 et 4), 2:refusé (status=2), 3:validé(status=5), 4:cloturé (colonne cloture=true dans requête)

        // Filtres : PROJET, SITE, AGMO, PERIODE, STATUT, ETAT (REQUETE OU JUSTIF OU TOUS => etattrj)
        [HttpPost("tdb14requetejustif")]
        public async Task<ActionResult<List<Tdb14RequeteJustifDTO>>> Tdb14RequeteJustificatif([FromBody] FiltresDTO filtres)
        {
            //var currentUserId = int.Parse(HttpContext.User.Claims.FirstOrDefault(x => x.Type == "Id")!.Value);
            /* var claim = HttpContext.User.Claims.FirstOrDefault(x => x.Type == "Id");
             if (claim == null)
                 return Unauthorized("Utilisateur non trouvé. Veuillez vérifier votre login!");*/

            var result = await _BordRepository.Tdb14RequeteJustificatif(filtres);

            return Ok(result);
        }

        // Tdb15 : REQUETE et/ou JUSTIF : Suivi de délai de traitement des requêtes et/ou justificatifs
        // Filtres : PROJET, SITE, AGMO, NUMERO OU REFINTERNE REQUETE ou JUSTIFICATIF
        [HttpPost("tdb15requete")]
        public async Task<ActionResult<List<Tdb6RequeteDTO>>> Tdb15RequeteJustificatif([FromBody] FiltresDTO filtres)
        {
            //var currentUserId = int.Parse(HttpContext.User.Claims.FirstOrDefault(x => x.Type == "Id")!.Value);
            var claim = HttpContext.User.Claims.FirstOrDefault(x => x.Type == "Id");
            if (claim == null)
                return Unauthorized("Utilisateur non trouvé. Veuillez vérifier votre login!");

            if (string.IsNullOrWhiteSpace(filtres.etattrj))
                return BadRequest("Etat (requêtes ou justificatifs) obligatoire!");

            if (string.IsNullOrWhiteSpace(filtres.refinterne) && string.IsNullOrWhiteSpace(filtres.numero))
                return BadRequest("Filtre numéro ou référence interne obligatoire!");

            var result = await _BordRepository.Tdb15RequeteJustificatif(filtres);

            return Ok(result);
        }

        // Tdb16 : REQUETE ou JUSTIF : Suivi des étapes de validation des requêtes ou justificatifs => identifier le nombre des requêtes ou justificatifs en retard de traitementà chaque étape => avec nombre total par étape
        // Filtres : PROJET, ETAT (REQUETE OU JUSTIF => etattrj (obligatoire)), Circuit (obligatoire)
        [HttpPost("tdb16requetejustif")]
        public async Task<ActionResult<List<Tdb16RequeteJustifDTO>>> Tdb16RequeteJustificatif([FromBody] FiltresDTO filtres)
        {
            //var currentUserId = int.Parse(HttpContext.User.Claims.FirstOrDefault(x => x.Type == "Id")!.Value);
            var claim = HttpContext.User.Claims.FirstOrDefault(x => x.Type == "Id");
            if (claim == null)
                return Unauthorized("Utilisateur non trouvé. Veuillez vérifier votre login!");

            if (string.IsNullOrWhiteSpace(filtres.idprojets?.ToString()))
                return BadRequest("Filtre projet obligatoire!");

            if (string.IsNullOrWhiteSpace(filtres.etattrj))
                return BadRequest("Etat (requêtes ou justificatifs) obligatoire!");

            if (string.IsNullOrWhiteSpace(filtres.circuit.ToString()))
                return BadRequest("Filtre circuit obligatoire!");

            var result = await _BordRepository.Tdb16RequeteJustificatif(filtres);

            return Ok(result);
        }
    }
}