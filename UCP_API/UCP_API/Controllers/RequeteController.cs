using Microsoft.AspNetCore.Mvc;
using UCP_API.repositories;
using UCP_API.models;
using UCP_API.dto;
using UCP_API.utils;

namespace UCP_API.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class RequeteController : ControllerBase
    {
        private readonly RequeteRepository _RequeteRepository;
        private readonly RequeteAccuseRepository _RequeteAccuseRepository;
        private readonly ActiviteRepository _ActiviteRepository;
        private readonly UtilisateurRepository _UtilisateurRepository;
        private readonly RequeteRubriqueRepository _RequeteRubriqueRepository;
        private readonly RubriqueRepository _RubriqueRepository;
        private readonly CategorieRubriqueRepository _CategorieRubriqueRepository;
        private readonly ProjetRepository _ProjetRepository;
        private readonly CategorieRubriqueColonneRepository _CategorieRubriqueColonneRepository;
        private readonly TypeRequeteRepository _TypeRequeteRepository;
        private readonly CircuitRepository _CircuitRepository;
        private readonly RequeteJustificatifRepository _RequeteJustificatifRepository;
        private readonly TraitementRequeteRepository _TraitementRequeteRepository;
        private readonly TypeRubriqueRepository _TypeRubriqueRepository;
        public RequeteController(RequeteRepository RequeteRepository, ActiviteRepository ActiviteRepository, UtilisateurRepository UtilisateurRepository, RequeteRubriqueRepository RequeteRubriqueRepository, ProjetRepository ProjetRepository, RubriqueRepository RubriqueRepository, CategorieRubriqueRepository CategorieRubriqueRepository, CategorieRubriqueColonneRepository CategorieRubriqueColonneRepository, TypeRequeteRepository TypeRequeteRepository, CircuitRepository CircuitRepository, RequeteAccuseRepository RequeteAccuseRepository, RequeteJustificatifRepository RequeteJustificatifRepository, TraitementRequeteRepository TraitementRequeteRepository, TypeRubriqueRepository TypeRubriqueRepository)
        {
            _RequeteRepository = RequeteRepository;
            _ActiviteRepository = ActiviteRepository;
            _UtilisateurRepository = UtilisateurRepository;
            _ProjetRepository = ProjetRepository;
            _RequeteRubriqueRepository = RequeteRubriqueRepository;
            _RubriqueRepository = RubriqueRepository;
            _CategorieRubriqueRepository = CategorieRubriqueRepository;
            _CategorieRubriqueColonneRepository = CategorieRubriqueColonneRepository;
            _TypeRequeteRepository = TypeRequeteRepository;
            _CircuitRepository = CircuitRepository;
            _RequeteAccuseRepository = RequeteAccuseRepository;
            _RequeteJustificatifRepository = RequeteJustificatifRepository;
            _TraitementRequeteRepository = TraitementRequeteRepository;
            _TypeRubriqueRepository = TypeRubriqueRepository;
        }

        //[HttpGet]
        //public IActionResult GetAllRequetex()
        //{
        //    var requetes = _RequeteRepository.GetRequetesWithNames();
        //    for (int i = 0; i < requetes.Count(); i++)
        //    {
        //        requetes[i].Montant = _RequeteRubriqueRepository.GetSommeRequeteRubriquesByRequete(Requetes[i].IdRequete);
        //    }
        //    return Ok(requetes);
        //}

        [HttpGet("checkdroit")]
        public IActionResult CheckDroit()
        {
            int userId = 0;
            if (HttpContext.User.Claims.ToArray().Length != 0)
            {
                userId = int.Parse(HttpContext.User.Claims.ToArray()[0].Value);
            }

            if (userId == 0)
                return Unauthorized("Utilisateur non trouvé. Veuillez vérifier votre login!");

            Utilisateur u = _UtilisateurRepository.FindByIdUtilisateur(userId);
            int nbRequeteNonjustified = _RequeteRepository.CheckDroiDemandeRequete(u.Agmo.idAgmo);
            int droit = 0;
            if(nbRequeteNonjustified == 0)
            {
                droit = 1;
            }
            return Ok(new { droit = droit, agmo = u.Agmo.nom });
        }

        [HttpPost("recaller_manque_pj/{idRequete}")]
        public async Task<IActionResult> RecallerManquePj(int idRequete, [FromBody] StringData commentaireRevision )
        {
            int userId = 0;
            if (HttpContext.User.Claims.ToArray().Length != 0)
            {
                userId = int.Parse(HttpContext.User.Claims.ToArray()[0].Value);
            }

            if (userId == 0)
                return Unauthorized("Utilisateur non trouvé. Veuillez vérifier votre login!");
            _RequeteRepository.UpdateManquePj(idRequete, true);
            _RequeteRepository.UpdateCommentaireRevision(idRequete, commentaireRevision.value);
            await _TraitementRequeteRepository.SendMailRevision(idRequete,userId);
            return Ok("requête recallée");
        }

        [HttpGet("manque_pj/pages")]
        public async Task<IActionResult> GetNbPageManquePj()
        {
            int userId = 0;
            if (HttpContext.User.Claims.ToArray().Length != 0)
            {
                userId = int.Parse(HttpContext.User.Claims.ToArray()[0].Value);
            }

            if (userId == 0)
                return Unauthorized("Utilisateur non trouvé. Veuillez vérifier votre login!");

            int nbPage = _RequeteRepository.GetNbRequetesManquePjByUtilisateur(userId);

            return Ok(nbPage);

        }

        [HttpGet("manque_pj/word/{word}/pages")]
        public async Task<IActionResult> GetNbPageManquePjByWord(string word)
        {
            int userId = 0;
            if (HttpContext.User.Claims.ToArray().Length != 0)
            {
                userId = int.Parse(HttpContext.User.Claims.ToArray()[0].Value);
            }

            if (userId == 0)
                return Unauthorized("Utilisateur non trouvé. Veuillez vérifier votre login!");

            int nbPage = _RequeteRepository.GetNbRequetesManquePjByUtilisateurAndWord(userId,word);

            return Ok(nbPage);

        }


        [HttpGet("manque_pj/page/{page}")]
        public IActionResult GetRequetesManquePjByUtilisatueur(int page)
        {
            int userId = 0;
            if (HttpContext.User.Claims.ToArray().Length != 0)
            {
                userId = int.Parse(HttpContext.User.Claims.ToArray()[0].Value);
            }

            if (userId == 0)
                return Unauthorized("Utilisateur non trouvé. Veuillez vérifier votre login!");
            DateOnly tempDate = new DateOnly();
            int tempIdTypeRequete = 0;
            int tempDelai = 0;
            List<Requete> Requetes = _RequeteRepository.GetRequetesManquePjByPage(userId, page);
            for (int i = 0; i < Requetes.Count(); i++)
            {
                Console.WriteLine(i);
                //Requetes[i].Activite = _ActiviteRepository.GetActivtieByRequete(Requetes[i].IdRequete);
                Requetes[i].Utilisateur = _UtilisateurRepository.GetUtilisateurByRequete(Requetes[i].IdRequete);
                //Requetes[i].Activite.Projet = _ProjetRepository.GetProjetByActivite(Requetes[i].Activite.idActivite);
                tempIdTypeRequete = (int)Requetes[i].IdTypeRequete;
                Requetes[i].Montant = _RequeteRubriqueRepository.GetSommeRequeteRubriquesByRequete(Requetes[i].IdRequete);
                Requetes[i].TypeRequete = _TypeRequeteRepository.GetTypeRequeteById(tempIdTypeRequete);
                if (Requetes[i].DateFinExecution != null)
                {
                    tempDate = (DateOnly)Requetes[i].DateFinExecution;
                    tempDelai = (int)Requetes[i].TypeRequete.DelaiJustification;
                    Requetes[i].DateFinEcheance = tempDate.AddDays(tempDelai);
                }
                Requetes[i].DateMinExec = DateOnly.FromDateTime((DateTime)Requetes[i].creationdate).AddDays(15);
                Requetes[i].Montant2 = (decimal)_RequeteRubriqueRepository.GetSommeRequeteRubriquesByRequete(Requetes[i].IdRequete);
                Console.WriteLine(Requetes[i].Montant2);
            }
            return Ok(Requetes);
        }

        [HttpGet("manque_pj/word/{word}/page/{page}")]
        public IActionResult GetRequetesManquePjByUtilisatueurAndWord(int page,string word)
        {
            int userId = 0;
            if (HttpContext.User.Claims.ToArray().Length != 0)
            {
                userId = int.Parse(HttpContext.User.Claims.ToArray()[0].Value);
            }

            if (userId == 0)
                return Unauthorized("Utilisateur non trouvé. Veuillez vérifier votre login!");
            DateOnly tempDate = new DateOnly();
            int tempIdTypeRequete = 0;
            int tempDelai = 0;
            List<Requete> Requetes = _RequeteRepository.GetRequetesManquePjByPageAndWord(userId,page, word);
            for (int i = 0; i < Requetes.Count(); i++)
            {
                Console.WriteLine(i);
                //Requetes[i].Activite = _ActiviteRepository.GetActivtieByRequete(Requetes[i].IdRequete);
                Requetes[i].Utilisateur = _UtilisateurRepository.GetUtilisateurByRequete(Requetes[i].IdRequete);
                //Requetes[i].Activite.Projet = _ProjetRepository.GetProjetByActivite(Requetes[i].Activite.idActivite);
                tempIdTypeRequete = (int)Requetes[i].IdTypeRequete;
                Requetes[i].Montant = _RequeteRubriqueRepository.GetSommeRequeteRubriquesByRequete(Requetes[i].IdRequete);
                Requetes[i].TypeRequete = _TypeRequeteRepository.GetTypeRequeteById(tempIdTypeRequete);
                if (Requetes[i].DateFinExecution != null)
                {
                    tempDate = (DateOnly)Requetes[i].DateFinExecution;
                    tempDelai = (int)Requetes[i].TypeRequete.DelaiJustification;
                    Requetes[i].DateFinEcheance = tempDate.AddDays(tempDelai);
                }
                Requetes[i].DateMinExec = DateOnly.FromDateTime((DateTime)Requetes[i].creationdate).AddDays(15);
                Requetes[i].Montant2 = (decimal)_RequeteRubriqueRepository.GetSommeRequeteRubriquesByRequete(Requetes[i].IdRequete);
                Console.WriteLine(Requetes[i].Montant2);
            }
            return Ok(Requetes);
        }


        [HttpGet]
        public IActionResult GetAllRequetex()
        {
            List<Requete> Requetes = _RequeteRepository.GetRequetes();
            for (int i = 0; i < Requetes.Count(); i++)
            {
                //Requetes[i].Activite = _ActiviteRepository.GetActivtieByRequete(Requetes[i].IdRequete);
                Requetes[i].Utilisateur = _UtilisateurRepository.GetUtilisateurByRequete(Requetes[i].IdRequete);
                //Requetes[i].Activite.Projet = _ProjetRepository.GetProjetByActivite(Requetes[i].Activite.idActivite);
                Requetes[i].Montant = _RequeteRubriqueRepository.GetSommeRequeteRubriquesByRequete(Requetes[i].IdRequete);
            }
            return Ok(Requetes);
        }

        [HttpGet("requete/{idRequete}")]
        public IActionResult GetAllRequetex(int idRequete)
        {
            int userId = 0;
            if (HttpContext.User.Claims.ToArray().Length != 0)
            {
                userId = int.Parse(HttpContext.User.Claims.ToArray()[0].Value);
            }

            if (userId == 0)
                return Unauthorized("Utilisateur non trouvé. Veuillez vérifier votre login!");

            Requete r = _RequeteRepository.GetRequeteById(idRequete);
            return Ok(r);
        }

        [HttpGet("requetesutilisateur")]
        public IActionResult GetRequetesByUtilisatueur()
        {
            int userId = 0;
            if (HttpContext.User.Claims.ToArray().Length != 0)
            {
                userId = int.Parse(HttpContext.User.Claims.ToArray()[0].Value);
            }

            if (userId == 0)
                return Unauthorized("Utilisateur non trouvé. Veuillez vérifier votre login!");

            List<Requete> Requetes = _RequeteRepository.GetRequetesByUtilisateur(userId);
            DateOnly tempDate = new DateOnly();
            int tempIdTypeRequete = 0;
            int tempDelai = 0;
            for (int i = 0; i < Requetes.Count(); i++)
            {
                Console.WriteLine(i);
                //Requetes[i].Activite = _ActiviteRepository.GetActivtieByRequete(Requetes[i].IdRequete);
                Requetes[i].Utilisateur = _UtilisateurRepository.GetUtilisateurByRequete(Requetes[i].IdRequete);
                //Requetes[i].Activite.Projet = _ProjetRepository.GetProjetByActivite(Requetes[i].Activite.idActivite);
                tempIdTypeRequete = (int) Requetes[i].IdRequete;
                Requetes[i].Montant = _RequeteRubriqueRepository.GetSommeRequeteRubriquesByRequete(Requetes[i].IdRequete);
                Requetes[i].TypeRequete = _TypeRequeteRepository.GetTypeRequeteById(tempIdTypeRequete);
                if (Requetes[i].DateFinExecution != null)
                {
                    tempDate = (DateOnly)Requetes[i].DateFinExecution;
                    tempDelai = (int)Requetes[i].TypeRequete.DelaiJustification;
                    Requetes[i].DateFinEcheance = tempDate.AddDays(tempDelai);
                }
            }
            return Ok(Requetes);
        }

        [HttpGet("initiees/pages")]
        public async Task<IActionResult> GetNbPageInitiees()
        {
            int userId = 0;
            if (HttpContext.User.Claims.ToArray().Length != 0)
            {
                userId = int.Parse(HttpContext.User.Claims.ToArray()[0].Value);
            }

            if (userId == 0)
                return Unauthorized("Utilisateur non trouvé. Veuillez vérifier votre login!");

            int nbPage = _RequeteRepository.GetNbRequetesInitieesByUtilisateur(userId);

            return Ok(nbPage);

        }

        [HttpGet("initiees/word/{word}/pages")]
        public async Task<IActionResult> GetNbPageInitieesByWord(string word)
        {
            int userId = 0;
            if (HttpContext.User.Claims.ToArray().Length != 0)
            {
                userId = int.Parse(HttpContext.User.Claims.ToArray()[0].Value);
            }

            if (userId == 0)
                return Unauthorized("Utilisateur non trouvé. Veuillez vérifier votre login!");

            int nbPage = _RequeteRepository.GetNbRequetesInitieesByUtilisateurAndWord(userId,word);

            return Ok(nbPage);

        }



        [HttpGet("initiees/page/{page}")]
        public IActionResult GetRequetesInitieesByUtilisatueur(int page)
        {
            int userId = 0;
            if (HttpContext.User.Claims.ToArray().Length != 0)
            {
                userId = int.Parse(HttpContext.User.Claims.ToArray()[0].Value);
            }

            if (userId == 0)
                return Unauthorized("Utilisateur non trouvé. Veuillez vérifier votre login!");
            DateOnly tempDate = new DateOnly();
            int tempIdTypeRequete = 0;
            int tempDelai = 0;
            List<Requete> Requetes = _RequeteRepository.GetRequetesInitieesByUtilisateurAndPage(userId,page);
            for (int i = 0; i < Requetes.Count(); i++)
            {
                Console.WriteLine(i);
                //Requetes[i].Activite = _ActiviteRepository.GetActivtieByRequete(Requetes[i].IdRequete);
                Requetes[i].Utilisateur = _UtilisateurRepository.GetUtilisateurByRequete(Requetes[i].IdRequete);
                //Requetes[i].Activite.Projet = _ProjetRepository.GetProjetByActivite(Requetes[i].Activite.idActivite);
                tempIdTypeRequete = (int) Requetes[i].IdTypeRequete;
                Requetes[i].Montant = _RequeteRubriqueRepository.GetSommeRequeteRubriquesByRequete(Requetes[i].IdRequete);
                Requetes[i].TypeRequete = _TypeRequeteRepository.GetTypeRequeteById(tempIdTypeRequete);
                if (Requetes[i].DateFinExecution != null)
                {
                    tempDate = (DateOnly) Requetes[i].DateFinExecution;
                    tempDelai = (int) Requetes[i].TypeRequete.DelaiJustification;
                    Requetes[i].DateFinEcheance = tempDate.AddDays(tempDelai);
                }
                //Requetes[i].DateMinExec = DateOnly.FromDateTime((DateTime) Requetes[i].creationdate).AddDays(15);
                //Requetes[i].DateMinExec = Util.AddBusinessDays((DateOnly)Requetes[i].DateSoumission, 15);
                if (Requetes[i].DateSoumission == null)
                {
                    Requetes[i].DateMinExec = DateOnly.FromDateTime(DateTime.Now).AddDays(15);
                }
                else
                {
                    Requetes[i].DateMinExec = ((DateOnly)Requetes[i].DateSoumission).AddDays(15);
                }
                Requetes[i].Montant2 =(decimal) _RequeteRubriqueRepository.GetSommeRequeteRubriquesByRequete(Requetes[i].IdRequete);
                Console.WriteLine(Requetes[i].Montant2);
            }
            return Ok(Requetes);
        }

        [HttpGet("initiees/word/{word}/page/{page}")]
        public IActionResult GetRequetesInitieesByUtilisatueurAndWord(string word, int page)
        {
            int userId = 0;
            if (HttpContext.User.Claims.ToArray().Length != 0)
            {
                userId = int.Parse(HttpContext.User.Claims.ToArray()[0].Value);
            }

            if (userId == 0)
                return Unauthorized("Utilisateur non trouvé. Veuillez vérifier votre login!");
            DateOnly tempDate = new DateOnly();
            int tempIdTypeRequete = 0;
            int tempDelai = 0;
            List<Requete> Requetes = _RequeteRepository.GetRequetesInitieesByUtilisateurAndPageAndWord(userId, word, page);
            for (int i = 0; i < Requetes.Count(); i++)
            {
                Console.WriteLine(i);
                //Requetes[i].Activite = _ActiviteRepository.GetActivtieByRequete(Requetes[i].IdRequete);
                Requetes[i].Utilisateur = _UtilisateurRepository.GetUtilisateurByRequete(Requetes[i].IdRequete);
                //Requetes[i].Activite.Projet = _ProjetRepository.GetProjetByActivite(Requetes[i].Activite.idActivite);
                tempIdTypeRequete = (int)Requetes[i].IdTypeRequete;
                Requetes[i].Montant = _RequeteRubriqueRepository.GetSommeRequeteRubriquesByRequete(Requetes[i].IdRequete);
                Requetes[i].TypeRequete = _TypeRequeteRepository.GetTypeRequeteById(tempIdTypeRequete);
                if (Requetes[i].DateFinExecution != null)
                {
                    tempDate = (DateOnly)Requetes[i].DateFinExecution;
                    tempDelai = (int)Requetes[i].TypeRequete.DelaiJustification;
                    Requetes[i].DateFinEcheance = tempDate.AddDays(tempDelai);
                }
                //Requetes[i].DateMinExec = DateOnly.FromDateTime((DateTime) Requetes[i].creationdate).AddDays(15);
                //Requetes[i].DateMinExec = Util.AddBusinessDays( DateOnly.FromDateTime(DateTime.Now), 15);
                if (Requetes[i].DateSoumission == null)
                {
                    Requetes[i].DateMinExec = DateOnly.FromDateTime(DateTime.Now).AddDays(15);
                }
                else
                {
                    Requetes[i].DateMinExec = ((DateOnly) Requetes[i].DateSoumission).AddDays(15);
                }

                    Requetes[i].Montant2 = (decimal)_RequeteRubriqueRepository.GetSommeRequeteRubriquesByRequete(Requetes[i].IdRequete);
                Console.WriteLine(Requetes[i].Montant2);
            }
            return Ok(Requetes);
        }

        [HttpGet("v_ministere/pages")]
        public async Task<IActionResult> GetNbPageVm()
        {
            int userId = 0;
            if (HttpContext.User.Claims.ToArray().Length != 0)
            {
                userId = int.Parse(HttpContext.User.Claims.ToArray()[0].Value);
            }

            if (userId == 0)
                return Unauthorized("Utilisateur non trouvé. Veuillez vérifier votre login!");

            int nbPage = _RequeteRepository.GetNbRequetesValideesMinisteresByUtilisateur(userId);

            return Ok(nbPage);

        }

        [HttpGet("v_ministere/word/{word}/pages")]
        public async Task<IActionResult> GetNbPageVmByPage(string word)
        {
            int userId = 0;
            if (HttpContext.User.Claims.ToArray().Length != 0)
            {
                userId = int.Parse(HttpContext.User.Claims.ToArray()[0].Value);
            }

            if (userId == 0)
                return Unauthorized("Utilisateur non trouvé. Veuillez vérifier votre login!");

            int nbPage = _RequeteRepository.GetNbRequetesValideesMinisteresByUtilisateurAndWord(userId,word);

            return Ok(nbPage);

        }

        [HttpGet("v_ministere/page/{page}")]
        public IActionResult GetRequetesValideesMinistereByUtilisatueur(int page)
        {
            int userId = 0;
            if (HttpContext.User.Claims.ToArray().Length != 0)
            {
                userId = int.Parse(HttpContext.User.Claims.ToArray()[0].Value);
            }

            if (userId == 0)
                return Unauthorized("Utilisateur non trouvé. Veuillez vérifier votre login!");
            DateOnly tempDate = new DateOnly();
            int tempIdTypeRequete = 0;
            int tempDelai = 0;
            List<Requete> Requetes = _RequeteRepository.GetRequetesValideesMinisteresByUtilisateurAndPage(userId, page);
            for (int i = 0; i < Requetes.Count(); i++)
            {
                Console.WriteLine(i);
                //Requetes[i].Activite = _ActiviteRepository.GetActivtieByRequete(Requetes[i].IdRequete);
                Requetes[i].Utilisateur = _UtilisateurRepository.GetUtilisateurByRequete(Requetes[i].IdRequete);
                //Requetes[i].Activite.Projet = _ProjetRepository.GetProjetByActivite(Requetes[i].Activite.idActivite);
                tempIdTypeRequete = (int) Requetes[i].IdTypeRequete;
                Requetes[i].Montant = _RequeteRubriqueRepository.GetSommeRequeteRubriquesByRequete(Requetes[i].IdRequete);
                Requetes[i].TypeRequete = _TypeRequeteRepository.GetTypeRequeteById(tempIdTypeRequete);
                if (Requetes[i].DateFinExecution != null)
                {
                    tempDate = (DateOnly)Requetes[i].DateFinExecution;
                    tempDelai = (int)Requetes[i].TypeRequete.DelaiJustification;
                    Requetes[i].DateFinEcheance = tempDate.AddDays(tempDelai);
                }
            }
            return Ok(Requetes);
        }

        [HttpGet("v_ministere/word/{word}/page/{page}")]
        public IActionResult GetRequetesValideesMinistereByUtilisatueurByPage(int page,string word)
        {
            int userId = 0;
            if (HttpContext.User.Claims.ToArray().Length != 0)
            {
                userId = int.Parse(HttpContext.User.Claims.ToArray()[0].Value);
            }

            if (userId == 0)
                return Unauthorized("Utilisateur non trouvé. Veuillez vérifier votre login!");
            DateOnly tempDate = new DateOnly();
            int tempIdTypeRequete = 0;
            int tempDelai = 0;
            List<Requete> Requetes = _RequeteRepository.GetRequetesValideesMinisteresByUtilisateurAndPageAndWord(userId,word, page);
            for (int i = 0; i < Requetes.Count(); i++)
            {
                Console.WriteLine(i);
                //Requetes[i].Activite = _ActiviteRepository.GetActivtieByRequete(Requetes[i].IdRequete);
                Requetes[i].Utilisateur = _UtilisateurRepository.GetUtilisateurByRequete(Requetes[i].IdRequete);
                //Requetes[i].Activite.Projet = _ProjetRepository.GetProjetByActivite(Requetes[i].Activite.idActivite);
                tempIdTypeRequete = (int)Requetes[i].IdTypeRequete;
                Requetes[i].Montant = _RequeteRubriqueRepository.GetSommeRequeteRubriquesByRequete(Requetes[i].IdRequete);
                Requetes[i].TypeRequete = _TypeRequeteRepository.GetTypeRequeteById(tempIdTypeRequete);
                if (Requetes[i].DateFinExecution != null)
                {
                    tempDate = (DateOnly)Requetes[i].DateFinExecution;
                    tempDelai = (int)Requetes[i].TypeRequete.DelaiJustification;
                    Requetes[i].DateFinEcheance = tempDate.AddDays(tempDelai);
                }
            }
            return Ok(Requetes);
        }

        [HttpGet("en_cours/pages")]
        public async Task<IActionResult> GetNbPageEnCours()
        {
            int userId = 0;
            if (HttpContext.User.Claims.ToArray().Length != 0)
            {
                userId = int.Parse(HttpContext.User.Claims.ToArray()[0].Value);
            }

            if (userId == 0)
                return Unauthorized("Utilisateur non trouvé. Veuillez vérifier votre login!");

            int nbPage = _RequeteRepository.GetNbRequetesEnCours(userId);

            return Ok(nbPage);

        }

        [HttpGet("en_cours/word/{word}/pages")]
        public async Task<IActionResult> GetNbPageEnCoursByWord(string word)
        {
            int userId = 0;
            if (HttpContext.User.Claims.ToArray().Length != 0)
            {
                userId = int.Parse(HttpContext.User.Claims.ToArray()[0].Value);
            }

            if (userId == 0)
                return Unauthorized("Utilisateur non trouvé. Veuillez vérifier votre login!");

            int nbPage = _RequeteRepository.GetNbRequetesEnCoursByWord(userId,word);

            return Ok(nbPage);

        }

        [HttpGet("en_cours/page/{page}")]
        public IActionResult GetRequetesEnCoursByUtilisatueur(int page)
        {
            int userId = 0;
            if (HttpContext.User.Claims.ToArray().Length != 0)
            {
                userId = int.Parse(HttpContext.User.Claims.ToArray()[0].Value);
            }

            if (userId == 0)
                return Unauthorized("Utilisateur non trouvé. Veuillez vérifier votre login!");
            DateOnly tempDate = new DateOnly();
            int tempIdTypeRequete = 0;
            int tempDelai = 0;
            List<Requete> Requetes = _RequeteRepository.GetRequetesEnCoursByPage(userId,page);
            for (int i = 0; i < Requetes.Count(); i++)
            {
                Console.WriteLine(i);
                //Requetes[i].Activite = _ActiviteRepository.GetActivtieByRequete(Requetes[i].IdRequete);
                Requetes[i].Utilisateur = _UtilisateurRepository.GetUtilisateurByRequete(Requetes[i].IdRequete);
                //Requetes[i].Activite.Projet = _ProjetRepository.GetProjetByActivite(Requetes[i].Activite.idActivite);
                tempIdTypeRequete = (int) Requetes[i].IdTypeRequete;
                Requetes[i].Montant = _RequeteRubriqueRepository.GetSommeRequeteRubriquesByRequete(Requetes[i].IdRequete);
                Requetes[i].TypeRequete = _TypeRequeteRepository.GetTypeRequeteById(tempIdTypeRequete);
                if (Requetes[i].DateFinExecution != null)
                {
                    tempDate = (DateOnly)Requetes[i].DateFinExecution;
                    tempDelai = (int)Requetes[i].TypeRequete.DelaiJustification;
                    Requetes[i].DateFinEcheance = tempDate.AddDays(tempDelai);
                }
                Requetes[i].CircuitEtapeCheckListDetailsDTO = _CircuitRepository.GetCircuitEtapeActuelByIdRequeteSync(Requetes[i].IdRequete);
            }
            return Ok(Requetes);
        }

        [HttpGet("en_cours/word/{word}/page/{page}")]
        public IActionResult GetRequetesEnCoursByUtilisatueurAndWord(int page, string word)
        {
            int userId = 0;
            if (HttpContext.User.Claims.ToArray().Length != 0)
            {
                userId = int.Parse(HttpContext.User.Claims.ToArray()[0].Value);
            }

            if (userId == 0)
                return Unauthorized("Utilisateur non trouvé. Veuillez vérifier votre login!");
            DateOnly tempDate = new DateOnly();
            int tempIdTypeRequete = 0;
            int tempDelai = 0;
            List<Requete> Requetes = _RequeteRepository.GetRequetesEnCoursByPageAndWord(userId, word,page);
            for (int i = 0; i < Requetes.Count(); i++)
            {
                Console.WriteLine(i);
                //Requetes[i].Activite = _ActiviteRepository.GetActivtieByRequete(Requetes[i].IdRequete);
                Requetes[i].Utilisateur = _UtilisateurRepository.GetUtilisateurByRequete(Requetes[i].IdRequete);
                //Requetes[i].Activite.Projet = _ProjetRepository.GetProjetByActivite(Requetes[i].Activite.idActivite);
                tempIdTypeRequete = (int)Requetes[i].IdTypeRequete;
                Requetes[i].Montant = _RequeteRubriqueRepository.GetSommeRequeteRubriquesByRequete(Requetes[i].IdRequete);
                Requetes[i].TypeRequete = _TypeRequeteRepository.GetTypeRequeteById(tempIdTypeRequete);
                if (Requetes[i].DateFinExecution != null)
                {
                    tempDate = (DateOnly)Requetes[i].DateFinExecution;
                    tempDelai = (int)Requetes[i].TypeRequete.DelaiJustification;
                    Requetes[i].DateFinEcheance = tempDate.AddDays(tempDelai);
                }
                Requetes[i].CircuitEtapeCheckListDetailsDTO = _CircuitRepository.GetCircuitEtapeActuelByIdRequeteSync(Requetes[i].IdRequete);
            }
            return Ok(Requetes);
        }

        [HttpGet("validateur/pages")]
        public async Task<IActionResult> GetNbPageValidateur()
        {
            int userId = 0;
            if (HttpContext.User.Claims.ToArray().Length != 0)
            {
                userId = int.Parse(HttpContext.User.Claims.ToArray()[0].Value);
            }

            if (userId == 0)
                return Unauthorized("Utilisateur non trouvé. Veuillez vérifier votre login!");

            int nbPage = _RequeteRepository.GetNbRequetesOfValidateur(userId);

            return Ok(nbPage);

        }

        [HttpGet("validateur/word/{word}/pages")]
        public async Task<IActionResult> GetNbPageValidateur(string word)
        {
            int userId = 0;
            if (HttpContext.User.Claims.ToArray().Length != 0)
            {
                userId = int.Parse(HttpContext.User.Claims.ToArray()[0].Value);
            }

            if (userId == 0)
                return Unauthorized("Utilisateur non trouvé. Veuillez vérifier votre login!");

            int nbPage = _RequeteRepository.GetNbRequetesOfValidateurByWord(userId,word);

            return Ok(nbPage);

        }

        [HttpGet("validateur/page/{page}")]
        public IActionResult GetRequetesOfValidateurByUtilisatueur(int page)
        {
            int userId = 0;
            if (HttpContext.User.Claims.ToArray().Length != 0)
            {
                userId = int.Parse(HttpContext.User.Claims.ToArray()[0].Value);
            }

            if (userId == 0)
                return Unauthorized("Utilisateur non trouvé. Veuillez vérifier votre login!");
            DateOnly tempDate = new DateOnly();
            int tempIdTypeRequete = 0;
            int tempDelai = 0;
            List<Requete> Requetes = _RequeteRepository.GetRequetesOfValidateurByPage(userId,page);
            for (int i = 0; i < Requetes.Count(); i++)
            {
                Console.WriteLine(i);
                //Requetes[i].Activite = _ActiviteRepository.GetActivtieByRequete(Requetes[i].IdRequete);
                Requetes[i].Utilisateur = _UtilisateurRepository.GetUtilisateurByRequete(Requetes[i].IdRequete);
                //Requetes[i].Activite.Projet = _ProjetRepository.GetProjetByActivite(Requetes[i].Activite.idActivite);
                tempIdTypeRequete = (int) Requetes[i].IdTypeRequete;
                Requetes[i].Montant = _RequeteRubriqueRepository.GetSommeRequeteRubriquesByRequete(Requetes[i].IdRequete);
                Requetes[i].TypeRequete = _TypeRequeteRepository.GetTypeRequeteById(tempIdTypeRequete);
                Requetes[i].RequeteAccuse = _RequeteAccuseRepository.GetRequeteAccuseByIdRequete(Requetes[i].IdRequete);
                if (Requetes[i].DateFinExecution != null)
                {
                    tempDate = (DateOnly)Requetes[i].DateFinExecution;
                    tempDelai = (int)Requetes[i].TypeRequete.DelaiJustification;
                    Requetes[i].DateFinEcheance = tempDate.AddDays(tempDelai);
                }
            }
            return Ok(Requetes);
        }

        [HttpGet("validateur/word/{word}/page/{page}")]
        public IActionResult GetRequetesOfValidateurByUtilisatueurByWord(int page,string word)
        {
            int userId = 0;
            if (HttpContext.User.Claims.ToArray().Length != 0)
            {
                userId = int.Parse(HttpContext.User.Claims.ToArray()[0].Value);
            }

            if (userId == 0)
                return Unauthorized("Utilisateur non trouvé. Veuillez vérifier votre login!");
            DateOnly tempDate = new DateOnly();
            int tempIdTypeRequete = 0;
            int tempDelai = 0;
            List<Requete> Requetes = _RequeteRepository.GetRequetesOfValidateurByPageAndWord(userId,word, page);
            for (int i = 0; i < Requetes.Count(); i++)
            {
                Console.WriteLine(i);
                //Requetes[i].Activite = _ActiviteRepository.GetActivtieByRequete(Requetes[i].IdRequete);
                Requetes[i].Utilisateur = _UtilisateurRepository.GetUtilisateurByRequete(Requetes[i].IdRequete);
                //Requetes[i].Activite.Projet = _ProjetRepository.GetProjetByActivite(Requetes[i].Activite.idActivite);
                tempIdTypeRequete = (int)Requetes[i].IdTypeRequete;
                Requetes[i].Montant = _RequeteRubriqueRepository.GetSommeRequeteRubriquesByRequete(Requetes[i].IdRequete);
                Requetes[i].TypeRequete = _TypeRequeteRepository.GetTypeRequeteById(tempIdTypeRequete);
                Requetes[i].RequeteAccuse = _RequeteAccuseRepository.GetRequeteAccuseByIdRequete(Requetes[i].IdRequete);
                if (Requetes[i].DateFinExecution != null)
                {
                    tempDate = (DateOnly)Requetes[i].DateFinExecution;
                    tempDelai = (int)Requetes[i].TypeRequete.DelaiJustification;
                    Requetes[i].DateFinEcheance = tempDate.AddDays(tempDelai);
                }
            }
            return Ok(Requetes);
        }

        [HttpGet("validateur/en_cours/pages")]
        public async Task<IActionResult> GetNbPageValidateurEnCours()
        {
            int userId = 0;
            if (HttpContext.User.Claims.ToArray().Length != 0)
            {
                userId = int.Parse(HttpContext.User.Claims.ToArray()[0].Value);
            }

            if (userId == 0)
                return Unauthorized("Utilisateur non trouvé. Veuillez vérifier votre login!");

            int nbPage = _RequeteRepository.GetNbRequetesEnCoursCircuitValidateur(userId);

            return Ok(nbPage);

        }

        [HttpGet("validateur/en_cours/word/{word}/pages")]
        public async Task<IActionResult> GetNbPageValidateurEnCours(string word)
        {
            int userId = 0;
            if (HttpContext.User.Claims.ToArray().Length != 0)
            {
                userId = int.Parse(HttpContext.User.Claims.ToArray()[0].Value);
            }

            if (userId == 0)
                return Unauthorized("Utilisateur non trouvé. Veuillez vérifier votre login!");

            int nbPage = _RequeteRepository.GetNbRequetesEnCoursCircuitValidateurByWord(userId,word);

            return Ok(nbPage);

        }

        [HttpGet("validateur/en_cours/page/{page}")]
        public IActionResult GetRequetesEnCoursValidateur(int page)
        {
            int userId = 0;
            if (HttpContext.User.Claims.ToArray().Length != 0)
            {
                userId = int.Parse(HttpContext.User.Claims.ToArray()[0].Value);
            }

            if (userId == 0)
                return Unauthorized("Utilisateur non trouvé. Veuillez vérifier votre login!");
            DateOnly tempDate = new DateOnly();
            int tempIdTypeRequete = 0;
            int tempDelai = 0;
            List<Requete> Requetes = _RequeteRepository.GetRequetesEnCoursCircuitValidateurByPage(userId,page);
            for (int i = 0; i < Requetes.Count(); i++)
            {
                Console.WriteLine(i);
                //Requetes[i].Activite = _ActiviteRepository.GetActivtieByRequete(Requetes[i].IdRequete);
                Requetes[i].Utilisateur = _UtilisateurRepository.GetUtilisateurByRequete(Requetes[i].IdRequete);
                //Requetes[i].Activite.Projet = _ProjetRepository.GetProjetByActivite(Requetes[i].Activite.idActivite);
                tempIdTypeRequete = (int)Requetes[i].IdTypeRequete;
                Requetes[i].Montant = _RequeteRubriqueRepository.GetSommeRequeteRubriquesByRequete(Requetes[i].IdRequete);
                Requetes[i].TypeRequete = _TypeRequeteRepository.GetTypeRequeteById(tempIdTypeRequete);
                if (Requetes[i].DateFinExecution != null)
                {
                    tempDate = (DateOnly)Requetes[i].DateFinExecution;
                    tempDelai = (int)Requetes[i].TypeRequete.DelaiJustification;
                    Requetes[i].DateFinEcheance = tempDate.AddDays(tempDelai);
                }
                Requetes[i].CircuitEtapeCheckListDetailsDTO = _CircuitRepository.GetCircuitEtapeActuelByIdRequeteSync(Requetes[i].IdRequete);
            }
            return Ok(Requetes);
        }

        [HttpGet("validateur/en_cours/word/{word}/page/{page}")]
        public IActionResult GetRequetesEnCoursValidateurByWord(int page,string word)
        {
            int userId = 0;
            if (HttpContext.User.Claims.ToArray().Length != 0)
            {
                userId = int.Parse(HttpContext.User.Claims.ToArray()[0].Value);
            }

            if (userId == 0)
                return Unauthorized("Utilisateur non trouvé. Veuillez vérifier votre login!");
            DateOnly tempDate = new DateOnly();
            int tempIdTypeRequete = 0;
            int tempDelai = 0;
            List<Requete> Requetes = _RequeteRepository.GetRequetesEnCoursCircuitValidateurByPageAndWord(userId,word, page);
            for (int i = 0; i < Requetes.Count(); i++)
            {
                Console.WriteLine(i);
                //Requetes[i].Activite = _ActiviteRepository.GetActivtieByRequete(Requetes[i].IdRequete);
                Requetes[i].Utilisateur = _UtilisateurRepository.GetUtilisateurByRequete(Requetes[i].IdRequete);
                //Requetes[i].Activite.Projet = _ProjetRepository.GetProjetByActivite(Requetes[i].Activite.idActivite);
                tempIdTypeRequete = (int)Requetes[i].IdTypeRequete;
                Requetes[i].Montant = _RequeteRubriqueRepository.GetSommeRequeteRubriquesByRequete(Requetes[i].IdRequete);
                Requetes[i].TypeRequete = _TypeRequeteRepository.GetTypeRequeteById(tempIdTypeRequete);
                if (Requetes[i].DateFinExecution != null)
                {
                    tempDate = (DateOnly)Requetes[i].DateFinExecution;
                    tempDelai = (int)Requetes[i].TypeRequete.DelaiJustification;
                    Requetes[i].DateFinEcheance = tempDate.AddDays(tempDelai);
                }
                Requetes[i].CircuitEtapeCheckListDetailsDTO = _CircuitRepository.GetCircuitEtapeActuelByIdRequeteSync(Requetes[i].IdRequete);
            }
            return Ok(Requetes);
        }

        /*------------------------------------*/


        [HttpGet("admin/en_cours/pages")]
        public async Task<IActionResult> GetNbPageAdminEnCours()
        {
            int userId = 0;
            if (HttpContext.User.Claims.ToArray().Length != 0)
            {
                userId = int.Parse(HttpContext.User.Claims.ToArray()[0].Value);
            }

            if (userId == 0)
                return Unauthorized("Utilisateur non trouvé. Veuillez vérifier votre login!");

            int nbPage = _RequeteRepository.GetNbRequetesEnCoursCircuitAdmin(userId);

            return Ok(nbPage);

        }

        [HttpGet("admin/en_cours/word/{word}/pages")]
        public async Task<IActionResult> GetNbPageAdminEnCours(string word)
        {
            int userId = 0;
            if (HttpContext.User.Claims.ToArray().Length != 0)
            {
                userId = int.Parse(HttpContext.User.Claims.ToArray()[0].Value);
            }

            if (userId == 0)
                return Unauthorized("Utilisateur non trouvé. Veuillez vérifier votre login!");

            int nbPage = _RequeteRepository.GetNbRequetesEnCoursCircuitAdminByWord(userId, word);

            return Ok(nbPage);

        }

        [HttpGet("admin/en_cours/page/{page}")]
        public IActionResult GetRequetesEnCoursAdmin(int page)
        {
            int userId = 0;
            if (HttpContext.User.Claims.ToArray().Length != 0)
            {
                userId = int.Parse(HttpContext.User.Claims.ToArray()[0].Value);
            }

            if (userId == 0)
                return Unauthorized("Utilisateur non trouvé. Veuillez vérifier votre login!");
            DateOnly tempDate = new DateOnly();
            int tempIdTypeRequete = 0;
            int tempDelai = 0;
            List<Requete> Requetes = _RequeteRepository.GetRequetesEnCoursCircuitAdminByPage(userId, page);
            for (int i = 0; i < Requetes.Count(); i++)
            {
                Console.WriteLine(i);
                //Requetes[i].Activite = _ActiviteRepository.GetActivtieByRequete(Requetes[i].IdRequete);
                Requetes[i].Utilisateur = _UtilisateurRepository.GetUtilisateurByRequete(Requetes[i].IdRequete);
                //Requetes[i].Activite.Projet = _ProjetRepository.GetProjetByActivite(Requetes[i].Activite.idActivite);
                tempIdTypeRequete = (int)Requetes[i].IdTypeRequete;
                Requetes[i].Montant = _RequeteRubriqueRepository.GetSommeRequeteRubriquesByRequete(Requetes[i].IdRequete);
                Requetes[i].TypeRequete = _TypeRequeteRepository.GetTypeRequeteById(tempIdTypeRequete);
                if (Requetes[i].DateFinExecution != null)
                {
                    tempDate = (DateOnly)Requetes[i].DateFinExecution;
                    tempDelai = (int)Requetes[i].TypeRequete.DelaiJustification;
                    Requetes[i].DateFinEcheance = tempDate.AddDays(tempDelai);
                }
                Requetes[i].CircuitEtapeCheckListDetailsDTO = _CircuitRepository.GetCircuitEtapeActuelByIdRequeteSync(Requetes[i].IdRequete);
            }
            return Ok(Requetes);
        }

        [HttpGet("admin/en_cours/word/{word}/page/{page}")]
        public IActionResult GetRequetesEnCoursAdminByWord(int page, string word)
        {
            int userId = 0;
            if (HttpContext.User.Claims.ToArray().Length != 0)
            {
                userId = int.Parse(HttpContext.User.Claims.ToArray()[0].Value);
            }

            if (userId == 0)
                return Unauthorized("Utilisateur non trouvé. Veuillez vérifier votre login!");
            DateOnly tempDate = new DateOnly();
            int tempIdTypeRequete = 0;
            int tempDelai = 0;
            List<Requete> Requetes = _RequeteRepository.GetRequetesEnCoursCircuitAdminByPageAndWord(userId, word, page);
            for (int i = 0; i < Requetes.Count(); i++)
            {
                Console.WriteLine(i);
                //Requetes[i].Activite = _ActiviteRepository.GetActivtieByRequete(Requetes[i].IdRequete);
                Requetes[i].Utilisateur = _UtilisateurRepository.GetUtilisateurByRequete(Requetes[i].IdRequete);
                //Requetes[i].Activite.Projet = _ProjetRepository.GetProjetByActivite(Requetes[i].Activite.idActivite);
                tempIdTypeRequete = (int)Requetes[i].IdTypeRequete;
                Requetes[i].Montant = _RequeteRubriqueRepository.GetSommeRequeteRubriquesByRequete(Requetes[i].IdRequete);
                Requetes[i].TypeRequete = _TypeRequeteRepository.GetTypeRequeteById(tempIdTypeRequete);
                if (Requetes[i].DateFinExecution != null)
                {
                    tempDate = (DateOnly)Requetes[i].DateFinExecution;
                    tempDelai = (int)Requetes[i].TypeRequete.DelaiJustification;
                    Requetes[i].DateFinEcheance = tempDate.AddDays(tempDelai);
                }
                Requetes[i].CircuitEtapeCheckListDetailsDTO = _CircuitRepository.GetCircuitEtapeActuelByIdRequeteSync(Requetes[i].IdRequete);
            }
            return Ok(Requetes);
        }

        /*------------------------------------*/

        [HttpGet("validateur/valides/pages")]
        public async Task<IActionResult> GetNbPageValidateurValides()
        {
            int userId = 0;
            if (HttpContext.User.Claims.ToArray().Length != 0)
            {
                userId = int.Parse(HttpContext.User.Claims.ToArray()[0].Value);
            }

            if (userId == 0)
                return Unauthorized("Utilisateur non trouvé. Veuillez vérifier votre login!");

            int nbPage = _RequeteRepository.GetNbRequetesValidesValidateur(userId);

            return Ok(nbPage);

        }

        [HttpGet("validateur/valides/word{word}/pages")]
        public async Task<IActionResult> GetNbPageValidateurValides(string word)
        {
            int userId = 0;
            if (HttpContext.User.Claims.ToArray().Length != 0)
            {
                userId = int.Parse(HttpContext.User.Claims.ToArray()[0].Value);
            }

            if (userId == 0)
                return Unauthorized("Utilisateur non trouvé. Veuillez vérifier votre login!");

            int nbPage = _RequeteRepository.GetNbRequetesValidesValidateurByWord(userId,word);

            return Ok(nbPage);

        }

        [HttpGet("validateur/valides/page/{page}")]
        public IActionResult GetRequetesValidesValidateur(int page)
        {
            int userId = 0;
            if (HttpContext.User.Claims.ToArray().Length != 0)
            {
                userId = int.Parse(HttpContext.User.Claims.ToArray()[0].Value);
            }

            if (userId == 0)
                return Unauthorized("Utilisateur non trouvé. Veuillez vérifier votre login!");
            DateOnly tempDate = new DateOnly();
            int tempIdTypeRequete = 0;
            int tempDelai = 0;
            List<Requete> Requetes = _RequeteRepository.GetRequetesValidesValidateurByPage(userId, page);
            for (int i = 0; i < Requetes.Count(); i++)
            {
                Console.WriteLine(i);
                //Requetes[i].Activite = _ActiviteRepository.GetActivtieByRequete(Requetes[i].IdRequete);
                Requetes[i].Utilisateur = _UtilisateurRepository.GetUtilisateurByRequete(Requetes[i].IdRequete);
                //Requetes[i].Activite.Projet = _ProjetRepository.GetProjetByActivite(Requetes[i].Activite.idActivite);
                tempIdTypeRequete = (int)Requetes[i].IdTypeRequete;
                Requetes[i].Montant = _RequeteRubriqueRepository.GetSommeRequeteRubriquesByRequete(Requetes[i].IdRequete);
                Requetes[i].TypeRequete = _TypeRequeteRepository.GetTypeRequeteById(tempIdTypeRequete);
                if (Requetes[i].DateFinExecution != null)
                {
                    tempDate = (DateOnly)Requetes[i].DateFinExecution;
                    tempDelai = (int)Requetes[i].TypeRequete.DelaiJustification;
                    Requetes[i].DateFinEcheance = tempDate.AddDays(tempDelai);
                }
                Requetes[i].CircuitEtapeCheckListDetailsDTO = _CircuitRepository.GetCircuitEtapeActuelByIdRequeteSync(Requetes[i].IdRequete);
            }
            return Ok(Requetes);
        }

        [HttpGet("validateur/valides/word/{word}/page/{page}")]
        public IActionResult GetRequetesValidesValidateur(int page,string word)
        {
            int userId = 0;
            if (HttpContext.User.Claims.ToArray().Length != 0)
            {
                userId = int.Parse(HttpContext.User.Claims.ToArray()[0].Value);
            }

            if (userId == 0)
                return Unauthorized("Utilisateur non trouvé. Veuillez vérifier votre login!");
            DateOnly tempDate = new DateOnly();
            int tempIdTypeRequete = 0;
            int tempDelai = 0;
            List<Requete> Requetes = _RequeteRepository.GetRequetesValidesValidateurByPageAndWord(userId,word, page);
            for (int i = 0; i < Requetes.Count(); i++)
            {
                Console.WriteLine(i);
                //Requetes[i].Activite = _ActiviteRepository.GetActivtieByRequete(Requetes[i].IdRequete);
                Requetes[i].Utilisateur = _UtilisateurRepository.GetUtilisateurByRequete(Requetes[i].IdRequete);
                //Requetes[i].Activite.Projet = _ProjetRepository.GetProjetByActivite(Requetes[i].Activite.idActivite);
                tempIdTypeRequete = (int)Requetes[i].IdTypeRequete;
                Requetes[i].Montant = _RequeteRubriqueRepository.GetSommeRequeteRubriquesByRequete(Requetes[i].IdRequete);
                Requetes[i].TypeRequete = _TypeRequeteRepository.GetTypeRequeteById(tempIdTypeRequete);
                if (Requetes[i].DateFinExecution != null)
                {
                    tempDate = (DateOnly)Requetes[i].DateFinExecution;
                    tempDelai = (int)Requetes[i].TypeRequete.DelaiJustification;
                    Requetes[i].DateFinEcheance = tempDate.AddDays(tempDelai);
                }
                Requetes[i].CircuitEtapeCheckListDetailsDTO = _CircuitRepository.GetCircuitEtapeActuelByIdRequeteSync(Requetes[i].IdRequete);
            }
            return Ok(Requetes);
        }

        /*----------------------*/

        [HttpGet("admin/valides/pages")]
        public async Task<IActionResult> GetNbPageAdminValides()
        {
            int userId = 0;
            if (HttpContext.User.Claims.ToArray().Length != 0)
            {
                userId = int.Parse(HttpContext.User.Claims.ToArray()[0].Value);
            }

            if (userId == 0)
                return Unauthorized("Utilisateur non trouvé. Veuillez vérifier votre login!");

            int nbPage = _RequeteRepository.GetNbRequetesValidesAdmin(userId);

            return Ok(nbPage);

        }

        [HttpGet("admin/valides/word{word}/pages")]
        public async Task<IActionResult> GetNbPageAdminValides(string word)
        {
            int userId = 0;
            if (HttpContext.User.Claims.ToArray().Length != 0)
            {
                userId = int.Parse(HttpContext.User.Claims.ToArray()[0].Value);
            }

            if (userId == 0)
                return Unauthorized("Utilisateur non trouvé. Veuillez vérifier votre login!");

            int nbPage = _RequeteRepository.GetNbRequetesValidesAdminByWord(userId, word);

            return Ok(nbPage);

        }

        [HttpGet("admin/valides/page/{page}")]
        public IActionResult GetRequetesValidesAdmin(int page)
        {
            int userId = 0;
            if (HttpContext.User.Claims.ToArray().Length != 0)
            {
                userId = int.Parse(HttpContext.User.Claims.ToArray()[0].Value);
            }

            if (userId == 0)
                return Unauthorized("Utilisateur non trouvé. Veuillez vérifier votre login!");
            DateOnly tempDate = new DateOnly();
            int tempIdTypeRequete = 0;
            int tempDelai = 0;
            List<Requete> Requetes = _RequeteRepository.GetRequetesValidesAdminByPage(userId, page);
            for (int i = 0; i < Requetes.Count(); i++)
            {
                Console.WriteLine(i);
                //Requetes[i].Activite = _ActiviteRepository.GetActivtieByRequete(Requetes[i].IdRequete);
                Requetes[i].Utilisateur = _UtilisateurRepository.GetUtilisateurByRequete(Requetes[i].IdRequete);
                //Requetes[i].Activite.Projet = _ProjetRepository.GetProjetByActivite(Requetes[i].Activite.idActivite);
                tempIdTypeRequete = (int)Requetes[i].IdTypeRequete;
                Requetes[i].Montant = _RequeteRubriqueRepository.GetSommeRequeteRubriquesByRequete(Requetes[i].IdRequete);
                Requetes[i].TypeRequete = _TypeRequeteRepository.GetTypeRequeteById(tempIdTypeRequete);
                if (Requetes[i].DateFinExecution != null)
                {
                    tempDate = (DateOnly)Requetes[i].DateFinExecution;
                    tempDelai = (int)Requetes[i].TypeRequete.DelaiJustification;
                    Requetes[i].DateFinEcheance = tempDate.AddDays(tempDelai);
                }
                Requetes[i].CircuitEtapeCheckListDetailsDTO = _CircuitRepository.GetCircuitEtapeActuelByIdRequeteSync(Requetes[i].IdRequete);
            }
            return Ok(Requetes);
        }

        [HttpGet("admin/valides/word/{word}/page/{page}")]
        public IActionResult GetRequetesValidesAdmin(int page, string word)
        {
            int userId = 0;
            if (HttpContext.User.Claims.ToArray().Length != 0)
            {
                userId = int.Parse(HttpContext.User.Claims.ToArray()[0].Value);
            }

            if (userId == 0)
                return Unauthorized("Utilisateur non trouvé. Veuillez vérifier votre login!");
            DateOnly tempDate = new DateOnly();
            int tempIdTypeRequete = 0;
            int tempDelai = 0;
            List<Requete> Requetes = _RequeteRepository.GetRequetesValidesAdminByPageAndWord(userId, word, page);
            for (int i = 0; i < Requetes.Count(); i++)
            {
                Console.WriteLine(i);
                //Requetes[i].Activite = _ActiviteRepository.GetActivtieByRequete(Requetes[i].IdRequete);
                Requetes[i].Utilisateur = _UtilisateurRepository.GetUtilisateurByRequete(Requetes[i].IdRequete);
                //Requetes[i].Activite.Projet = _ProjetRepository.GetProjetByActivite(Requetes[i].Activite.idActivite);
                tempIdTypeRequete = (int)Requetes[i].IdTypeRequete;
                Requetes[i].Montant = _RequeteRubriqueRepository.GetSommeRequeteRubriquesByRequete(Requetes[i].IdRequete);
                Requetes[i].TypeRequete = _TypeRequeteRepository.GetTypeRequeteById(tempIdTypeRequete);
                if (Requetes[i].DateFinExecution != null)
                {
                    tempDate = (DateOnly)Requetes[i].DateFinExecution;
                    tempDelai = (int)Requetes[i].TypeRequete.DelaiJustification;
                    Requetes[i].DateFinEcheance = tempDate.AddDays(tempDelai);
                }
                Requetes[i].CircuitEtapeCheckListDetailsDTO = _CircuitRepository.GetCircuitEtapeActuelByIdRequeteSync(Requetes[i].IdRequete);
            }
            return Ok(Requetes);
        }

        /*----------------------*/

        [HttpGet("check_droit_ajout_pj/date_creation/{dateCreation}")]
        public IActionResult CheckDroitAjoutPj(DateTime dateCreation)
        {
            int userId = 0;
            if (HttpContext.User.Claims.ToArray().Length != 0)
            {
                userId = int.Parse(HttpContext.User.Claims.ToArray()[0].Value); //idvalidateur
            }

            if (userId == 0)
                return Unauthorized("Utilisateur non trouvé. Veuillez vérifier votre login!");

            DateTime now = DateTime.Now;
            int nbjour = (now - dateCreation).Days;
            Console.WriteLine(nbjour);
            if (nbjour < 15)
            {
                return Ok(0);
            }
            else
            {
                return Ok(1);
            }
        }


        [HttpGet("a_valider/pages")]
        public async Task<IActionResult> GetNbPageAvalider()
        {
            int userId = 0;
            if (HttpContext.User.Claims.ToArray().Length != 0)
            {
                userId = int.Parse(HttpContext.User.Claims.ToArray()[0].Value);
            }

            if (userId == 0)
                return Unauthorized("Utilisateur non trouvé. Veuillez vérifier votre login!");

            int nbPage = _RequeteRepository.GetNbRequetesPourValidation(userId);

            return Ok(nbPage);

        }

        [HttpGet("a_valider/word/{word}/pages")]
        public async Task<IActionResult> GetNbPageAvalider(string word)
        {
            int userId = 0;
            if (HttpContext.User.Claims.ToArray().Length != 0)
            {
                userId = int.Parse(HttpContext.User.Claims.ToArray()[0].Value);
            }

            if (userId == 0)
                return Unauthorized("Utilisateur non trouvé. Veuillez vérifier votre login!");

            int nbPage = _RequeteRepository.GetNbRequetesPourValidationByWord(userId,word);

            return Ok(nbPage);

        }

        [HttpGet("a_valider/page/{page}")]
        public IActionResult GetRequetesToValidate(int page)
        {
            int userId = 0;
            if (HttpContext.User.Claims.ToArray().Length != 0)
            {
                userId = int.Parse(HttpContext.User.Claims.ToArray()[0].Value); //idvalidateur
            }

            if (userId == 0)
                return Unauthorized("Utilisateur non trouvé. Veuillez vérifier votre login!");
            DateOnly tempDate = new DateOnly();
            int tempIdTypeRequete = 0;
            int tempDelai = 0;
            List<Requete> Requetes = _RequeteRepository.GetRequetesPourValidationByPage(userId,page);
            for (int i = 0; i < Requetes.Count(); i++)
            {
                Console.WriteLine(i);
                //Requetes[i].Activite = _ActiviteRepository.GetActivtieByRequete(Requetes[i].IdRequete);
                Requetes[i].Utilisateur = _UtilisateurRepository.GetUtilisateurByRequete(Requetes[i].IdRequete);
                //Requetes[i].Activite.Projet = _ProjetRepository.GetProjetByActivite(Requetes[i].Activite.idActivite);
                tempIdTypeRequete = (int) Requetes[i].IdTypeRequete;
                Requetes[i].Montant = _RequeteRubriqueRepository.GetSommeRequeteRubriquesByRequete(Requetes[i].IdRequete);
                Requetes[i].TypeRequete = _TypeRequeteRepository.GetTypeRequeteById(tempIdTypeRequete);
                //Requetes[i].TempsAttenteValidation =(DateTime.Now - _RequeteRepository.GetLastValidationDate(Requetes[i].IdRequete)).ToString(@"hh\:mm\:ss");
                if (Requetes[i].DateFinExecution != null)
                {
                    tempDate = (DateOnly) Requetes[i].DateFinExecution;
                    tempDelai = (int) Requetes[i].TypeRequete.DelaiJustification;
                    Requetes[i].DateFinEcheance = tempDate.AddDays(tempDelai);
                }
                Requetes[i].NumeroEtapeActuelle = _RequeteRepository.GetEtapeActuelleForValidation(Requetes[i].IdRequete);
                Requetes[i].TempsAttenteValidation = (DateTime.Now - _RequeteRepository.GetLastValidationDate(Requetes[i].IdRequete)).ToString(@"hh\:mm\:ss");
            }
            return Ok(Requetes);
        }

        [HttpGet("a_valider/word/{word}/page/{page}")]
        public IActionResult GetRequetesToValidate(int page,string word)
        {
            int userId = 0;
            if (HttpContext.User.Claims.ToArray().Length != 0)
            {
                userId = int.Parse(HttpContext.User.Claims.ToArray()[0].Value); //idvalidateur
            }

            if (userId == 0)
                return Unauthorized("Utilisateur non trouvé. Veuillez vérifier votre login!");
            DateOnly tempDate = new DateOnly();
            int tempIdTypeRequete = 0;
            int tempDelai = 0;
            List<Requete> Requetes = _RequeteRepository.GetRequetesPourValidationByPageAndWord(userId,word, page);
            for (int i = 0; i < Requetes.Count(); i++)
            {
                Console.WriteLine(i);
                //Requetes[i].Activite = _ActiviteRepository.GetActivtieByRequete(Requetes[i].IdRequete);
                Requetes[i].Utilisateur = _UtilisateurRepository.GetUtilisateurByRequete(Requetes[i].IdRequete);
                //Requetes[i].Activite.Projet = _ProjetRepository.GetProjetByActivite(Requetes[i].Activite.idActivite);
                tempIdTypeRequete = (int)Requetes[i].IdTypeRequete;
                Requetes[i].Montant = _RequeteRubriqueRepository.GetSommeRequeteRubriquesByRequete(Requetes[i].IdRequete);
                Requetes[i].TypeRequete = _TypeRequeteRepository.GetTypeRequeteById(tempIdTypeRequete);

                if (Requetes[i].DateFinExecution != null)
                {
                    tempDate = (DateOnly)Requetes[i].DateFinExecution;
                    tempDelai = (int)Requetes[i].TypeRequete.DelaiJustification;
                    Requetes[i].DateFinEcheance = tempDate.AddDays(tempDelai);
                }
                Requetes[i].NumeroEtapeActuelle = _RequeteRepository.GetEtapeActuelleForValidation(Requetes[i].IdRequete);
                Requetes[i].TempsAttenteValidation = (DateTime.Now - _RequeteRepository.GetLastValidationDate(Requetes[i].IdRequete)).ToString(@"hh\:mm\:ss");
            }
            return Ok(Requetes);
        }
        /*-------------------------------------------------*/
        [HttpGet("a_justifier/pages")]
        public async Task<IActionResult> GetNbPageRequetesAjustifier()
        {
            int userId = 0;
            if (HttpContext.User.Claims.ToArray().Length != 0)
            {
                userId = int.Parse(HttpContext.User.Claims.ToArray()[0].Value);
            }

            if (userId == 0)
                return Unauthorized("Utilisateur non trouvé. Veuillez vérifier votre login!");

            int nbPage = _RequeteRepository.GetNbRequetesAjustifier(userId);

            return Ok(nbPage);

        }

        [HttpGet("a_justifier/word/{word}/pages")]
        public async Task<IActionResult> GetNbPageRequetesAjustifierByWord(string word)
        {
            int userId = 0;
            if (HttpContext.User.Claims.ToArray().Length != 0)
            {
                userId = int.Parse(HttpContext.User.Claims.ToArray()[0].Value);
            }

            if (userId == 0)
                return Unauthorized("Utilisateur non trouvé. Veuillez vérifier votre login!");

            int nbPage = _RequeteRepository.GetNbRequetesAjustifierByWord(userId,word);

            return Ok(nbPage);

        }


        [HttpGet("a_justifier/page/{page}")]
        public IActionResult GetRequetesAjustifier(int page)
        {
            int userId = 0;
            if (HttpContext.User.Claims.ToArray().Length != 0)
            {
                userId = int.Parse(HttpContext.User.Claims.ToArray()[0].Value); //idvalidateur
            }

            if (userId == 0)
                return Unauthorized("Utilisateur non trouvé. Veuillez vérifier votre login!");
            DateOnly tempDate = new DateOnly();
            List<Requete> Requetes = _RequeteRepository.GetRequetesAjustifierByPage(userId,page);
            int tempIdTypeRequete = 0;
            int tempDelai = 0;
            for (int i = 0; i < Requetes.Count(); i++)
            {
                Console.WriteLine(i);
                //Requetes[i].Activite = _ActiviteRepository.GetActivtieByRequete(Requetes[i].IdRequete);
                Requetes[i].Utilisateur = _UtilisateurRepository.GetUtilisateurByRequete(Requetes[i].IdRequete);
                //Requetes[i].Activite.Projet = _ProjetRepository.GetProjetByActivite(Requetes[i].Activite.idActivite);
                tempIdTypeRequete = (int) Requetes[i].IdTypeRequete;
                Requetes[i].Montant = _RequeteRubriqueRepository.GetSommeRequeteRubriquesByRequete(Requetes[i].IdRequete);
                Requetes[i].TypeRequete = _TypeRequeteRepository.GetTypeRequeteById(tempIdTypeRequete);
                if (Requetes[i].DateFinExecution != null)
                {
                    tempDate = (DateOnly)Requetes[i].DateFinExecution;
                    tempDelai = (int)Requetes[i].TypeRequete.DelaiJustification;
                    Requetes[i].DateFinEcheance = tempDate.AddDays(tempDelai);
                    Console.WriteLine((DateOnly)Requetes[i].DateFinEcheance);
                    Console.WriteLine(DateOnly.FromDateTime(DateTime.Now));
                    if ((DateOnly) Requetes[i].DateFinEcheance < DateOnly.FromDateTime(DateTime.Now) && _RequeteJustificatifRepository.GetRequeteJustificatifByIdRequete(Requetes[i].IdRequete).Count()==0)
                    {
                        Requetes[i].isExpired = true;
                    }
                    else
                    {
                        Requetes[i].isExpired = false;
                    }
                }
            }
            return Ok(Requetes);
        }

        [HttpGet("a_justifier/word/{word}/page/{page}")]
        public IActionResult GetRequetesAjustifierByWord(int page,string word)
        {
            int userId = 0;
            if (HttpContext.User.Claims.ToArray().Length != 0)
            {
                userId = int.Parse(HttpContext.User.Claims.ToArray()[0].Value); //idvalidateur
            }

            if (userId == 0)
                return Unauthorized("Utilisateur non trouvé. Veuillez vérifier votre login!");
            DateOnly tempDate = new DateOnly();
            List<Requete> Requetes = _RequeteRepository.GetRequetesAjustifierByPageAndWord(userId,word, page);
            int tempIdTypeRequete = 0;
            int tempDelai = 0;
            for (int i = 0; i < Requetes.Count(); i++)
            {
                Console.WriteLine(i);
                //Requetes[i].Activite = _ActiviteRepository.GetActivtieByRequete(Requetes[i].IdRequete);
                Requetes[i].Utilisateur = _UtilisateurRepository.GetUtilisateurByRequete(Requetes[i].IdRequete);
                //Requetes[i].Activite.Projet = _ProjetRepository.GetProjetByActivite(Requetes[i].Activite.idActivite);
                tempIdTypeRequete = (int)Requetes[i].IdTypeRequete;
                Requetes[i].Montant = _RequeteRubriqueRepository.GetSommeRequeteRubriquesByRequete(Requetes[i].IdRequete);
                Requetes[i].TypeRequete = _TypeRequeteRepository.GetTypeRequeteById(tempIdTypeRequete);
                if (Requetes[i].DateFinExecution != null)
                {
                    tempDate = (DateOnly)Requetes[i].DateFinExecution;
                    tempDelai = (int)Requetes[i].TypeRequete.DelaiJustification;
                    Requetes[i].DateFinEcheance = tempDate.AddDays(tempDelai);
                    Console.WriteLine((DateOnly)Requetes[i].DateFinEcheance);
                    Console.WriteLine(DateOnly.FromDateTime(DateTime.Now));
                    if ((DateOnly)Requetes[i].DateFinEcheance < DateOnly.FromDateTime(DateTime.Now) && _RequeteJustificatifRepository.GetRequeteJustificatifByIdRequete(Requetes[i].IdRequete).Count() == 0)
                    {
                        Requetes[i].isExpired = true;
                    }
                    else
                    {
                        Requetes[i].isExpired = false;
                    }
                }
            }
            return Ok(Requetes);
        }

        [HttpGet("a_cloturer/pages")]
        public async Task<IActionResult> GetNbPageACloturees()
        {
            int userId = 0;
            if (HttpContext.User.Claims.ToArray().Length != 0)
            {
                userId = int.Parse(HttpContext.User.Claims.ToArray()[0].Value);
            }

            if (userId == 0)
                return Unauthorized("Utilisateur non trouvé. Veuillez vérifier votre login!");

            int nbPage = _RequeteRepository.GetNbRequetesACloturees(userId);

            return Ok(nbPage);

        }

        [HttpGet("a_cloturer/word/{word}/pages")]
        public async Task<IActionResult> GetNbPageACloturees(string word)
        {
            int userId = 0;
            if (HttpContext.User.Claims.ToArray().Length != 0)
            {
                userId = int.Parse(HttpContext.User.Claims.ToArray()[0].Value);
            }

            if (userId == 0)
                return Unauthorized("Utilisateur non trouvé. Veuillez vérifier votre login!");

            int nbPage = _RequeteRepository.GetNbRequetesAClotureesByWord(userId,word);

            return Ok(nbPage);

        }

        [HttpGet("a_cloturer/page/{page}")]
        public IActionResult GetRequetesAcloturer(int page)
        {
            int userId = 0;
            if (HttpContext.User.Claims.ToArray().Length != 0)
            {
                userId = int.Parse(HttpContext.User.Claims.ToArray()[0].Value);
            }

            if (userId == 0)
                return Unauthorized("Utilisateur non trouvé. Veuillez vérifier votre login!");
            DateOnly tempDate = new DateOnly();
            int tempIdTypeRequete = 0;
            int tempDelai = 0;
            List<Requete> Requetes = _RequeteRepository.GetRequetesAcloturerByPage(userId,page);
            for (int i = 0; i < Requetes.Count(); i++)
            {
                Console.WriteLine(i);
                //Requetes[i].Activite = _ActiviteRepository.GetActivtieByRequete(Requetes[i].IdRequete);
                Requetes[i].Utilisateur = _UtilisateurRepository.GetUtilisateurByRequete(Requetes[i].IdRequete);
                //Requetes[i].Activite.Projet = _ProjetRepository.GetProjetByActivite(Requetes[i].Activite.idActivite);
                tempIdTypeRequete = (int) Requetes[i].IdTypeRequete;
                Requetes[i].Montant = _RequeteRubriqueRepository.GetSommeRequeteRubriquesByRequete(Requetes[i].IdRequete);
                Requetes[i].TypeRequete = _TypeRequeteRepository.GetTypeRequeteById(tempIdTypeRequete);
                Requetes[i].RequeteAccuse = _RequeteAccuseRepository.GetRequeteAccuseByIdRequete(Requetes[i].IdRequete);
                if (Requetes[i].DateFinExecution != null)
                {
                    tempDate = (DateOnly)Requetes[i].DateFinExecution;
                    tempDelai = (int)Requetes[i].TypeRequete.DelaiJustification;
                    Requetes[i].DateFinEcheance = tempDate.AddDays(tempDelai);
                }
            }
            return Ok(Requetes);
        }

        [HttpGet("a_cloturer/word/{word}/page/{page}")]
        public IActionResult GetRequetesAcloturer(int page,string word)
        {
            int userId = 0;
            if (HttpContext.User.Claims.ToArray().Length != 0)
            {
                userId = int.Parse(HttpContext.User.Claims.ToArray()[0].Value);
            }

            if (userId == 0)
                return Unauthorized("Utilisateur non trouvé. Veuillez vérifier votre login!");
            DateOnly tempDate = new DateOnly();
            int tempIdTypeRequete = 0;
            int tempDelai = 0;
            List<Requete> Requetes = _RequeteRepository.GetRequetesAcloturerByPageAndWord(userId,word, page);
            for (int i = 0; i < Requetes.Count(); i++)
            {
                Console.WriteLine(i);
                //Requetes[i].Activite = _ActiviteRepository.GetActivtieByRequete(Requetes[i].IdRequete);
                Requetes[i].Utilisateur = _UtilisateurRepository.GetUtilisateurByRequete(Requetes[i].IdRequete);
                //Requetes[i].Activite.Projet = _ProjetRepository.GetProjetByActivite(Requetes[i].Activite.idActivite);
                tempIdTypeRequete = (int)Requetes[i].IdTypeRequete;
                Requetes[i].Montant = _RequeteRubriqueRepository.GetSommeRequeteRubriquesByRequete(Requetes[i].IdRequete);
                Requetes[i].TypeRequete = _TypeRequeteRepository.GetTypeRequeteById(tempIdTypeRequete);
                Requetes[i].RequeteAccuse = _RequeteAccuseRepository.GetRequeteAccuseByIdRequete(Requetes[i].IdRequete);
                if (Requetes[i].DateFinExecution != null)
                {
                    tempDate = (DateOnly)Requetes[i].DateFinExecution;
                    tempDelai = (int)Requetes[i].TypeRequete.DelaiJustification;
                    Requetes[i].DateFinEcheance = tempDate.AddDays(tempDelai);
                }
            }
            return Ok(Requetes);
        }

        /*------------------------------------------------------*/

        [HttpGet("admin/a_cloturer/pages")]
        public async Task<IActionResult> GetNbPageAClotureesAdmin()
        {
            int userId = 0;
            if (HttpContext.User.Claims.ToArray().Length != 0)
            {
                userId = int.Parse(HttpContext.User.Claims.ToArray()[0].Value);
            }

            if (userId == 0)
                return Unauthorized("Utilisateur non trouvé. Veuillez vérifier votre login!");

            int nbPage = _RequeteRepository.GetNbRequetesAClotureesAdmin(userId);

            return Ok(nbPage);

        }

        [HttpGet("admin/a_cloturer/word/{word}/pages")]
        public async Task<IActionResult> GetNbPageAClotureesAdmin(string word)
        {
            int userId = 0;
            if (HttpContext.User.Claims.ToArray().Length != 0)
            {
                userId = int.Parse(HttpContext.User.Claims.ToArray()[0].Value);
            }

            if (userId == 0)
                return Unauthorized("Utilisateur non trouvé. Veuillez vérifier votre login!");

            int nbPage = _RequeteRepository.GetNbRequetesAClotureesAdminByWord(userId, word);

            return Ok(nbPage);

        }

        [HttpGet("admin/a_cloturer/page/{page}")]
        public IActionResult GetRequetesAcloturerAdmin(int page)
        {
            int userId = 0;
            if (HttpContext.User.Claims.ToArray().Length != 0)
            {
                userId = int.Parse(HttpContext.User.Claims.ToArray()[0].Value);
            }

            if (userId == 0)
                return Unauthorized("Utilisateur non trouvé. Veuillez vérifier votre login!");
            DateOnly tempDate = new DateOnly();
            int tempIdTypeRequete = 0;
            int tempDelai = 0;
            List<Requete> Requetes = _RequeteRepository.GetRequetesAcloturerAdminByPage(userId, page);
            for (int i = 0; i < Requetes.Count(); i++)
            {
                Console.WriteLine(i);
                //Requetes[i].Activite = _ActiviteRepository.GetActivtieByRequete(Requetes[i].IdRequete);
                Requetes[i].Utilisateur = _UtilisateurRepository.GetUtilisateurByRequete(Requetes[i].IdRequete);
                //Requetes[i].Activite.Projet = _ProjetRepository.GetProjetByActivite(Requetes[i].Activite.idActivite);
                tempIdTypeRequete = (int)Requetes[i].IdTypeRequete;
                Requetes[i].Montant = _RequeteRubriqueRepository.GetSommeRequeteRubriquesByRequete(Requetes[i].IdRequete);
                Requetes[i].TypeRequete = _TypeRequeteRepository.GetTypeRequeteById(tempIdTypeRequete);
                Requetes[i].RequeteAccuse = _RequeteAccuseRepository.GetRequeteAccuseByIdRequete(Requetes[i].IdRequete);
                if (Requetes[i].DateFinExecution != null)
                {
                    tempDate = (DateOnly)Requetes[i].DateFinExecution;
                    tempDelai = (int)Requetes[i].TypeRequete.DelaiJustification;
                    Requetes[i].DateFinEcheance = tempDate.AddDays(tempDelai);
                }
            }
            return Ok(Requetes);
        }

        [HttpGet("admin/a_cloturer/word/{word}/page/{page}")]
        public IActionResult GetRequetesAcloturerAdmin(int page, string word)
        {
            int userId = 0;
            if (HttpContext.User.Claims.ToArray().Length != 0)
            {
                userId = int.Parse(HttpContext.User.Claims.ToArray()[0].Value);
            }

            if (userId == 0)
                return Unauthorized("Utilisateur non trouvé. Veuillez vérifier votre login!");
            DateOnly tempDate = new DateOnly();
            int tempIdTypeRequete = 0;
            int tempDelai = 0;
            List<Requete> Requetes = _RequeteRepository.GetRequetesAcloturerAdminByPageAndWord(userId, word, page);
            for (int i = 0; i < Requetes.Count(); i++)
            {
                Console.WriteLine(i);
                //Requetes[i].Activite = _ActiviteRepository.GetActivtieByRequete(Requetes[i].IdRequete);
                Requetes[i].Utilisateur = _UtilisateurRepository.GetUtilisateurByRequete(Requetes[i].IdRequete);
                //Requetes[i].Activite.Projet = _ProjetRepository.GetProjetByActivite(Requetes[i].Activite.idActivite);
                tempIdTypeRequete = (int)Requetes[i].IdTypeRequete;
                Requetes[i].Montant = _RequeteRubriqueRepository.GetSommeRequeteRubriquesByRequete(Requetes[i].IdRequete);
                Requetes[i].TypeRequete = _TypeRequeteRepository.GetTypeRequeteById(tempIdTypeRequete);
                Requetes[i].RequeteAccuse = _RequeteAccuseRepository.GetRequeteAccuseByIdRequete(Requetes[i].IdRequete);
                if (Requetes[i].DateFinExecution != null)
                {
                    tempDate = (DateOnly)Requetes[i].DateFinExecution;
                    tempDelai = (int)Requetes[i].TypeRequete.DelaiJustification;
                    Requetes[i].DateFinEcheance = tempDate.AddDays(tempDelai);
                }
            }
            return Ok(Requetes);
        }

        /*------------------------------------------------------*/

        [HttpGet("cloturees/pages")]
        public async Task<IActionResult> GetNbPageCloturees()
        {
            int userId = 0;
            if (HttpContext.User.Claims.ToArray().Length != 0)
            {
                userId = int.Parse(HttpContext.User.Claims.ToArray()[0].Value);
            }

            if (userId == 0)
                return Unauthorized("Utilisateur non trouvé. Veuillez vérifier votre login!");

            int nbPage = _RequeteRepository.GetNbRequetesCloturees(userId);

            return Ok(nbPage);

        }

        [HttpGet("cloturees/word/{word}/pages")]
        public async Task<IActionResult> GetNbPageClotureesByWord(string word)
        {
            int userId = 0;
            if (HttpContext.User.Claims.ToArray().Length != 0)
            {
                userId = int.Parse(HttpContext.User.Claims.ToArray()[0].Value);
            }

            if (userId == 0)
                return Unauthorized("Utilisateur non trouvé. Veuillez vérifier votre login!");

            int nbPage = _RequeteRepository.GetNbRequetesClotureesByWord(userId,word);

            return Ok(nbPage);

        }

        [HttpGet("cloturees/page/{page}")]
        public IActionResult GetRequetesCloturees(int page)
        {
            int userId = 0;
            if (HttpContext.User.Claims.ToArray().Length != 0)
            {
                userId = int.Parse(HttpContext.User.Claims.ToArray()[0].Value);
            }

            if (userId == 0)
                return Unauthorized("Utilisateur non trouvé. Veuillez vérifier votre login!");
            DateOnly tempDate = new DateOnly();
            int tempIdTypeRequete = 0;
            int tempDelai = 0;
            List<Requete> Requetes = _RequeteRepository.GetRequetesclotureesByPage(userId,page);
            for (int i = 0; i < Requetes.Count(); i++)
            {
                Console.WriteLine(i);
                //Requetes[i].Activite = _ActiviteRepository.GetActivtieByRequete(Requetes[i].IdRequete);
                Requetes[i].Utilisateur = _UtilisateurRepository.GetUtilisateurByRequete(Requetes[i].IdRequete);
                //Requetes[i].Activite.Projet = _ProjetRepository.GetProjetByActivite(Requetes[i].Activite.idActivite);
                tempIdTypeRequete = (int)Requetes[i].IdTypeRequete;
                Requetes[i].Montant = _RequeteRubriqueRepository.GetSommeRequeteRubriquesByRequete(Requetes[i].IdRequete);
                Requetes[i].TypeRequete = _TypeRequeteRepository.GetTypeRequeteById(tempIdTypeRequete);
                if (Requetes[i].DateFinExecution != null)
                {
                    tempDate = (DateOnly)Requetes[i].DateFinExecution;
                    tempDelai = (int)Requetes[i].TypeRequete.DelaiJustification;
                    Requetes[i].DateFinEcheance = tempDate.AddDays(tempDelai);
                }
                Requetes[i].DateMinExec = DateOnly.FromDateTime((DateTime)Requetes[i].creationdate).AddDays(15);
                Requetes[i].Montant2 = (decimal)_RequeteRubriqueRepository.GetSommeRequeteRubriquesByRequete(Requetes[i].IdRequete);
                Console.WriteLine(Requetes[i].Montant2);
            }
            return Ok(Requetes);
        }

        [HttpGet("cloturees/word/{word}/page/{page}")]
        public IActionResult GetRequetesClotureesByWord(int page,string word)
        {
            int userId = 0;
            if (HttpContext.User.Claims.ToArray().Length != 0)
            {
                userId = int.Parse(HttpContext.User.Claims.ToArray()[0].Value);
            }

            if (userId == 0)
                return Unauthorized("Utilisateur non trouvé. Veuillez vérifier votre login!");
            DateOnly tempDate = new DateOnly();
            int tempIdTypeRequete = 0;
            int tempDelai = 0;
            List<Requete> Requetes = _RequeteRepository.GetRequetesclotureesByPageAndWord(userId,word, page);
            for (int i = 0; i < Requetes.Count(); i++)
            {
                Console.WriteLine(i);
                //Requetes[i].Activite = _ActiviteRepository.GetActivtieByRequete(Requetes[i].IdRequete);
                Requetes[i].Utilisateur = _UtilisateurRepository.GetUtilisateurByRequete(Requetes[i].IdRequete);
                //Requetes[i].Activite.Projet = _ProjetRepository.GetProjetByActivite(Requetes[i].Activite.idActivite);
                tempIdTypeRequete = (int)Requetes[i].IdTypeRequete;
                Requetes[i].Montant = _RequeteRubriqueRepository.GetSommeRequeteRubriquesByRequete(Requetes[i].IdRequete);
                Requetes[i].TypeRequete = _TypeRequeteRepository.GetTypeRequeteById(tempIdTypeRequete);
                if (Requetes[i].DateFinExecution != null)
                {
                    tempDate = (DateOnly)Requetes[i].DateFinExecution;
                    tempDelai = (int)Requetes[i].TypeRequete.DelaiJustification;
                    Requetes[i].DateFinEcheance = tempDate.AddDays(tempDelai);
                }
                Requetes[i].DateMinExec = DateOnly.FromDateTime((DateTime)Requetes[i].creationdate).AddDays(15);
                Requetes[i].Montant2 = (decimal)_RequeteRubriqueRepository.GetSommeRequeteRubriquesByRequete(Requetes[i].IdRequete);
                Console.WriteLine(Requetes[i].Montant2);
            }
            return Ok(Requetes);
        }
        /*---------------------------------------*/
        [HttpGet("refusees/pages")]
        public async Task<IActionResult> GetNbRequetesRefusees()
        {
            int userId = 0;
            if (HttpContext.User.Claims.ToArray().Length != 0)
            {
                userId = int.Parse(HttpContext.User.Claims.ToArray()[0].Value);
            }

            if (userId == 0)
                return Unauthorized("Utilisateur non trouvé. Veuillez vérifier votre login!");

            int nbPage = _RequeteRepository.GetNbRequetesRefusees(userId);

            return Ok(nbPage);

        }

        [HttpGet("refusees/word/{word}/pages")]
        public async Task<IActionResult> GetNbRequetesRefusees(string word)
        {
            int userId = 0;
            if (HttpContext.User.Claims.ToArray().Length != 0)
            {
                userId = int.Parse(HttpContext.User.Claims.ToArray()[0].Value);
            }

            if (userId == 0)
                return Unauthorized("Utilisateur non trouvé. Veuillez vérifier votre login!");

            int nbPage = _RequeteRepository.GetNbRequetesRefuseesByWord(userId, word);

            return Ok(nbPage);

        }

        [HttpGet("refusees")]
        public IActionResult GetRequetesRefusees()
        {
            int userId = 0;
            if (HttpContext.User.Claims.ToArray().Length != 0)
            {
                userId = int.Parse(HttpContext.User.Claims.ToArray()[0].Value);
            }

            if (userId == 0)
                return Unauthorized("Utilisateur non trouvé. Veuillez vérifier votre login!");
            DateOnly tempDate = new DateOnly();
            int tempIdTypeRequete = 0;
            int tempDelai = 0;
            List<Requete> Requetes = _RequeteRepository.GetRequetesRefusees(userId);
            for (int i = 0; i < Requetes.Count(); i++)
            {
                Console.WriteLine(i);
                //Requetes[i].Activite = _ActiviteRepository.GetActivtieByRequete(Requetes[i].IdRequete);
                Requetes[i].Utilisateur = _UtilisateurRepository.GetUtilisateurByRequete(Requetes[i].IdRequete);
                //Requetes[i].Activite.Projet = _ProjetRepository.GetProjetByActivite(Requetes[i].Activite.idActivite);
                tempIdTypeRequete = (int)Requetes[i].IdTypeRequete;
                Requetes[i].Montant = _RequeteRubriqueRepository.GetSommeRequeteRubriquesByRequete(Requetes[i].IdRequete);
                Requetes[i].TypeRequete = _TypeRequeteRepository.GetTypeRequeteById(tempIdTypeRequete);
                if (Requetes[i].DateFinExecution != null)
                {
                    tempDate = (DateOnly)Requetes[i].DateFinExecution;
                    tempDelai = (int)Requetes[i].TypeRequete.DelaiJustification;
                    Requetes[i].DateFinEcheance = tempDate.AddDays(tempDelai);
                }
                Requetes[i].DateMinExec = DateOnly.FromDateTime((DateTime)Requetes[i].creationdate).AddDays(15);
                Requetes[i].Montant2 = (decimal)_RequeteRubriqueRepository.GetSommeRequeteRubriquesByRequete(Requetes[i].IdRequete);
                Console.WriteLine(Requetes[i].Montant2);
            }
            return Ok(Requetes);
        }

        [HttpGet("refusees/page/{page}")]
        public IActionResult GetRequetesRefusees(int page)
        {
            int userId = 0;
            if (HttpContext.User.Claims.ToArray().Length != 0)
            {
                userId = int.Parse(HttpContext.User.Claims.ToArray()[0].Value);
            }

            if (userId == 0)
                return Unauthorized("Utilisateur non trouvé. Veuillez vérifier votre login!");
            DateOnly tempDate = new DateOnly();
            int tempIdTypeRequete = 0;
            int tempDelai = 0;
            List<Requete> Requetes = _RequeteRepository.GetRequetesRefuseesByPage(userId, page);
            for (int i = 0; i < Requetes.Count(); i++)
            {
                Console.WriteLine(i);
                //Requetes[i].Activite = _ActiviteRepository.GetActivtieByRequete(Requetes[i].IdRequete);
                Requetes[i].Utilisateur = _UtilisateurRepository.GetUtilisateurByRequete(Requetes[i].IdRequete);
                //Requetes[i].Activite.Projet = _ProjetRepository.GetProjetByActivite(Requetes[i].Activite.idActivite);
                tempIdTypeRequete = (int)Requetes[i].IdTypeRequete;
                Requetes[i].Montant = _RequeteRubriqueRepository.GetSommeRequeteRubriquesByRequete(Requetes[i].IdRequete);
                Requetes[i].TypeRequete = _TypeRequeteRepository.GetTypeRequeteById(tempIdTypeRequete);
                if (Requetes[i].DateFinExecution != null)
                {
                    tempDate = (DateOnly)Requetes[i].DateFinExecution;
                    tempDelai = (int)Requetes[i].TypeRequete.DelaiJustification;
                    Requetes[i].DateFinEcheance = tempDate.AddDays(tempDelai);
                }
                Requetes[i].DateMinExec = DateOnly.FromDateTime((DateTime)Requetes[i].creationdate).AddDays(15);
                Requetes[i].Montant2 = (decimal)_RequeteRubriqueRepository.GetSommeRequeteRubriquesByRequete(Requetes[i].IdRequete);
                Console.WriteLine(Requetes[i].Montant2);
            }
            return Ok(Requetes);
        }

        [HttpGet("refusees/word/{word}/page/{page}")]
        public IActionResult GetRequetesRefusees(int page, string word)
        {
            int userId = 0;
            if (HttpContext.User.Claims.ToArray().Length != 0)
            {
                userId = int.Parse(HttpContext.User.Claims.ToArray()[0].Value);
            }

            if (userId == 0)
                return Unauthorized("Utilisateur non trouvé. Veuillez vérifier votre login!");
            DateOnly tempDate = new DateOnly();
            int tempIdTypeRequete = 0;
            int tempDelai = 0;
            List<Requete> Requetes = _RequeteRepository.GetRequetesRefuseesByPageAndWord(userId, word, page);
            for (int i = 0; i < Requetes.Count(); i++)
            {
                Console.WriteLine(i);
                //Requetes[i].Activite = _ActiviteRepository.GetActivtieByRequete(Requetes[i].IdRequete);
                Requetes[i].Utilisateur = _UtilisateurRepository.GetUtilisateurByRequete(Requetes[i].IdRequete);
                //Requetes[i].Activite.Projet = _ProjetRepository.GetProjetByActivite(Requetes[i].Activite.idActivite);
                tempIdTypeRequete = (int)Requetes[i].IdTypeRequete;
                Requetes[i].Montant = _RequeteRubriqueRepository.GetSommeRequeteRubriquesByRequete(Requetes[i].IdRequete);
                Requetes[i].TypeRequete = _TypeRequeteRepository.GetTypeRequeteById(tempIdTypeRequete);
                if (Requetes[i].DateFinExecution != null)
                {
                    tempDate = (DateOnly)Requetes[i].DateFinExecution;
                    tempDelai = (int)Requetes[i].TypeRequete.DelaiJustification;
                    Requetes[i].DateFinEcheance = tempDate.AddDays(tempDelai);
                }
                Requetes[i].DateMinExec = DateOnly.FromDateTime((DateTime)Requetes[i].creationdate).AddDays(15);
                Requetes[i].Montant2 = (decimal)_RequeteRubriqueRepository.GetSommeRequeteRubriquesByRequete(Requetes[i].IdRequete);
                Console.WriteLine(Requetes[i].Montant2);
            }
            return Ok(Requetes);
        }

        /*------------------------------------------*/

        [HttpGet("validateur/refusees/pages")]
        public async Task<IActionResult> GetNbRequetesRefuseesValidateur()
        {
            int userId = 0;
            if (HttpContext.User.Claims.ToArray().Length != 0)
            {
                userId = int.Parse(HttpContext.User.Claims.ToArray()[0].Value);
            }

            if (userId == 0)
                return Unauthorized("Utilisateur non trouvé. Veuillez vérifier votre login!");

            int nbPage = _RequeteRepository.GetNbRequetesRefuseesValidateur(userId);

            return Ok(nbPage);

        }

        [HttpGet("validateur/refusees/word/{word}/pages")]
        public async Task<IActionResult> GetNbRequetesRefuseesValidateur(string word)
        {
            int userId = 0;
            if (HttpContext.User.Claims.ToArray().Length != 0)
            {
                userId = int.Parse(HttpContext.User.Claims.ToArray()[0].Value);
            }

            if (userId == 0)
                return Unauthorized("Utilisateur non trouvé. Veuillez vérifier votre login!");

            int nbPage = _RequeteRepository.GetNbRequetesRefuseesValidateurByWord(userId,word);

            return Ok(nbPage);

        }

        [HttpGet("validateur/refusees/page/{page}")]
        public IActionResult GetRequetesRefuseesValidateur(int page)
        {
            int userId = 0;
            if (HttpContext.User.Claims.ToArray().Length != 0)
            {
                userId = int.Parse(HttpContext.User.Claims.ToArray()[0].Value);
            }

            if (userId == 0)
                return Unauthorized("Utilisateur non trouvé. Veuillez vérifier votre login!");
            DateOnly tempDate = new DateOnly();
            int tempIdTypeRequete = 0;
            int tempDelai = 0;
            List<Requete> Requetes = _RequeteRepository.GetRequetesRefuseesValidateurByPage(userId,page);
            for (int i = 0; i < Requetes.Count(); i++)
            {
                Console.WriteLine(i);
                //Requetes[i].Activite = _ActiviteRepository.GetActivtieByRequete(Requetes[i].IdRequete);
                Requetes[i].Utilisateur = _UtilisateurRepository.GetUtilisateurByRequete(Requetes[i].IdRequete);
                //Requetes[i].Activite.Projet = _ProjetRepository.GetProjetByActivite(Requetes[i].Activite.idActivite);
                tempIdTypeRequete = (int)Requetes[i].IdTypeRequete;
                Requetes[i].Montant = _RequeteRubriqueRepository.GetSommeRequeteRubriquesByRequete(Requetes[i].IdRequete);
                Requetes[i].TypeRequete = _TypeRequeteRepository.GetTypeRequeteById(tempIdTypeRequete);
                if (Requetes[i].DateFinExecution != null)
                {
                    tempDate = (DateOnly)Requetes[i].DateFinExecution;
                    tempDelai = (int)Requetes[i].TypeRequete.DelaiJustification;
                    Requetes[i].DateFinEcheance = tempDate.AddDays(tempDelai);
                }
                Requetes[i].DateMinExec = DateOnly.FromDateTime((DateTime)Requetes[i].creationdate).AddDays(15);
                Requetes[i].Montant2 = (decimal)_RequeteRubriqueRepository.GetSommeRequeteRubriquesByRequete(Requetes[i].IdRequete);
                Console.WriteLine(Requetes[i].Montant2);
            }
            return Ok(Requetes);
        }

        [HttpGet("validateur/refusees/word/{word}/page/{page}")]
        public IActionResult GetRequetesRefuseesValidateur(int page,string word)
        {
            int userId = 0;
            if (HttpContext.User.Claims.ToArray().Length != 0)
            {
                userId = int.Parse(HttpContext.User.Claims.ToArray()[0].Value);
            }

            if (userId == 0)
                return Unauthorized("Utilisateur non trouvé. Veuillez vérifier votre login!");
            DateOnly tempDate = new DateOnly();
            int tempIdTypeRequete = 0;
            int tempDelai = 0;
            List<Requete> Requetes = _RequeteRepository.GetRequetesRefuseesValidateurByPageAndWord(userId,word, page);
            for (int i = 0; i < Requetes.Count(); i++)
            {
                Console.WriteLine(i);
                //Requetes[i].Activite = _ActiviteRepository.GetActivtieByRequete(Requetes[i].IdRequete);
                Requetes[i].Utilisateur = _UtilisateurRepository.GetUtilisateurByRequete(Requetes[i].IdRequete);
                //Requetes[i].Activite.Projet = _ProjetRepository.GetProjetByActivite(Requetes[i].Activite.idActivite);
                tempIdTypeRequete = (int)Requetes[i].IdTypeRequete;
                Requetes[i].Montant = _RequeteRubriqueRepository.GetSommeRequeteRubriquesByRequete(Requetes[i].IdRequete);
                Requetes[i].TypeRequete = _TypeRequeteRepository.GetTypeRequeteById(tempIdTypeRequete);
                if (Requetes[i].DateFinExecution != null)
                {
                    tempDate = (DateOnly)Requetes[i].DateFinExecution;
                    tempDelai = (int)Requetes[i].TypeRequete.DelaiJustification;
                    Requetes[i].DateFinEcheance = tempDate.AddDays(tempDelai);
                }
                Requetes[i].DateMinExec = DateOnly.FromDateTime((DateTime)Requetes[i].creationdate).AddDays(15);
                Requetes[i].Montant2 = (decimal)_RequeteRubriqueRepository.GetSommeRequeteRubriquesByRequete(Requetes[i].IdRequete);
                Console.WriteLine(Requetes[i].Montant2);
            }
            return Ok(Requetes);
        }

        /*---------------------------------------*/

        [HttpGet("admin/refusees/pages")]
        public async Task<IActionResult> GetNbRequetesRefuseesAdmin()
        {
            int userId = 0;
            if (HttpContext.User.Claims.ToArray().Length != 0)
            {
                userId = int.Parse(HttpContext.User.Claims.ToArray()[0].Value);
            }

            if (userId == 0)
                return Unauthorized("Utilisateur non trouvé. Veuillez vérifier votre login!");

            int nbPage = _RequeteRepository.GetNbRequetesRefuseesAdmin(userId);

            return Ok(nbPage);

        }

        [HttpGet("admin/refusees/word/{word}/pages")]
        public async Task<IActionResult> GetNbRequetesRefuseesAdmin(string word)
        {
            int userId = 0;
            if (HttpContext.User.Claims.ToArray().Length != 0)
            {
                userId = int.Parse(HttpContext.User.Claims.ToArray()[0].Value);
            }

            if (userId == 0)
                return Unauthorized("Utilisateur non trouvé. Veuillez vérifier votre login!");

            int nbPage = _RequeteRepository.GetNbRequetesRefuseesAdminByWord(userId, word);

            return Ok(nbPage);

        }

        [HttpGet("admin/refusees/page/{page}")]
        public IActionResult GetRequetesRefuseesAdmin(int page)
        {
            int userId = 0;
            if (HttpContext.User.Claims.ToArray().Length != 0)
            {
                userId = int.Parse(HttpContext.User.Claims.ToArray()[0].Value);
            }

            if (userId == 0)
                return Unauthorized("Utilisateur non trouvé. Veuillez vérifier votre login!");
            DateOnly tempDate = new DateOnly();
            int tempIdTypeRequete = 0;
            int tempDelai = 0;
            List<Requete> Requetes = _RequeteRepository.GetRequetesRefuseesAdminByPage(userId, page);
            for (int i = 0; i < Requetes.Count(); i++)
            {
                Console.WriteLine(i);
                //Requetes[i].Activite = _ActiviteRepository.GetActivtieByRequete(Requetes[i].IdRequete);
                Requetes[i].Utilisateur = _UtilisateurRepository.GetUtilisateurByRequete(Requetes[i].IdRequete);
                //Requetes[i].Activite.Projet = _ProjetRepository.GetProjetByActivite(Requetes[i].Activite.idActivite);
                tempIdTypeRequete = (int)Requetes[i].IdTypeRequete;
                Requetes[i].Montant = _RequeteRubriqueRepository.GetSommeRequeteRubriquesByRequete(Requetes[i].IdRequete);
                Requetes[i].TypeRequete = _TypeRequeteRepository.GetTypeRequeteById(tempIdTypeRequete);
                if (Requetes[i].DateFinExecution != null)
                {
                    tempDate = (DateOnly)Requetes[i].DateFinExecution;
                    tempDelai = (int)Requetes[i].TypeRequete.DelaiJustification;
                    Requetes[i].DateFinEcheance = tempDate.AddDays(tempDelai);
                }
                Requetes[i].DateMinExec = DateOnly.FromDateTime((DateTime)Requetes[i].creationdate).AddDays(15);
                Requetes[i].Montant2 = (decimal)_RequeteRubriqueRepository.GetSommeRequeteRubriquesByRequete(Requetes[i].IdRequete);
                Console.WriteLine(Requetes[i].Montant2);
            }
            return Ok(Requetes);
        }

        [HttpGet("admin/refusees/word/{word}/page/{page}")]
        public IActionResult GetRequetesRefuseesAdmin(int page, string word)
        {
            int userId = 0;
            if (HttpContext.User.Claims.ToArray().Length != 0)
            {
                userId = int.Parse(HttpContext.User.Claims.ToArray()[0].Value);
            }

            if (userId == 0)
                return Unauthorized("Utilisateur non trouvé. Veuillez vérifier votre login!");
            DateOnly tempDate = new DateOnly();
            int tempIdTypeRequete = 0;
            int tempDelai = 0;
            List<Requete> Requetes = _RequeteRepository.GetRequetesRefuseesAdminByPageAndWord(userId, word, page);
            for (int i = 0; i < Requetes.Count(); i++)
            {
                Console.WriteLine(i);
                //Requetes[i].Activite = _ActiviteRepository.GetActivtieByRequete(Requetes[i].IdRequete);
                Requetes[i].Utilisateur = _UtilisateurRepository.GetUtilisateurByRequete(Requetes[i].IdRequete);
                //Requetes[i].Activite.Projet = _ProjetRepository.GetProjetByActivite(Requetes[i].Activite.idActivite);
                tempIdTypeRequete = (int)Requetes[i].IdTypeRequete;
                Requetes[i].Montant = _RequeteRubriqueRepository.GetSommeRequeteRubriquesByRequete(Requetes[i].IdRequete);
                Requetes[i].TypeRequete = _TypeRequeteRepository.GetTypeRequeteById(tempIdTypeRequete);
                if (Requetes[i].DateFinExecution != null)
                {
                    tempDate = (DateOnly)Requetes[i].DateFinExecution;
                    tempDelai = (int)Requetes[i].TypeRequete.DelaiJustification;
                    Requetes[i].DateFinEcheance = tempDate.AddDays(tempDelai);
                }
                Requetes[i].DateMinExec = DateOnly.FromDateTime((DateTime)Requetes[i].creationdate).AddDays(15);
                Requetes[i].Montant2 = (decimal)_RequeteRubriqueRepository.GetSommeRequeteRubriquesByRequete(Requetes[i].IdRequete);
                Console.WriteLine(Requetes[i].Montant2);
            }
            return Ok(Requetes);
        }

        /*---------------------------------------*/

        [HttpGet("validateur/cloturees/pages")]
        public async Task<IActionResult> GetRequetesClotureesValidateur()
        {
            int userId = 0;
            if (HttpContext.User.Claims.ToArray().Length != 0)
            {
                userId = int.Parse(HttpContext.User.Claims.ToArray()[0].Value);
            }

            if (userId == 0)
                return Unauthorized("Utilisateur non trouvé. Veuillez vérifier votre login!");

            int nbPage = _RequeteRepository.GetNbRequetesClotureesValidateur(userId);

            return Ok(nbPage);

        }

        [HttpGet("validateur/cloturees/word/{word}/pages")]
        public async Task<IActionResult> GetRequetesClotureesValidateurByWord(string word)
        {
            int userId = 0;
            if (HttpContext.User.Claims.ToArray().Length != 0)
            {
                userId = int.Parse(HttpContext.User.Claims.ToArray()[0].Value);
            }

            if (userId == 0)
                return Unauthorized("Utilisateur non trouvé. Veuillez vérifier votre login!");

            int nbPage = _RequeteRepository.GetNbRequetesClotureesValidateurByWord(userId,word);

            return Ok(nbPage);

        }

        [HttpGet("validateur/cloturees/page/{page}")]
        public IActionResult GetNbRequetesClotureesValidateur(int page)
        {
            int userId = 0;
            if (HttpContext.User.Claims.ToArray().Length != 0)
            {
                userId = int.Parse(HttpContext.User.Claims.ToArray()[0].Value);
            }

            if (userId == 0)
                return Unauthorized("Utilisateur non trouvé. Veuillez vérifier votre login!");
            DateOnly tempDate = new DateOnly();
            int tempIdTypeRequete = 0;
            int tempDelai = 0;
            List<Requete> Requetes = _RequeteRepository.GetRequetesClotureesValidateurByPage(userId,page);
            for (int i = 0; i < Requetes.Count(); i++)
            {
                Console.WriteLine(i);
                //Requetes[i].Activite = _ActiviteRepository.GetActivtieByRequete(Requetes[i].IdRequete);
                Requetes[i].Utilisateur = _UtilisateurRepository.GetUtilisateurByRequete(Requetes[i].IdRequete);
                //Requetes[i].Activite.Projet = _ProjetRepository.GetProjetByActivite(Requetes[i].Activite.idActivite);
                tempIdTypeRequete = (int)Requetes[i].IdTypeRequete;
                Requetes[i].Montant = _RequeteRubriqueRepository.GetSommeRequeteRubriquesByRequete(Requetes[i].IdRequete);
                Requetes[i].TypeRequete = _TypeRequeteRepository.GetTypeRequeteById(tempIdTypeRequete);
                if (Requetes[i].DateFinExecution != null)
                {
                    tempDate = (DateOnly)Requetes[i].DateFinExecution;
                    tempDelai = (int)Requetes[i].TypeRequete.DelaiJustification;
                    Requetes[i].DateFinEcheance = tempDate.AddDays(tempDelai);
                }
                Requetes[i].DateMinExec = DateOnly.FromDateTime((DateTime)Requetes[i].creationdate).AddDays(15);
                Requetes[i].Montant2 = (decimal)_RequeteRubriqueRepository.GetSommeRequeteRubriquesByRequete(Requetes[i].IdRequete);
                Console.WriteLine(Requetes[i].Montant2);
            }
            return Ok(Requetes);
        }

        [HttpGet("validateur/cloturees/word/{word}/page/{page}")]
        public IActionResult GetNbRequetesClotureesValidateur(int page,string word)
        {
            int userId = 0;
            if (HttpContext.User.Claims.ToArray().Length != 0)
            {
                userId = int.Parse(HttpContext.User.Claims.ToArray()[0].Value);
            }

            if (userId == 0)
                return Unauthorized("Utilisateur non trouvé. Veuillez vérifier votre login!");
            DateOnly tempDate = new DateOnly();
            int tempIdTypeRequete = 0;
            int tempDelai = 0;
            List<Requete> Requetes = _RequeteRepository.GetRequetesClotureesValidateurByPageAndWord(userId,word, page);
            for (int i = 0; i < Requetes.Count(); i++)
            {
                Console.WriteLine(i);
                //Requetes[i].Activite = _ActiviteRepository.GetActivtieByRequete(Requetes[i].IdRequete);
                Requetes[i].Utilisateur = _UtilisateurRepository.GetUtilisateurByRequete(Requetes[i].IdRequete);
                //Requetes[i].Activite.Projet = _ProjetRepository.GetProjetByActivite(Requetes[i].Activite.idActivite);
                tempIdTypeRequete = (int)Requetes[i].IdTypeRequete;
                Requetes[i].Montant = _RequeteRubriqueRepository.GetSommeRequeteRubriquesByRequete(Requetes[i].IdRequete);
                Requetes[i].TypeRequete = _TypeRequeteRepository.GetTypeRequeteById(tempIdTypeRequete);
                if (Requetes[i].DateFinExecution != null)
                {
                    tempDate = (DateOnly)Requetes[i].DateFinExecution;
                    tempDelai = (int)Requetes[i].TypeRequete.DelaiJustification;
                    Requetes[i].DateFinEcheance = tempDate.AddDays(tempDelai);
                }
                Requetes[i].DateMinExec = DateOnly.FromDateTime((DateTime)Requetes[i].creationdate).AddDays(15);
                Requetes[i].Montant2 = (decimal)_RequeteRubriqueRepository.GetSommeRequeteRubriquesByRequete(Requetes[i].IdRequete);
                Console.WriteLine(Requetes[i].Montant2);
            }
            return Ok(Requetes);
        }

        /*-----------------------------------------------*/

        [HttpGet("admin/cloturees/pages")]
        public async Task<IActionResult> GetRequetesClotureesAdmin()
        {
            int userId = 0;
            if (HttpContext.User.Claims.ToArray().Length != 0)
            {
                userId = int.Parse(HttpContext.User.Claims.ToArray()[0].Value);
            }

            if (userId == 0)
                return Unauthorized("Utilisateur non trouvé. Veuillez vérifier votre login!");

            int nbPage = _RequeteRepository.GetNbRequetesClotureesAdmin(userId);

            return Ok(nbPage);

        }

        [HttpGet("admin/cloturees/word/{word}/pages")]
        public async Task<IActionResult> GetRequetesClotureesAdminByWord(string word)
        {
            int userId = 0;
            if (HttpContext.User.Claims.ToArray().Length != 0)
            {
                userId = int.Parse(HttpContext.User.Claims.ToArray()[0].Value);
            }

            if (userId == 0)
                return Unauthorized("Utilisateur non trouvé. Veuillez vérifier votre login!");

            int nbPage = _RequeteRepository.GetNbRequetesClotureesAdminByWord(userId, word);

            return Ok(nbPage);

        }

        [HttpGet("admin/cloturees/page/{page}")]
        public IActionResult GetNbRequetesClotureesAdmin(int page)
        {
            int userId = 0;
            if (HttpContext.User.Claims.ToArray().Length != 0)
            {
                userId = int.Parse(HttpContext.User.Claims.ToArray()[0].Value);
            }

            if (userId == 0)
                return Unauthorized("Utilisateur non trouvé. Veuillez vérifier votre login!");
            DateOnly tempDate = new DateOnly();
            int tempIdTypeRequete = 0;
            int tempDelai = 0;
            List<Requete> Requetes = _RequeteRepository.GetRequetesClotureesAdminByPage(userId, page);
            for (int i = 0; i < Requetes.Count(); i++)
            {
                Console.WriteLine(i);
                //Requetes[i].Activite = _ActiviteRepository.GetActivtieByRequete(Requetes[i].IdRequete);
                Requetes[i].Utilisateur = _UtilisateurRepository.GetUtilisateurByRequete(Requetes[i].IdRequete);
                //Requetes[i].Activite.Projet = _ProjetRepository.GetProjetByActivite(Requetes[i].Activite.idActivite);
                tempIdTypeRequete = (int)Requetes[i].IdTypeRequete;
                Requetes[i].Montant = _RequeteRubriqueRepository.GetSommeRequeteRubriquesByRequete(Requetes[i].IdRequete);
                Requetes[i].TypeRequete = _TypeRequeteRepository.GetTypeRequeteById(tempIdTypeRequete);
                if (Requetes[i].DateFinExecution != null)
                {
                    tempDate = (DateOnly)Requetes[i].DateFinExecution;
                    tempDelai = (int)Requetes[i].TypeRequete.DelaiJustification;
                    Requetes[i].DateFinEcheance = tempDate.AddDays(tempDelai);
                }
                Requetes[i].DateMinExec = DateOnly.FromDateTime((DateTime)Requetes[i].creationdate).AddDays(15);
                Requetes[i].Montant2 = (decimal)_RequeteRubriqueRepository.GetSommeRequeteRubriquesByRequete(Requetes[i].IdRequete);
                Console.WriteLine(Requetes[i].Montant2);
            }
            return Ok(Requetes);
        }

        [HttpGet("admin/cloturees/word/{word}/page/{page}")]
        public IActionResult GetNbRequetesClotureesAdmin(int page, string word)
        {
            int userId = 0;
            if (HttpContext.User.Claims.ToArray().Length != 0)
            {
                userId = int.Parse(HttpContext.User.Claims.ToArray()[0].Value);
            }

            if (userId == 0)
                return Unauthorized("Utilisateur non trouvé. Veuillez vérifier votre login!");
            DateOnly tempDate = new DateOnly();
            int tempIdTypeRequete = 0;
            int tempDelai = 0;
            List<Requete> Requetes = _RequeteRepository.GetRequetesClotureesAdminByPageAndWord(userId, word, page);
            for (int i = 0; i < Requetes.Count(); i++)
            {
                Console.WriteLine(i);
                //Requetes[i].Activite = _ActiviteRepository.GetActivtieByRequete(Requetes[i].IdRequete);
                Requetes[i].Utilisateur = _UtilisateurRepository.GetUtilisateurByRequete(Requetes[i].IdRequete);
                //Requetes[i].Activite.Projet = _ProjetRepository.GetProjetByActivite(Requetes[i].Activite.idActivite);
                tempIdTypeRequete = (int)Requetes[i].IdTypeRequete;
                Requetes[i].Montant = _RequeteRubriqueRepository.GetSommeRequeteRubriquesByRequete(Requetes[i].IdRequete);
                Requetes[i].TypeRequete = _TypeRequeteRepository.GetTypeRequeteById(tempIdTypeRequete);
                if (Requetes[i].DateFinExecution != null)
                {
                    tempDate = (DateOnly)Requetes[i].DateFinExecution;
                    tempDelai = (int)Requetes[i].TypeRequete.DelaiJustification;
                    Requetes[i].DateFinEcheance = tempDate.AddDays(tempDelai);
                }
                Requetes[i].DateMinExec = DateOnly.FromDateTime((DateTime)Requetes[i].creationdate).AddDays(15);
                Requetes[i].Montant2 = (decimal)_RequeteRubriqueRepository.GetSommeRequeteRubriquesByRequete(Requetes[i].IdRequete);
                Console.WriteLine(Requetes[i].Montant2);
            }
            return Ok(Requetes);
        }

        /*-----------------------------------------------*/

        [HttpPost("cloturer/{idRequete}")]
        public IActionResult cloturer(int idRequete)
        {
            int userId = 0;
            if (HttpContext.User.Claims.ToArray().Length != 0)
            {
                userId = int.Parse(HttpContext.User.Claims.ToArray()[0].Value);
            }

            if (userId == 0)
                return Unauthorized("Utilisateur non trouvé. Veuillez vérifier votre login!");
        
            Requete Requete = _RequeteRepository.GetRequeteByIdCustom(idRequete);
            Requete.clotureby = userId;
            Requete.cloturedate = DateTime.Now;
            _RequeteRepository.UpdateRequete(Requete);
            _TraitementRequeteRepository.NotifierCloturation(Requete);
            return Ok("Requete cloturée");
        }

        [HttpGet("{id}")]
        public IActionResult GetRequete(int id)
        {
            Requete Requete = _RequeteRepository.GetRequeteById(id);
            return Ok(Requete);
        }

        [HttpPost]
        public IActionResult CreateRequete([FromBody] RequeteData RequeteData)
        {
            var claim = HttpContext.User.Claims.FirstOrDefault(x => x.Type == "Id");
            if (claim == null) { 
                return Unauthorized("Utilisateur non trouvé. Veuillez vérifier votre login!");
            }
            //Verify unique numRequete
            if (_RequeteRepository.ExistsByNumRequete(RequeteData.NumRequete))
            {
                return BadRequest($"Le numéro de requête '{RequeteData.NumRequete}' existe déjà.");
            }
            TypeRequete typeRequete = _TypeRequeteRepository.GetFirstTypeRequete();
            Requete requete = new Requete();
            //requete.CodeActiviteTom = RequeteData.ActiviteTom.Split("-")[0];
            //requete.IntituleActiviteTom = RequeteData.ActiviteTom.Split("-")[1];
            requete.IdProjet = RequeteData.IdProjet;
            requete.IdSite = RequeteData.IdSite;
            requete.IdTypeRequete = typeRequete.IdTypeRequete;
            requete.Description = RequeteData.Description;
            requete.DateExecution = null;
            requete.DateFinExecution = null;
            requete.NumRequete = RequeteData.NumRequete;
            requete.NumActiviteInterne = RequeteData.NumActiviteInterne;
            requete.IntituleActiviteInterne = RequeteData.IntituleActiviteInterne;
            requete.IdUtilisateur = int.Parse(claim.Value);
            requete.Lieu = RequeteData.Lieu;
            requete.Objet = RequeteData.Objet;
            requete.Copie_a = RequeteData.Copie_a;
            requete.Compte_rendu = RequeteData.Compte_rendu;
            requete.PourInformations = RequeteData.PourInformations;
            requete.creationdate = DateTime.Now;
            requete.DateSoumission = RequeteData.DateSoumission;
            requete.NbRappel = 0;

            _RequeteRepository.AddRequete(requete);

            RequeteRubrique requeteRubrique = null;
            for (int i = 0; i < RequeteData.RequeteRubriques.Count(); i++)
            {
                requeteRubrique = new RequeteRubrique();
                requeteRubrique.IdRequete = requete.IdRequete;
                requeteRubrique.IdRubrique = RequeteData.RequeteRubriques[i].IdRubrique;
                requeteRubrique.IdTypeRubrique = RequeteData.RequeteRubriques[i].IdTypeRubrique;
                requeteRubrique.IdCategorieRubriqueColonne = RequeteData.RequeteRubriques[i].IdCategorieRubriqueColonne;
                requeteRubrique.Valeur = RequeteData.RequeteRubriques[i].Valeur;
                _RequeteRubriqueRepository.AddRequeteRubrique(requeteRubrique);
            }


            //rattachement automatique rubrique autres
            TypeRubrique TypeAutres = _TypeRubriqueRepository.GetTypeRubriqueAutres();
            Rubrique RubAutres = _RubriqueRepository.GetRubriqueAutres();

            CategorieRubrique CatAutres = _CategorieRubriqueRepository.GetCategorieAutres();
            CatAutres.CategorieRubriqueColonnes = _CategorieRubriqueColonneRepository.GetCategorieRubriqueColonnesByCategorie(CatAutres.IdCategorieRubrique);
            requeteRubrique = new RequeteRubrique();
            requeteRubrique.IdRequete = requete.IdRequete;
            requeteRubrique.IdRubrique = RubAutres.IdRubrique;
            requeteRubrique.IdTypeRubrique = TypeAutres.IdTypeRubrique;
            requeteRubrique.IdCategorieRubriqueColonne = CatAutres.CategorieRubriqueColonnes[0].IdCategorieRubriqueColonne;
            requeteRubrique.Valeur = "0";
            _RequeteRubriqueRepository.AddRequeteRubrique(requeteRubrique);

            double? montantRequete = _RequeteRubriqueRepository.GetSommeRequeteRubriquesByRequete(requete.IdRequete);
            double? montantValideRequete = _RequeteRubriqueRepository.GetSommeRequeteRubriquesValideByRequete(requete.IdRequete);

            requete.Montant = montantRequete;
            requete.MontantValide = montantValideRequete;
            _RequeteRepository.UpdateRequete(requete);
            
            return Ok(requete);
        }

        [HttpPut("{idRequete}")]
        public IActionResult UpdateRequete([FromBody] RequeteData RequeteData,int idRequete)
        {
            var claim = HttpContext.User.Claims.FirstOrDefault(x => x.Type == "Id");
            if (claim == null)
            {
                return Unauthorized("Utilisateur non trouvé. Veuillez vérifier votre login!");
            }
            TypeRequete typeRequete = _TypeRequeteRepository.GetFirstTypeRequete();
            Requete requete = new Requete();
            //requete.CodeActiviteTom = RequeteData.ActiviteTom.Split("-")[0];
            //requete.IntituleActiviteTom = RequeteData.ActiviteTom.Split("-")[1];
            requete.IdProjet = RequeteData.IdProjet;
            requete.IdSite = RequeteData.IdSite;
            requete.IdTypeRequete = typeRequete.IdTypeRequete;
            requete.Description = RequeteData.Description;
            requete.DateExecution = null;
            requete.DateFinExecution = null;
            requete.NumRequete = RequeteData.NumRequete;
            requete.NumActiviteInterne = RequeteData.NumActiviteInterne;
            requete.IntituleActiviteInterne = RequeteData.IntituleActiviteInterne;
            requete.IdUtilisateur = int.Parse(claim.Value);
            requete.Lieu = RequeteData.Lieu;
            requete.Objet = RequeteData.Objet;
            requete.Copie_a = RequeteData.Copie_a;
            requete.Compte_rendu = RequeteData.Compte_rendu;
            requete.PourInformations = RequeteData.PourInformations;
            requete.DateSoumission = RequeteData.DateSoumission;
            requete.creationdate = DateTime.Now;

            requete.IdRequete = idRequete;
            _RequeteRepository.UpdateRequete(requete);

            _RequeteRubriqueRepository.DeleteRequeteRubriquesOfRequete(idRequete);

            RequeteRubrique requeteRubrique = null;
            for (int i = 0; i < RequeteData.RequeteRubriques.Count(); i++)
            {
                requeteRubrique = new RequeteRubrique();
                requeteRubrique.IdRequete = requete.IdRequete;
                requeteRubrique.IdRubrique = RequeteData.RequeteRubriques[i].IdRubrique;
                requeteRubrique.IdTypeRubrique = RequeteData.RequeteRubriques [i].IdTypeRubrique;
                requeteRubrique.IdCategorieRubriqueColonne = RequeteData.RequeteRubriques[i].IdCategorieRubriqueColonne;
                requeteRubrique.Valeur = RequeteData.RequeteRubriques[i].Valeur;
                _RequeteRubriqueRepository.AddRequeteRubrique(requeteRubrique);
            }


            //rattachement automatique rubrique autres
            Rubrique RubAutres = _RubriqueRepository.GetRubriqueAutres();

            TypeRubrique TypeAutres = _TypeRubriqueRepository.GetTypeRubriqueAutres();
            CategorieRubrique CatAutres = _CategorieRubriqueRepository.GetCategorieAutres();
            CatAutres.CategorieRubriqueColonnes = _CategorieRubriqueColonneRepository.GetCategorieRubriqueColonnesByCategorie(CatAutres.IdCategorieRubrique);
            requeteRubrique = new RequeteRubrique();
            requeteRubrique.IdRequete = requete.IdRequete;
            requeteRubrique.IdRubrique = RubAutres.IdRubrique;
            requeteRubrique.IdTypeRubrique = TypeAutres.IdTypeRubrique;
            requeteRubrique.IdCategorieRubriqueColonne = CatAutres.CategorieRubriqueColonnes[0].IdCategorieRubriqueColonne;
            requeteRubrique.Valeur = "0";
            _RequeteRubriqueRepository.AddRequeteRubrique(requeteRubrique);

            double? montantRequete = _RequeteRubriqueRepository.GetSommeRequeteRubriquesByRequete(requete.IdRequete);
            double? montantValideRequete = _RequeteRubriqueRepository.GetSommeRequeteRubriquesValideByRequete(requete.IdRequete);

            requete.Montant = montantRequete;
            requete.MontantValide = montantValideRequete;
            _RequeteRepository.UpdateRequete(requete);

            return Ok(requete);
        }

        [HttpPut("{idRequete}/date_execution/{DateExecution}/date_fin_execution/{DateFinExecution}")]
        public IActionResult UpdateRequeteDate(int idRequete,DateOnly DateExecution, DateOnly DateFinExecution)
        {
            var claim = HttpContext.User.Claims.FirstOrDefault(x => x.Type == "Id");
            if (claim == null)
            {
                return Unauthorized("Utilisateur non trouvé. Veuillez vérifier votre login!");
            }

            Requete r = _RequeteRepository.GetRequeteById(idRequete);

         

            r.DateExecution = DateExecution;
            r.DateFinExecution = DateFinExecution;

            _RequeteRepository.UpdateRequete(r);
            _RequeteRepository.UpdateManquePj(idRequete, false);
            return Ok("dates mise à jour");
        }

        [HttpPut]
        public IActionResult UpdateRequete([FromBody] Requete Requete)
        {
            _RequeteRepository.UpdateRequete(Requete);
            return Ok(Requete);
        }

        /*[HttpPut("{id}/activite/{activiteTOM}/numBudget/{numBudget}/exercice/{exercice}")]
        public IActionResult UpdateRequete( int id,string activiteTOM,int numBudget,int exercice)
        {
            
            Requete r = _RequeteRepository.GetRequeteById(id);



            r.CodeActiviteTom = activiteTOM.Split("-")[0];
            r.IntituleActiviteTom = activiteTOM.Split("-")[1];
            r.NumBudget = numBudget;
            r.Exercice = exercice;
            _RequeteRepository.UpdateRequete(r);

            return Ok("dates mise à jour");
        }*/

        [HttpPut("tompro/{id}")]
        public IActionResult UpdateRequete(int id, [FromBody] UpdateRequeteDto dto)
        {
            Requete r = _RequeteRepository.GetRequeteById(id);

            r.CodeActiviteTom = dto.ActiviteTOM.Split("-")[0];
            r.IntituleActiviteTom = dto.ActiviteTOM.Split("-")[1];
            r.NumBudget = dto.NumBudget;
            r.Exercice = dto.Exercice;

            _RequeteRepository.UpdateRequete(r);

            return Ok("dates mise à jour");
        }

        [HttpDelete("{id}")]
        public string DeleteRequete(int id)
        {
            _RequeteRepository.DeleteRequete(id);
            return "Requete deleted";
        }

        [HttpGet("details/{id}")]
        public IActionResult GetDetailsRequete(int id)
        {

            List<CategorieRubrique> CategorieRubriques = _CategorieRubriqueRepository.GetCategorieRubriquesOfRequete(id);
            for (int i = 0; i < CategorieRubriques.Count(); i++)
            {
                //Requetes[i].Activite = _ActiviteRepository.GetActivtieByRequete(Requetes[i].IdRequete);
                CategorieRubriques[i].CategorieRubriqueColonnes = _CategorieRubriqueColonneRepository.GetCategorieRubriqueColonnesByCategorie(CategorieRubriques[i].IdCategorieRubrique);
                CategorieRubriques[i].Rubriques = _RubriqueRepository.GetRubriquesByCategorieRubrique(CategorieRubriques[i].IdCategorieRubrique);
                for (int j= 0;j< CategorieRubriques[i].Rubriques.Count(); j++)
                {
                    Console.WriteLine("select * from getRequeteRubriquesOfRubriqueAndRequete(" + id + "," + CategorieRubriques[i].Rubriques[j].IdRubrique + "," + CategorieRubriques[i].IdCategorieRubrique + ")");
                    Console.WriteLine(i);
                    Console.WriteLine(j);

                    CategorieRubriques[i].Rubriques[j].RequeteRubriques = _RequeteRubriqueRepository.GetRequeteRubriquesByRequeteAndRubrique(id, CategorieRubriques[i].Rubriques[j].IdRubrique, CategorieRubriques[i].IdCategorieRubrique);
                }
                
            }
            return Ok(CategorieRubriques);
        }

        [HttpGet("details_rubrique_multiple/{id}")]
        public IActionResult GetDetailsRequeteRubriqueMultiple(int id)
        {
            int RedondanceRubrique = 0;
            int RedondanceRubriqueIndividuelle = 0;
            int RequeteRubriqueCount = 0;

            List<CategorieRubrique> CategorieRubriques = _CategorieRubriqueRepository.GetCategorieRubriquesOfRequete(id);
            for (int i = 0; i < CategorieRubriques.Count(); i++)
            {
                //Requetes[i].Activite = _ActiviteRepository.GetActivtieByRequete(Requetes[i].IdRequete);
                CategorieRubriques[i].CategorieRubriqueColonnes = _CategorieRubriqueColonneRepository.GetCategorieRubriqueColonnesByCategorie(CategorieRubriques[i].IdCategorieRubrique);
                CategorieRubriques[i].Rubriques = _RubriqueRepository.GetRubriquesByCategorieRubrique(CategorieRubriques[i].IdCategorieRubrique);
                for (int j = 0; j < CategorieRubriques[i].Rubriques.Count() - RedondanceRubrique; j++)
                {
                    Console.WriteLine("select * from getRequeteRubriquesOfRubriqueAndRequete(" + id + "," + CategorieRubriques[i].Rubriques[j].IdRubrique + "," + CategorieRubriques[i].IdCategorieRubrique + ")");
                    Console.WriteLine(i);
                    Console.WriteLine(j);

                    CategorieRubriques[i].Rubriques[j].RequeteRubriques = _RequeteRubriqueRepository.GetRequeteRubriquesByRequeteAndRubrique(id, CategorieRubriques[i].Rubriques[j].IdRubrique, CategorieRubriques[i].IdCategorieRubrique);
                    //manampy ze colonne tsy ampy 
                    CategorieRubriques[i].Rubriques[j].RequeteRubriques = Util.addMissingColumn(CategorieRubriques[i].Rubriques[j].RequeteRubriques, CategorieRubriques[i].CategorieRubriqueColonnes);

                    for (int l = 1; l < CategorieRubriques[i].Rubriques[j].RequeteRubriques.Count(); l++)
                    {
                        //mijery raha miverina indroa le colonne 
                        if (CategorieRubriques[i].Rubriques[j].RequeteRubriques[0].IdCategorieRubriqueColonne == CategorieRubriques[i].Rubriques[j].RequeteRubriques[l].IdCategorieRubriqueColonne  )
                        {

                            Console.WriteLine("redondance");
                            Console.WriteLine(CategorieRubriques[i].Rubriques[j].RequeteRubriques[0].IdCategorieRubriqueColonne);
                            Console.WriteLine(CategorieRubriques[i].Rubriques[j].RequeteRubriques[l].IdCategorieRubriqueColonne);
                            Console.WriteLine(l);
                            Console.WriteLine(CategorieRubriques[i].Rubriques[j].RequeteRubriques.Count());
                            RedondanceRubrique++;
                            RedondanceRubriqueIndividuelle++;
                            //apina rubrique

                            CategorieRubriques[i].Rubriques.Add(new Rubrique());
                            CategorieRubriques[i].Rubriques[CategorieRubriques[i].Rubriques.Count() - 1].IdRubrique = CategorieRubriques[i].Rubriques[j].IdRubrique;
                            CategorieRubriques[i].Rubriques[CategorieRubriques[i].Rubriques.Count() - 1].Nom = CategorieRubriques[i].Rubriques[j].Nom;
                            CategorieRubriques[i].Rubriques[CategorieRubriques[i].Rubriques.Count() - 1].RequeteRubriques = new List<RequeteRubrique>();

                            //mameno anle requeterubrique anle rubrique vao nampiana
                            for (int n = 0; n < CategorieRubriques[i].CategorieRubriqueColonnes.Count(); n++)
                            {
                                RequeteRubriqueCount++;
                                CategorieRubriques[i].Rubriques[CategorieRubriques[i].Rubriques.Count() - 1].RequeteRubriques.Add(new RequeteRubrique());
                                Console.WriteLine(RequeteRubriqueCount);
                                Console.WriteLine(CategorieRubriques[i].Rubriques[CategorieRubriques[i].Rubriques.Count() - 1].RequeteRubriques[RequeteRubriqueCount - 1].IdRequeteRubrique);
                                CategorieRubriques[i].Rubriques[CategorieRubriques[i].Rubriques.Count() - 1].RequeteRubriques[RequeteRubriqueCount - 1].IdRequeteRubrique = CategorieRubriques[i].Rubriques[j].RequeteRubriques[l + n].IdRequeteRubrique;
                                CategorieRubriques[i].Rubriques[CategorieRubriques[i].Rubriques.Count() - 1].RequeteRubriques[RequeteRubriqueCount - 1].IdRequete = CategorieRubriques[i].Rubriques[j].RequeteRubriques[l + n].IdRequete;
                                CategorieRubriques[i].Rubriques[CategorieRubriques[i].Rubriques.Count() - 1].RequeteRubriques[RequeteRubriqueCount - 1].IdTypeRubrique = CategorieRubriques[i].Rubriques[j].RequeteRubriques[l + n].IdTypeRubrique;
                                CategorieRubriques[i].Rubriques[CategorieRubriques[i].Rubriques.Count() - 1].RequeteRubriques[RequeteRubriqueCount - 1].IdCategorieRubriqueColonne = CategorieRubriques[i].Rubriques[j].RequeteRubriques[l + n].IdCategorieRubriqueColonne;
                                CategorieRubriques[i].Rubriques[CategorieRubriques[i].Rubriques.Count() - 1].RequeteRubriques[RequeteRubriqueCount - 1].Valeur = CategorieRubriques[i].Rubriques[j].RequeteRubriques[l + n].Valeur;
                                CategorieRubriques[i].Rubriques[CategorieRubriques[i].Rubriques.Count() - 1].RequeteRubriques[RequeteRubriqueCount - 1].IdRubrique = CategorieRubriques[i].Rubriques[j].RequeteRubriques[l + n].IdRubrique;
                            }
                            RequeteRubriqueCount = 0;
                        }
                    }
                    
                    if (RedondanceRubriqueIndividuelle != 0)
                    {
                        //manala anle requeterubriques fanampiny 
                        Console.WriteLine(CategorieRubriques[i].Rubriques[j].IdRubrique);
                        Console.WriteLine(CategorieRubriques[i].CategorieRubriqueColonnes.Count());
                        Console.WriteLine(CategorieRubriques[i].Rubriques[j].RequeteRubriques.Count());
                        Console.WriteLine(CategorieRubriques[i].CategorieRubriqueColonnes.Count());

                        CategorieRubriques[i].Rubriques[j].RequeteRubriques.RemoveRange(CategorieRubriques[i].CategorieRubriqueColonnes.Count(), CategorieRubriques[i].Rubriques[j].RequeteRubriques.Count() - CategorieRubriques[i].CategorieRubriqueColonnes.Count());
                    }
                    RedondanceRubriqueIndividuelle = 0;
                }
                RedondanceRubrique = 0;
            }
            return Ok(CategorieRubriques);
        }



        [HttpGet("{id}/recap_categories")]
        public IActionResult GetSommeCategoriesRequete(int id)
        {
            List<SommeCategorieRubriqueDTO> SommeCategorieRubriqueDTO = _CategorieRubriqueRepository.GetSommeCategorieRubriquesOfRequete(id);
           
            return Ok(SommeCategorieRubriqueDTO);
        }

        [HttpGet("etats")]
        public IActionResult getEtats()
        {
            int userId = 0;
            if (HttpContext.User.Claims.ToArray().Length != 0)
            {
                userId = int.Parse(HttpContext.User.Claims.ToArray()[0].Value);
            }

            if (userId == 0)
                return Unauthorized("Utilisateur non trouvé. Veuillez vérifier votre login!");

            int[] etats = new int[6];
            etats[0] = _RequeteRepository.GetNombreRequetesInitieesByUtilisateur(userId);
            etats[1] = _RequeteRepository.GetNombreRequetesValideesMinisteresByUtilisateur(userId);
            etats[2] = _RequeteRepository.GetNombreRequetesManquePjByUtilisateur(userId);
            etats[3] = _RequeteRepository.GetNombreRequetesEnCours(userId);
            etats[4] = _RequeteRepository.GetNombreRequetesCloturees(userId);
            etats[5] = _RequeteRepository.GetNombreRequetesAjustifier(userId);

            return Ok(etats);
        }



        [HttpGet("etats/validateur")]
        public IActionResult getEtatsValidateur()
        {
            int userId = 0;
            if (HttpContext.User.Claims.ToArray().Length != 0)
            {
                userId = int.Parse(HttpContext.User.Claims.ToArray()[0].Value);
            }

            if (userId == 0)
                return Unauthorized("Utilisateur non trouvé. Veuillez vérifier votre login!");

            int[] etats = new int[7];
            etats[0] = _RequeteRepository.GetNombreRequetesOfValidateur(userId);
            etats[1] = _RequeteRepository.GetNombrebRequetesPourValidation(userId);
            etats[2] = _RequeteRepository.GetNombreRequetesEnCoursCircuitValidateur(userId);
            etats[3] = _RequeteRepository.GetNombreRequetesRefuseesValidateur(userId);
            etats[4] = _RequeteRepository.GetNombreRequetesValidesValidateur(userId);
            etats[5] = _RequeteRepository.GetNombreRequetesACloturees(userId);
            etats[6] = _RequeteRepository.GetNombreRequetesClotureesValidateur(userId);

            return Ok(etats);
        }

        [HttpGet("etats/admin")]
        public IActionResult getEtatsAdmin()
        {
            int userId = 0;
            if (HttpContext.User.Claims.ToArray().Length != 0)
            {
                userId = int.Parse(HttpContext.User.Claims.ToArray()[0].Value);
            }

            if (userId == 0)
                return Unauthorized("Utilisateur non trouvé. Veuillez vérifier votre login!");

            int[] etats = new int[7];
            etats[0] = _RequeteRepository.GetNombreRequetesOfValidateur(userId);
            etats[1] = _RequeteRepository.GetNombrebRequetesPourValidation(userId);
            etats[2] = _RequeteRepository.GetNombreRequetesEnCoursCircuitAdmin(userId);
            etats[3] = _RequeteRepository.GetNombreRequetesRefuseesAdmin(userId);
            etats[4] = _RequeteRepository.GetNombreRequetesValidesAdmin(userId);
            etats[5] = _RequeteRepository.GetNombreRequetesAClotureesAdmin(userId);
            etats[6] = _RequeteRepository.GetNombreRequetesClotureesAdmin(userId);

            return Ok(etats);
        }
    }

    

}
