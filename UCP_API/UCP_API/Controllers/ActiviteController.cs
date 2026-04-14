using Microsoft.AspNetCore.Mvc;
using UCP_API.repositories;
using UCP_API.models;
using UCP_API.dto;
using System.Linq;
using System;
using System.Globalization;

namespace UCP_API.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class ActiviteController : ControllerBase
    {
        private readonly ActiviteRepository _ActiviteRepository;
        private readonly UtilisateurRepository _UtilisateurRepository;
        private readonly RequeteRepository _RequeteRepository;

        public ActiviteController(ActiviteRepository ActiviteRepository, UtilisateurRepository UtilisateurRepository, RequeteRepository RequeteRepository)
        {
            _ActiviteRepository = ActiviteRepository;
            _UtilisateurRepository = UtilisateurRepository;
            _RequeteRepository = RequeteRepository;
        }

        [HttpGet]
        public async Task<IActionResult> GetAllActi()
        {
            //var currentUserId = int.Parse(HttpContext.User.Claims.FirstOrDefault(x => x.Type == "Id")!.Value);
            /*var claim = HttpContext.User.Claims.FirstOrDefault(x => x.Type == "role");
            if (claim == null)
                return Unauthorized("Utilisateur non trouvé. Veuillez vérifier votre login!");

            var currentUserRoleId = int.Parse(claim.Value);

            var currentUserId = int.Parse(HttpContext.User.Claims.FirstOrDefault(x => x.Type == "Id")!.Value);

            //Get role by id
            var role = await _UtilisateurRepository.GetRoleById(currentUserRoleId);

            if (role.nom == "SuperAdmin")
            {*/
                var acti = await _ActiviteRepository.GetActis();

                if (acti == null || !acti.Any())
                    return Ok("Aucune activité trouvée!");

                return Ok(acti);
           /* }
            else
            {
                var acti = await _ActiviteRepository.GetActivitesByUser(currentUserId);

                if (acti == null || !acti.Any())
                    return Ok("Aucune activité trouvée!");

                return Ok(acti);
            }*/
        }

        [HttpGet("activitesbyprojet/{idProjet}")]
        public async Task<IActionResult> GetAllActiByProjet(int idProjet)
        {
            var acti = await _ActiviteRepository.GetActisByIdProjet(idProjet);

            if (acti == null || !acti.Any())
                return NotFound("Aucune activité trouvée pour le projet!");

            return Ok(acti);
        }

        [HttpGet("activite/{id}")]
        public IActionResult GetActi(int id)
        {
            Activite Acti = _ActiviteRepository.GetActiById(id);

            if (Acti == null)
                return NotFound("Activité non trouvée!");

            return Ok(Acti);
        }

        [HttpPost]
        public async Task<IActionResult> CreateActi([FromBody] Activite Acti, int idProjet)
        {
            //var currentUserId = int.Parse(HttpContext.User.Claims.FirstOrDefault(x => x.Type == "Id")!.Value);
            var claim = HttpContext.User.Claims.FirstOrDefault(x => x.Type == "Id");
            if (claim == null)
                return Unauthorized("Utilisateur non trouvé. Veuillez vérifier votre login!");

            var currentUserId = int.Parse(claim.Value);

            var exist = await _ActiviteRepository.GetActiByNameCodeProjet(Acti.code, Acti.nom, idProjet);
            if (exist != null)
                return BadRequest("Activité existe déjà!");

            _ActiviteRepository.AddActivite(Acti, currentUserId, idProjet);
            return Ok(Acti);
        }

        [HttpPut]
        public async Task<IActionResult> UpdateActi([FromBody] Activite Activite, int id)
        {
            var exist = await _ActiviteRepository.GetActiByNameCodeId(Activite.code, Activite.nom, id);
            if (exist != null)
                return BadRequest("Activité existe déjà!");

            var result = _ActiviteRepository.UpdateActi(Activite, id);
            if (!result)
                return NotFound("Activité non trouvée!");

            return Ok(Activite);
        }

        [HttpDelete("{id}")]
        public IActionResult DeleteActi(int id)
        {
            //var currentUserId = int.Parse(HttpContext.User.Claims.FirstOrDefault(x => x.Type == "Id")!.Value);
            var claim = HttpContext.User.Claims.FirstOrDefault(x => x.Type == "Id");
            if (claim == null)
                return Unauthorized("Utilisateur non trouvé. Veuillez vérifier votre login!");

            var currentUserId = int.Parse(claim.Value);

            var result = _ActiviteRepository.DeleteActi(id, currentUserId);
            if (!result)
                return NotFound("Activité non trouvée!");

            return Ok(new { message = "Activité supprimée avec succès!" });
        }

        // Get activites Tom²pro
        [HttpGet("activitesTom/{idProjet:int}")]
        public async Task<IActionResult> GetAllActiviteTom(int idProjet)
        {
            var actis = await _ActiviteRepository.GetActivitesOfProjet(idProjet);

            if (actis == null || !actis.Any())
                return NotFound("Aucune activité trouvée!");

            return Ok(actis);
        }

        // Get all exercice by idProjet
        [HttpGet("exercicesbyprojet/{idProjet:int}")]
        public async Task<IActionResult> GetAllExerciceByProjet(int idProjet)
        {
            if (idProjet <= 0)
                return BadRequest("Projet obligatoire!");

            var exo = await _ActiviteRepository.GetExercicesByIdProjet(idProjet);

            if (exo == null || !exo.Any())
                return NotFound("Aucun exercice trouvé!");

            return Ok(exo);
        }

        // Get all RBUDGET (budget) by NUMBUD
        [HttpGet("budgetbyexercice/{idProjet:int}/{numbud:int}")]
        public async Task<IActionResult> GetAllBudgetByProjet(int idProjet, int numbud)
        {
            if (idProjet <= 0 || numbud <= 0)
                return BadRequest("Projet et budget obligatoires!");

            var bud = await _ActiviteRepository.GetBudgetsByIdProjet(idProjet, numbud);

            if (bud == null || !bud.Any())
                return NotFound("Aucun budget trouvé!");

            return Ok(bud);
        }

        // Get all MBUDGET (actvité) by NUMBUD
        [HttpGet("activitesbybudget/{idProjet:int}/{numbud:int}")]
        public async Task<IActionResult> GetAllActiviteByProjet(int idProjet, int numbud)
        {
            if (idProjet <= 0 || numbud <= 0)
                return BadRequest("Projet et budget obligatoires!");

            var bud = await _ActiviteRepository.GetBudgetsByIdProjet(idProjet, numbud);
            List<MBUDGET> actis = null;
            if(bud != null || bud?.Count != 0)
            {
                actis = await _ActiviteRepository.GetActivitesByIdProjet(idProjet, numbud, bud[0].COURS);
            }
            

            if (actis == null || !actis.Any())
                return NotFound("Aucune activité trouvée!");

            return Ok(actis);
        }

        // Get TOTAL MBUDGET, TOTAL REALISE et RESTE (actvité) by NUMBUD et ACTI
        [HttpGet("montantbyactivite/{idProjet:int}/{numbud:int}/{acti}/{exercice:int}")]
        public async Task<IActionResult> GetAllActiviteByProjet(int idProjet, int numbud, string acti, int exercice)
        {
            if (idProjet <= 0 || numbud <= 0 || string.IsNullOrWhiteSpace(acti))
                return BadRequest("Exercice, projet, budget, activité obligatoires!");
            var bud = await _ActiviteRepository.GetBudgetsByIdProjet(idProjet, numbud);
            List<MBUDGET> actis = null;
            decimal? somme = 0;
            decimal? realise = 0;
            decimal? realiseAnterieur = 0;
            decimal? budgetAnnuel = 0;
            if (bud != null || bud?.Count != 0)
            {
                realiseAnterieur = await _ActiviteRepository.GetRealiseActivitesByIdProjetAnterieur(idProjet, acti, exercice);
                budgetAnnuel = await _ActiviteRepository.GetSommeActivitesByIdProjetAnnuel(idProjet, numbud, acti, bud[0].COURS, exercice);
                somme = realiseAnterieur.Value + budgetAnnuel.Value;
                realise = await _ActiviteRepository.GetRealiseActivitesByIdProjet(idProjet, acti/*, exercice*/);
            }
             

            var allMontant = new AllMontant
            {
                SommeActis = somme ?? 0,
                ReaActis = realise ?? 0
            };

            if (somme.HasValue && realise.HasValue && somme.Value != 0)
            {
                allMontant.Reste = Math.Round(somme.Value - realise.Value, 2);
                allMontant.Pourcentage = Math.Round((100 * allMontant.ReaActis.Value) / somme.Value, 2);
            }
            else
            {
                allMontant.Reste = 0;
                allMontant.Pourcentage = 0;
            }

            var AllMontantText = new AllMontantText();
            AllMontantText.SommeActis = Convert(allMontant.SommeActis);
            AllMontantText.ReaActis = Convert(allMontant.ReaActis);
            AllMontantText.Reste = Convert(allMontant.Reste);
            AllMontantText.Pourcentage = Convert(allMontant.Pourcentage);

            return Ok(AllMontantText);
        }

        // Get TOTAL MBUDGET, TOTAL REALISE et RESTE (actvité) by NUMBUD et ACTI
        [HttpGet("montantbyactiviteannuel/{idProjet:int}/{numbud:int}/{acti}/{exercice:int}")]
        public async Task<IActionResult> GetAllActiviteByProjetAnnuel(int idProjet, int numbud, string acti, int exercice)
        {
            if (idProjet <= 0 || numbud <= 0 || string.IsNullOrWhiteSpace(acti))
                return BadRequest("Exercice, projet, budget, activité obligatoires!");
            var bud = await _ActiviteRepository.GetBudgetsByIdProjet(idProjet, numbud);
            List<MBUDGET> actis = null;
            decimal? somme = 0;
            decimal? realise = 0;
            decimal? realiseRattachContrat = 0;
            decimal? contratMont = 0;
            decimal? engagement = 0;
            if (bud != null || bud?.Count != 0)
            {

                somme = await _ActiviteRepository.GetSommeActivitesByIdProjetAnnuel(idProjet, numbud, acti, bud[0].COURS, exercice);
                realise = await _ActiviteRepository.GetRealiseActivitesByIdProjetAnnuel(idProjet, acti,exercice);
                realiseRattachContrat = await _ActiviteRepository.GetRealiseActivitesRattachContratByIdProjetAnnuel(idProjet, acti, exercice);
                contratMont = await _ActiviteRepository.GetMontantContractRattachéAnnuel(idProjet, acti, exercice);
                if(realiseRattachContrat == null)
                {
                    realiseRattachContrat = 0;
                }
                if(contratMont == null)
                {
                    contratMont = 0;
                }
                engagement = contratMont  - realiseRattachContrat ;
            }
            Console.WriteLine("rattaché contrat");
            Console.WriteLine(realiseRattachContrat);
            Console.WriteLine(contratMont);
            
            Console.WriteLine(engagement);
            decimal? requeteEnCoursMont = (decimal?) _RequeteRepository.GetMontantValideRequetesEnCours(acti);

            var allMontant = new AllMontant
            {
                SommeActis = somme ?? 0,
                ReaActis = realise ?? 0
            };

            if (somme.HasValue && realise.HasValue && somme.Value != 0)
            {
                allMontant.Reste = Math.Round(somme.Value - realise.Value, 2);
                allMontant.Pourcentage = Math.Round((100 * allMontant.Reste.Value) / somme.Value, 2);
            }
            else
            {
                allMontant.Reste = 0;
                allMontant.Pourcentage = 0;
            }
          
            decimal? disponible = Math.Round(allMontant.SommeActis.Value - (allMontant.ReaActis.Value + engagement.Value + requeteEnCoursMont.Value), 2);
            Console.WriteLine(disponible.Value);
           
            decimal? taux = 0;
            if (somme != null)
            {
                taux = Math.Round((100 * (allMontant.ReaActis.Value + engagement.Value + requeteEnCoursMont.Value)) / somme.Value, 2);
            }
            

           

            var AllMontantText = new AllMontantTextAnnuelDTO();
            AllMontantText.SommeActis = Convert(allMontant.SommeActis);
            AllMontantText.ReaActis = Convert(allMontant.ReaActis);
            AllMontantText.Engagement = Convert(engagement);
            AllMontantText.RequeteEnCours = Convert(requeteEnCoursMont);
            AllMontantText.Reste = Convert(disponible);
            AllMontantText.Pourcentage = Convert(taux);

            return Ok(AllMontantText);
        }

        public static string Convert(decimal? number)
        {


            // Clone a culture and customize separators
            CultureInfo customCulture = (CultureInfo)CultureInfo.InvariantCulture.Clone();
            customCulture.NumberFormat.NumberGroupSeparator = ".";
            customCulture.NumberFormat.NumberDecimalSeparator = ",";

            string formatted = string.Format(customCulture, "{0:#,0.00}", number);
            Console.WriteLine(formatted); // Output: 2.050.041,75
            return formatted;
        }
    }

}