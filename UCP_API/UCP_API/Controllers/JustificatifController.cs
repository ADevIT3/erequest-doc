using Microsoft.AspNetCore.Mvc;
using Newtonsoft.Json;
using UCP_API.dto;
using UCP_API.models;
using UCP_API.repositories;
using UCP_API.utils;

namespace UCP_API.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class JustificatifController : ControllerBase
    {
        private readonly JustificatifRepository _JustificatifRepository;
        private readonly JustifDetailsRepository _JustifDetailsRepository;
        private readonly RubriqueRepository _RubriqueRepository;
        private readonly CategorieRubriqueRepository _CategorieRubriqueRepository;
        private readonly RequeteRubriqueRepository _RequeteRubriqueRepository;
        private readonly RequeteRepository _RequeteRepository;
        private readonly TypeRequeteRepository _TypeRequeteRepository;
        private readonly UtilisateurRepository _UtilisateurRepository;
        private readonly JustifPjRepository _JustifPjRepository;
        private readonly JustificatifAccuseRepository _JustificatifAccuseRepository;
        private readonly CircuitRepository _CircuitRepository;
        private readonly TraitementJustifRepository _TraitementJustifRepository;

        public JustificatifController(JustificatifRepository JustificatifRepository, JustifDetailsRepository justifDetailsRepository, RubriqueRepository RubriqueRepository, CategorieRubriqueRepository CategorieRubriqueRepository, RequeteRubriqueRepository RequeteRubriqueRepository, RequeteRepository RequeteRepository, TypeRequeteRepository typeRequeteRepository, UtilisateurRepository utilisateurRepository, JustifPjRepository JustifPjRepository, JustificatifAccuseRepository justificatifAccuseRepository, CircuitRepository circuitRepository, TraitementJustifRepository traitementJustifRepository)
        {
            _JustificatifRepository = JustificatifRepository;
            _JustifDetailsRepository = justifDetailsRepository;
            _RubriqueRepository = RubriqueRepository;
            _CategorieRubriqueRepository = CategorieRubriqueRepository;
            _RequeteRubriqueRepository = RequeteRubriqueRepository;
            _RequeteRepository = RequeteRepository;
            _TypeRequeteRepository = typeRequeteRepository;
            _UtilisateurRepository = utilisateurRepository;
            _JustifPjRepository = JustifPjRepository;
            _JustificatifAccuseRepository = justificatifAccuseRepository;
            _CircuitRepository = circuitRepository;
            _TraitementJustifRepository = traitementJustifRepository;
        }

        [HttpGet]
        public IActionResult GetAllJustificatifx()
        {
            List<Justificatif> Justificatifs = _JustificatifRepository.GetJustificatifs();
            return Ok(Justificatifs);
        }

        [HttpGet("{id}")]
        public IActionResult GetJustificatif(int id)
        {
            Justificatif Justificatif = _JustificatifRepository.GetJustificatifById(id);
            return Ok(Justificatif);
        }

        /* [HttpGet("requete/{idRequete}")]
         public IActionResult GetDetailsJustifRequete(int idRequete)
         {
             List<CategorieRubrique> CategorieRubriques = _CategorieRubriqueRepository.GetCategorieRubriquesOfRequete(idRequete);
             for (int i = 0; i < CategorieRubriques.Count(); i++)
             {
                 //Requetes[i].Activite = _ActiviteRepository.GetActivtieByRequete(Requetes[i].IdRequete);
                 //CategorieRubriques[i].CategorieRubriqueColonnes = _CategorieRubriqueColonneRepository.GetCategorieRubriqueColonnesByCategorie(CategorieRubriques[i].IdCategorieRubrique);
                 CategorieRubriques[i].Rubriques = _RubriqueRepository.GetRubriquesByCategorieAndRequete(idRequete,CategorieRubriques[i].IdCategorieRubrique);
                 for (int j = 0; j < CategorieRubriques[i].Rubriques.Count(); j++)
                 {
                     CategorieRubriques[i].Rubriques[j].Montant = _RequeteRubriqueRepository.GetTotalByRubriqueAndRequeteAndCategorie(CategorieRubriques[i].Rubriques[j].IdRubrique, CategorieRubriques[i].IdCategorieRubrique,idRequete);
                     CategorieRubriques[i].Rubriques[j].MontantJustifs = _JustifDetailsRepository.GetJustifDetailsByRequeteAndRubriqueAndCategorie(idRequete, CategorieRubriques[i].Rubriques[j].IdRubrique, CategorieRubriques[i].IdCategorieRubrique);
                     CategorieRubriques[i].Rubriques[j].CalculateReste();
                 }

             }
             return Ok(CategorieRubriques);
         }*/

        [HttpGet("requete/{idRequete}")]
        public IActionResult GetDetailsJustifRequete(int idRequete)
        {
            List<CategorieRubrique> CategorieRubriques = _CategorieRubriqueRepository.GetCategorieRubriquesOfRequete(idRequete);
            for (int i = 0; i < CategorieRubriques.Count(); i++)
            {
                //Requetes[i].Activite = _ActiviteRepository.GetActivtieByRequete(Requetes[i].IdRequete);
                //CategorieRubriques[i].CategorieRubriqueColonnes = _CategorieRubriqueColonneRepository.GetCategorieRubriqueColonnesByCategorie(CategorieRubriques[i].IdCategorieRubrique);
                CategorieRubriques[i].Rubriques = _RubriqueRepository.GetRubriquesByCategorieAndRequete(idRequete, CategorieRubriques[i].IdCategorieRubrique);
                for (int j = 0; j < CategorieRubriques[i].Rubriques.Count(); j++)
                {
                    CategorieRubriques[i].Montant = _CategorieRubriqueRepository.GetTotalByRubriqueAndCategorie(CategorieRubriques[i].IdCategorieRubrique, idRequete);
                    CategorieRubriques[i].MontantJustifs = _JustifDetailsRepository.GetJustifDetailsByRequeteAndCategorie(idRequete, CategorieRubriques[i].IdCategorieRubrique);
                    CategorieRubriques[i].CalculateReste();
                }

            }
            return Ok(CategorieRubriques);
        }

        [HttpGet("nbjustif/requete/{idRequete}")]
        public IActionResult GetNBJustifRequete(int idRequete)
        {
            int? CategorieRubriques = _JustificatifRepository.GetNbJustificatif(idRequete);
           
            return Ok(CategorieRubriques);
        }

        [HttpPost]
        public IActionResult CreateJustificatif([FromForm] string justificatifstring, [FromForm] IFormFile[] justificatifs)
        {
            JustificatifDTO Justificatif = JsonConvert.DeserializeObject<JustificatifDTO>(justificatifstring);
            //verification justification unique
            Requete r = _RequeteRepository.GetRequeteById(Justificatif.IdRequete);

            double montantRequete = (double)_RequeteRepository.GetMontantTotal(Justificatif.IdRequete);
            // Boolean result = Util.checkMontantJustif(montantRequete,Justificatif.Details);
            Boolean result = true;
            if (result == true)
            {


                int userId = 0;
                if (HttpContext.User.Claims.ToArray().Length != 0)
                {
                    userId = int.Parse(HttpContext.User.Claims.ToArray()[0].Value);
                }

                if (userId == 0)
                    return Unauthorized("Utilisateur non trouvé. Veuillez vérifier votre login!");

                Justificatif j = new Justificatif();
                j.IdRequete = Justificatif.IdRequete;
                j.Numero = r.NumBr;
                j.CreationDate = DateTime.Now;
                j.EtatValidation = Justificatif.EtatValidation;
                j.Objet = Justificatif.Objet;
                j.IdUtilisateur = userId;
                j.ManquePj = false;
                _JustificatifRepository.AddJustificatif(j);

                List<JustifDetails> jds = new List<JustifDetails>();
                int current_index = 0;
                for (int i = 0; i < Justificatif.Details.Count(); i++)
                {
                    jds.Add(new JustifDetails());
                    current_index = jds.Count() - 1;

                    jds[current_index].IdJustif = j.IdJustif;
                    jds[current_index].IdCategorieRubrique = Justificatif.Details[i].IdCategorieRubrique;
                    //jds[current_index].IdRubrique = Justificatif.Details[i].IdRubrique;
                    jds[current_index].Montant = Justificatif.Details[i].Montant;
                    jds[current_index].MontantValide = Justificatif.Details[i].Montant;
                    jds[current_index].Commentaire = Justificatif.Details[i].Commentaire; //Add comment
                    _JustifDetailsRepository.AddJustifDetails(jds[current_index]);
                }

                double montantJustif = 0;
                for (int i = 0; i < Justificatif.Details.Count(); i++)
                {
                    montantJustif = montantJustif + Justificatif.Details[i].Montant;
                }
                j.Montant = montantJustif;
                j.MontantValide = montantJustif;
                _JustificatifRepository.UpdateJustificatif(j);

                //pjs
                string folderPath = ".\\wwwroot\\Stockages\\justificatifs";
                string fileName = ""; // e.g. "resume.pdf"
                string fullPath = "";
                Boolean isFileCreated = false;
                for (int i = 0; i < justificatifs.Length; i++)
                {
                    fileName = Path.GetFileName(justificatifs[i].FileName); // e.g. "resume.pdf"
                    fullPath = Path.Combine(folderPath, fileName);

                    isFileCreated = FileUtil.SaveFile(justificatifs[i], fullPath);
                    if (isFileCreated == true)
                    {
                        JustifPj rj = new JustifPj();
                        rj.IdJustif = j.IdJustif;
                        rj.Src = fullPath;
                        rj.DateCreation = DateTime.Now;

                        _JustifPjRepository.AddJustifPj(rj);
                    }
                }

                /*}*/
                return Ok("Justificatif enregistré avec succès");



            }
            else
            {
                return Ok("Montant de la requête non atteint");
            }
        }


        [HttpPut]
        public IActionResult UpdateJustificatif([FromBody] Justificatif Justificatif)
        {
            _JustificatifRepository.UpdateJustificatif(Justificatif);
            return Ok(Justificatif);
        }

        [HttpDelete("{id}")]
        public string DeleteJustificatif(int id)
        {
            _JustificatifRepository.DeleteJustificatif(id);
            return "Justificatif deleted";
        }
        /*-------------------------------*/
        [HttpGet("initiees/pages")]
        public IActionResult GetNbJustifInitiesByUtilisateur()
        {
            int userId = 0;
            if (HttpContext.User.Claims.ToArray().Length != 0)
            {
                userId = int.Parse(HttpContext.User.Claims.ToArray()[0].Value);
            }

            if (userId == 0)
                return Unauthorized("Utilisateur non trouvé. Veuillez vérifier votre login!");

            int nbPage = _JustificatifRepository.GetNbJustifsInitieesByUtilisateur(userId);

            return Ok(nbPage);

        }

        [HttpGet("initiees/word/{word}/pages")]
        public IActionResult GetNbJustifInitiesByUtilisateur(string word)
        {
            int userId = 0;
            if (HttpContext.User.Claims.ToArray().Length != 0)
            {
                userId = int.Parse(HttpContext.User.Claims.ToArray()[0].Value);
            }

            if (userId == 0)
                return Unauthorized("Utilisateur non trouvé. Veuillez vérifier votre login!");

            int nbPage = _JustificatifRepository.GetNbJustifsInitieesByUtilisateurByWord(userId,word);

            return Ok(nbPage);

        }

        [HttpGet("initiees/page/{page}")]
        public IActionResult GetJustifInitiesByUtilisatueur(int page)
        {
            int userId = 0;
            if (HttpContext.User.Claims.ToArray().Length != 0)
            {
                userId = int.Parse(HttpContext.User.Claims.ToArray()[0].Value);
            }

            if (userId == 0)
                return Unauthorized("Utilisateur non trouvé. Veuillez vérifier votre login!");

            List<Justificatif> Justificatifs = _JustificatifRepository.GetJustifsInitieesByUtilisateurByPage(userId,page);
            for (int i = 0; i < Justificatifs.Count(); i++)
            {
                Console.WriteLine("MONTANT");
                Console.WriteLine(Justificatifs[i].Montant);
                Console.WriteLine(i);
                Justificatifs[i].Utilisateur = _UtilisateurRepository.GetUtilisateurByRequete(Justificatifs[i].Requete.IdRequete);
                //Requetes[i].Activite = _ActiviteRepository.GetActivtieByRequete(Requetes[i].IdRequete);
                //Requetes[i].Activite.Projet = _ProjetRepository.GetProjetByActivite(Requetes[i].Activite.idActivite);
                Justificatifs[i].Requete.Montant = _RequeteRubriqueRepository.GetSommeRequeteRubriquesByRequete(Justificatifs[i].Requete.IdRequete);
                Justificatifs[i].Requete.TypeRequete = _TypeRequeteRepository.GetTypeRequeteById((int) Justificatifs[i].Requete.IdTypeRequete);
                Justificatifs[i].Requete.initiateDateFinEcheance();
            }
            return Ok(Justificatifs);
        }

        [HttpGet("initiees/word/{word}/page/{page}")]
        public IActionResult GetJustifInitiesByUtilisatueur(int page,string word)
        {
            int userId = 0;
            if (HttpContext.User.Claims.ToArray().Length != 0)
            {
                userId = int.Parse(HttpContext.User.Claims.ToArray()[0].Value);
            }

            if (userId == 0)
                return Unauthorized("Utilisateur non trouvé. Veuillez vérifier votre login!");

            List<Justificatif> Justificatifs = _JustificatifRepository.GetJustifsInitieesByUtilisateurByPageAndWord(userId,word, page);
            
            for (int i = 0; i < Justificatifs.Count(); i++)
            {
                Console.WriteLine("MONTANT");
                Console.WriteLine(Justificatifs[i].Montant);
                Justificatifs[i].Utilisateur = _UtilisateurRepository.GetUtilisateurByRequete(Justificatifs[i].Requete.IdRequete);
                //Requetes[i].Activite = _ActiviteRepository.GetActivtieByRequete(Requetes[i].IdRequete);
                //Requetes[i].Activite.Projet = _ProjetRepository.GetProjetByActivite(Requetes[i].Activite.idActivite);
                Justificatifs[i].Requete.Montant = _RequeteRubriqueRepository.GetSommeRequeteRubriquesByRequete(Justificatifs[i].Requete.IdRequete);
                Justificatifs[i].Requete.TypeRequete = _TypeRequeteRepository.GetTypeRequeteById((int)Justificatifs[i].Requete.IdTypeRequete);
                Justificatifs[i].Requete.initiateDateFinEcheance();
            }
            return Ok(Justificatifs);
        }
        /*-------------------------------*/

        [HttpPost("recaller_manque_pj/{idJustif}")]
        public async Task<IActionResult> RecallerManquePj(int idJustif, [FromBody] StringData commentaireRevision)
        {
            int userId = 0;
            if (HttpContext.User.Claims.ToArray().Length != 0)
            {
                userId = int.Parse(HttpContext.User.Claims.ToArray()[0].Value);
            }

            if (userId == 0)
                return Unauthorized("Utilisateur non trouvé. Veuillez vérifier votre login!");
                _JustificatifRepository.UpdateManquePj(idJustif, true);
                _JustificatifRepository.UpdateCommentaireRevision(idJustif, commentaireRevision.value);
                await _TraitementJustifRepository.SendMailRevision(idJustif, userId);
                return Ok("justificatif recallé");
        }

        [HttpGet("a_reviser/pages")]
        public IActionResult GetNbJustifAreviserByUtilisateur()
        {
            int userId = 0;
            if (HttpContext.User.Claims.ToArray().Length != 0)
            {
                userId = int.Parse(HttpContext.User.Claims.ToArray()[0].Value);
            }

            if (userId == 0)
                return Unauthorized("Utilisateur non trouvé. Veuillez vérifier votre login!");

            int nbPage = _JustificatifRepository.GetNbJustifsAreviser(userId);

            return Ok(nbPage);

        }

        [HttpGet("a_reviser/word/{word}/pages")]
        public IActionResult GetNbJustifAreviserByUtilisateur(string word)
        {
            int userId = 0;
            if (HttpContext.User.Claims.ToArray().Length != 0)
            {
                userId = int.Parse(HttpContext.User.Claims.ToArray()[0].Value);
            }

            if (userId == 0)
                return Unauthorized("Utilisateur non trouvé. Veuillez vérifier votre login!");

            int nbPage = _JustificatifRepository.GetNbJustifsAreviserByWord(userId, word);

            return Ok(nbPage);

        }

        [HttpGet("a_reviser/page/{page}")]
        public IActionResult GetJustifAreviserByUtilisatueur(int page)
        {
            int userId = 0;
            if (HttpContext.User.Claims.ToArray().Length != 0)
            {
                userId = int.Parse(HttpContext.User.Claims.ToArray()[0].Value);
            }

            if (userId == 0)
                return Unauthorized("Utilisateur non trouvé. Veuillez vérifier votre login!");

            List<Justificatif> Justificatifs = _JustificatifRepository.GetJustifsAreviserByPage(userId, page);
            for (int i = 0; i < Justificatifs.Count(); i++)
            {
                Console.WriteLine("MONTANT");
                Console.WriteLine(Justificatifs[i].Montant);
                Console.WriteLine(i);
                Justificatifs[i].Utilisateur = _UtilisateurRepository.GetUtilisateurByRequete(Justificatifs[i].Requete.IdRequete);
                //Requetes[i].Activite = _ActiviteRepository.GetActivtieByRequete(Requetes[i].IdRequete);
                //Requetes[i].Activite.Projet = _ProjetRepository.GetProjetByActivite(Requetes[i].Activite.idActivite);
                Justificatifs[i].Requete.Montant = _RequeteRubriqueRepository.GetSommeRequeteRubriquesByRequete(Justificatifs[i].Requete.IdRequete);
                Justificatifs[i].Requete.TypeRequete = _TypeRequeteRepository.GetTypeRequeteById((int)Justificatifs[i].Requete.IdTypeRequete);
                Justificatifs[i].Requete.initiateDateFinEcheance();
            }
            return Ok(Justificatifs);
        }

        [HttpGet("a_reviser/word/{word}/page/{page}")]
        public IActionResult GetJustifAreviserByUtilisatueur(int page, string word)
        {
            int userId = 0;
            if (HttpContext.User.Claims.ToArray().Length != 0)
            {
                userId = int.Parse(HttpContext.User.Claims.ToArray()[0].Value);
            }

            if (userId == 0)
                return Unauthorized("Utilisateur non trouvé. Veuillez vérifier votre login!");

            List<Justificatif> Justificatifs = _JustificatifRepository.GetJustifsAreviserByPageAndWord(userId, word, page);

            for (int i = 0; i < Justificatifs.Count(); i++)
            {
                Console.WriteLine("MONTANT");
                Console.WriteLine(Justificatifs[i].Montant);
                Justificatifs[i].Utilisateur = _UtilisateurRepository.GetUtilisateurByRequete(Justificatifs[i].Requete.IdRequete);
                //Requetes[i].Activite = _ActiviteRepository.GetActivtieByRequete(Requetes[i].IdRequete);
                //Requetes[i].Activite.Projet = _ProjetRepository.GetProjetByActivite(Requetes[i].Activite.idActivite);
                Justificatifs[i].Requete.Montant = _RequeteRubriqueRepository.GetSommeRequeteRubriquesByRequete(Justificatifs[i].Requete.IdRequete);
                Justificatifs[i].Requete.TypeRequete = _TypeRequeteRepository.GetTypeRequeteById((int)Justificatifs[i].Requete.IdTypeRequete);
                Justificatifs[i].Requete.initiateDateFinEcheance();
            }
            return Ok(Justificatifs);
        }

        /*-------------------------------*/

        [HttpGet("validateur/en_cours/pages")]
        public async Task<IActionResult> GetNbJustifEnCoursValidateur()
        {
            int userId = 0;
            if (HttpContext.User.Claims.ToArray().Length != 0)
            {
                userId = int.Parse(HttpContext.User.Claims.ToArray()[0].Value);
            }

            if (userId == 0)
                return Unauthorized("Utilisateur non trouvé. Veuillez vérifier votre login!");

            int nbPage = _JustificatifRepository.GetNbJustifsEnCoursValidateur(userId);

            return Ok(nbPage);

        }

        [HttpGet("validateur/en_cours/word/{word}/pages")]
        public async Task<IActionResult> GetNbJustifEnCoursValidateur(string word)
        {
            int userId = 0;
            if (HttpContext.User.Claims.ToArray().Length != 0)
            {
                userId = int.Parse(HttpContext.User.Claims.ToArray()[0].Value);
            }

            if (userId == 0)
                return Unauthorized("Utilisateur non trouvé. Veuillez vérifier votre login!");

            int nbPage = _JustificatifRepository.GetNbJustifsEnCoursValidateurByWord(userId,word);

            return Ok(nbPage);

        }


        [HttpGet("validateur/en_cours/page/{page}")]
        public IActionResult GetJustifEnCoursValidateur(int page)
        {
            int userId = 0;
            if (HttpContext.User.Claims.ToArray().Length != 0)
            {
                userId = int.Parse(HttpContext.User.Claims.ToArray()[0].Value);
            }

            if (userId == 0)
                return Unauthorized("Utilisateur non trouvé. Veuillez vérifier votre login!");

            List<Justificatif> Justificatifs = _JustificatifRepository.GetJustifsEnCoursValidateurByPage(userId,page);
            for (int i = 0; i < Justificatifs.Count(); i++)
            {
                Justificatifs[i].Utilisateur = _UtilisateurRepository.GetUtilisateurByRequete(Justificatifs[i].Requete.IdRequete);
                Console.WriteLine(i);
                //Requetes[i].Activite = _ActiviteRepository.GetActivtieByRequete(Requetes[i].IdRequete);
                //Requetes[i].Activite.Projet = _ProjetRepository.GetProjetByActivite(Requetes[i].Activite.idActivite);
                Justificatifs[i].Requete.Montant = _RequeteRubriqueRepository.GetSommeRequeteRubriquesByRequete(Justificatifs[i].Requete.IdRequete);
                Justificatifs[i].Requete.TypeRequete = _TypeRequeteRepository.GetTypeRequeteById((int)Justificatifs[i].Requete.IdTypeRequete);
                Justificatifs[i].Requete.initiateDateFinEcheance();

                Justificatifs[i].CircuitEtapeCheckListDetailsDTO = _CircuitRepository.GetCircuitEtapeActuelByIdJustifSync(Justificatifs[i].IdJustif);
            }
            return Ok(Justificatifs);
        }

        [HttpGet("validateur/en_cours/word/{word}/page/{page}")]
        public IActionResult GetJustifEnCoursValidateur(int page,string word)
        {
            int userId = 0;
            if (HttpContext.User.Claims.ToArray().Length != 0)
            {
                userId = int.Parse(HttpContext.User.Claims.ToArray()[0].Value);
            }

            if (userId == 0)
                return Unauthorized("Utilisateur non trouvé. Veuillez vérifier votre login!");

            List<Justificatif> Justificatifs = _JustificatifRepository.GetJustifsEnCoursValidateurByPageAndWord(userId,word, page);
            for (int i = 0; i < Justificatifs.Count(); i++)
            {
                Justificatifs[i].Utilisateur = _UtilisateurRepository.GetUtilisateurByRequete(Justificatifs[i].Requete.IdRequete);
                Console.WriteLine(i);
                //Requetes[i].Activite = _ActiviteRepository.GetActivtieByRequete(Requetes[i].IdRequete);
                //Requetes[i].Activite.Projet = _ProjetRepository.GetProjetByActivite(Requetes[i].Activite.idActivite);
                Justificatifs[i].Requete.Montant = _RequeteRubriqueRepository.GetSommeRequeteRubriquesByRequete(Justificatifs[i].Requete.IdRequete);
                Justificatifs[i].Requete.TypeRequete = _TypeRequeteRepository.GetTypeRequeteById((int)Justificatifs[i].Requete.IdTypeRequete);
                Justificatifs[i].Requete.initiateDateFinEcheance();

                Justificatifs[i].CircuitEtapeCheckListDetailsDTO = _CircuitRepository.GetCircuitEtapeActuelByIdJustifSync(Justificatifs[i].IdJustif);
            }
            return Ok(Justificatifs);
        }
		/*--------------------------------*/
		[HttpGet("admin/en_cours/pages")]
		public async Task<IActionResult> GetNbJustifEnCoursAdmin()
		{
			int userId = 0;
			if (HttpContext.User.Claims.ToArray().Length != 0)
			{
				userId = int.Parse(HttpContext.User.Claims.ToArray()[0].Value);
			}

			if (userId == 0)
				return Unauthorized("Utilisateur non trouvé. Veuillez vérifier votre login!");

			int nbPage = _JustificatifRepository.GetNbJustifsEnCoursAdmin(userId);

			return Ok(nbPage);

		}

		[HttpGet("admin/en_cours/word/{word}/pages")]
		public async Task<IActionResult> GetNbJustifEnCoursAdmin(string word)
		{
			int userId = 0;
			if (HttpContext.User.Claims.ToArray().Length != 0)
			{
				userId = int.Parse(HttpContext.User.Claims.ToArray()[0].Value);
			}

			if (userId == 0)
				return Unauthorized("Utilisateur non trouvé. Veuillez vérifier votre login!");

			int nbPage = _JustificatifRepository.GetNbJustifsEnCoursAdminByWord(userId, word);

			return Ok(nbPage);

		}


		[HttpGet("admin/en_cours/page/{page}")]
		public IActionResult GetJustifEnCoursAdmin(int page)
		{
			int userId = 0;
			if (HttpContext.User.Claims.ToArray().Length != 0)
			{
				userId = int.Parse(HttpContext.User.Claims.ToArray()[0].Value);
			}

			if (userId == 0)
				return Unauthorized("Utilisateur non trouvé. Veuillez vérifier votre login!");

			List<Justificatif> Justificatifs = _JustificatifRepository.GetJustifsEnCoursAdminByPage(userId, page);
			for (int i = 0; i < Justificatifs.Count(); i++)
			{
				Justificatifs[i].Utilisateur = _UtilisateurRepository.GetUtilisateurByRequete(Justificatifs[i].Requete.IdRequete);
				Console.WriteLine(i);
				//Requetes[i].Activite = _ActiviteRepository.GetActivtieByRequete(Requetes[i].IdRequete);
				//Requetes[i].Activite.Projet = _ProjetRepository.GetProjetByActivite(Requetes[i].Activite.idActivite);
				Justificatifs[i].Requete.Montant = _RequeteRubriqueRepository.GetSommeRequeteRubriquesByRequete(Justificatifs[i].Requete.IdRequete);
				Justificatifs[i].Requete.TypeRequete = _TypeRequeteRepository.GetTypeRequeteById((int)Justificatifs[i].Requete.IdTypeRequete);
				Justificatifs[i].Requete.initiateDateFinEcheance();

				Justificatifs[i].CircuitEtapeCheckListDetailsDTO = _CircuitRepository.GetCircuitEtapeActuelByIdJustifSync(Justificatifs[i].IdJustif);
			}
			return Ok(Justificatifs);
		}

		[HttpGet("admin/en_cours/word/{word}/page/{page}")]
		public IActionResult GetJustifEnCoursAdmin(int page, string word)
		{
			int userId = 0;
			if (HttpContext.User.Claims.ToArray().Length != 0)
			{
				userId = int.Parse(HttpContext.User.Claims.ToArray()[0].Value);
			}

			if (userId == 0)
				return Unauthorized("Utilisateur non trouvé. Veuillez vérifier votre login!");

			List<Justificatif> Justificatifs = _JustificatifRepository.GetJustifsEnCoursAdminByPageAndWord(userId, word, page);
			for (int i = 0; i < Justificatifs.Count(); i++)
			{
				Justificatifs[i].Utilisateur = _UtilisateurRepository.GetUtilisateurByRequete(Justificatifs[i].Requete.IdRequete);
				Console.WriteLine(i);
				//Requetes[i].Activite = _ActiviteRepository.GetActivtieByRequete(Requetes[i].IdRequete);
				//Requetes[i].Activite.Projet = _ProjetRepository.GetProjetByActivite(Requetes[i].Activite.idActivite);
				Justificatifs[i].Requete.Montant = _RequeteRubriqueRepository.GetSommeRequeteRubriquesByRequete(Justificatifs[i].Requete.IdRequete);
				Justificatifs[i].Requete.TypeRequete = _TypeRequeteRepository.GetTypeRequeteById((int)Justificatifs[i].Requete.IdTypeRequete);
				Justificatifs[i].Requete.initiateDateFinEcheance();

				Justificatifs[i].CircuitEtapeCheckListDetailsDTO = _CircuitRepository.GetCircuitEtapeActuelByIdJustifSync(Justificatifs[i].IdJustif);
			}
			return Ok(Justificatifs);
		}
		/*--------------------------------*/
		[HttpGet("validateur/refuses/pages")]
        public async Task<IActionResult> GetNbJustifRefuseesValidateur()
        {
            int userId = 0;
            if (HttpContext.User.Claims.ToArray().Length != 0)
            {
                userId = int.Parse(HttpContext.User.Claims.ToArray()[0].Value);
            }

            if (userId == 0)
                return Unauthorized("Utilisateur non trouvé. Veuillez vérifier votre login!");

            int nbPage = _JustificatifRepository.GetNbJustifsRefuseesValidateur(userId);

            return Ok(nbPage);

        }

        [HttpGet("validateur/refuses/word/{word}/pages")]
        public async Task<IActionResult> GetNbJustifRefuseesValidateur(string word)
        {
            int userId = 0;
            if (HttpContext.User.Claims.ToArray().Length != 0)
            {
                userId = int.Parse(HttpContext.User.Claims.ToArray()[0].Value);
            }

            if (userId == 0)
                return Unauthorized("Utilisateur non trouvé. Veuillez vérifier votre login!");

            int nbPage = _JustificatifRepository.GetNbJustifsRefuseesValidateurByWord(userId,word);

            return Ok(nbPage);

        }

        [HttpGet("validateur/refuses/page/{page}")]
        public IActionResult GetJustifRefuseesValidateur(int page)
        {
            int userId = 0;
            if (HttpContext.User.Claims.ToArray().Length != 0)
            {
                userId = int.Parse(HttpContext.User.Claims.ToArray()[0].Value);
            }

            if (userId == 0)
                return Unauthorized("Utilisateur non trouvé. Veuillez vérifier votre login!");

            List<Justificatif> Justificatifs = _JustificatifRepository.GetJustifsRefuseesValidateurByPage(userId, page);
            for (int i = 0; i < Justificatifs.Count(); i++)
            {
                Console.WriteLine(i);
                Justificatifs[i].Utilisateur = _UtilisateurRepository.GetUtilisateurByRequete(Justificatifs[i].Requete.IdRequete);
                //Requetes[i].Activite = _ActiviteRepository.GetActivtieByRequete(Requetes[i].IdRequete);
                //Requetes[i].Activite.Projet = _ProjetRepository.GetProjetByActivite(Requetes[i].Activite.idActivite);
                Justificatifs[i].Requete.Montant = _RequeteRubriqueRepository.GetSommeRequeteRubriquesByRequete(Justificatifs[i].Requete.IdRequete);
                Justificatifs[i].Requete.TypeRequete = _TypeRequeteRepository.GetTypeRequeteById((int)Justificatifs[i].Requete.IdTypeRequete);
                Justificatifs[i].Requete.initiateDateFinEcheance();
            }
            return Ok(Justificatifs);
        }

        [HttpGet("validateur/refuses/word/{word}/page/{page}")]
        public IActionResult GetJustifRefuseesValidateur(int page,string word)
        {
            int userId = 0;
            if (HttpContext.User.Claims.ToArray().Length != 0)
            {
                userId = int.Parse(HttpContext.User.Claims.ToArray()[0].Value);
            }

            if (userId == 0)
                return Unauthorized("Utilisateur non trouvé. Veuillez vérifier votre login!");

            List<Justificatif> Justificatifs = _JustificatifRepository.GetJustifsRefuseesValidateurByPageAndWord(userId,word,page);
            for (int i = 0; i < Justificatifs.Count(); i++)
            {
                Console.WriteLine(i);
                Justificatifs[i].Utilisateur = _UtilisateurRepository.GetUtilisateurByRequete(Justificatifs[i].Requete.IdRequete);
                //Requetes[i].Activite = _ActiviteRepository.GetActivtieByRequete(Requetes[i].IdRequete);
                //Requetes[i].Activite.Projet = _ProjetRepository.GetProjetByActivite(Requetes[i].Activite.idActivite);
                Justificatifs[i].Requete.Montant = _RequeteRubriqueRepository.GetSommeRequeteRubriquesByRequete(Justificatifs[i].Requete.IdRequete);
                Justificatifs[i].Requete.TypeRequete = _TypeRequeteRepository.GetTypeRequeteById((int)Justificatifs[i].Requete.IdTypeRequete);
                Justificatifs[i].Requete.initiateDateFinEcheance();
            }
            return Ok(Justificatifs);
        }

		/*--------------------------------*/

		[HttpGet("admin/refuses/pages")]
		public async Task<IActionResult> GetNbJustifRefuseesAdmin()
		{
			int userId = 0;
			if (HttpContext.User.Claims.ToArray().Length != 0)
			{
				userId = int.Parse(HttpContext.User.Claims.ToArray()[0].Value);
			}

			if (userId == 0)
				return Unauthorized("Utilisateur non trouvé. Veuillez vérifier votre login!");

			int nbPage = _JustificatifRepository.GetNbJustifsRefuseesAdmin(userId);

			return Ok(nbPage);

		}

		[HttpGet("admin/refuses/word/{word}/pages")]
		public async Task<IActionResult> GetNbJustifRefuseesAdmin(string word)
		{
			int userId = 0;
			if (HttpContext.User.Claims.ToArray().Length != 0)
			{
				userId = int.Parse(HttpContext.User.Claims.ToArray()[0].Value);
			}

			if (userId == 0)
				return Unauthorized("Utilisateur non trouvé. Veuillez vérifier votre login!");

			int nbPage = _JustificatifRepository.GetNbJustifsRefuseesAdminByWord(userId, word);

			return Ok(nbPage);

		}

		[HttpGet("admin/refuses/page/{page}")]
		public IActionResult GetJustifRefuseesAdmin(int page)
		{
			int userId = 0;
			if (HttpContext.User.Claims.ToArray().Length != 0)
			{
				userId = int.Parse(HttpContext.User.Claims.ToArray()[0].Value);
			}

			if (userId == 0)
				return Unauthorized("Utilisateur non trouvé. Veuillez vérifier votre login!");

			List<Justificatif> Justificatifs = _JustificatifRepository.GetJustifsRefuseesAdminByPage(userId, page);
			for (int i = 0; i < Justificatifs.Count(); i++)
			{
				Console.WriteLine(i);
				Justificatifs[i].Utilisateur = _UtilisateurRepository.GetUtilisateurByRequete(Justificatifs[i].Requete.IdRequete);
				//Requetes[i].Activite = _ActiviteRepository.GetActivtieByRequete(Requetes[i].IdRequete);
				//Requetes[i].Activite.Projet = _ProjetRepository.GetProjetByActivite(Requetes[i].Activite.idActivite);
				Justificatifs[i].Requete.Montant = _RequeteRubriqueRepository.GetSommeRequeteRubriquesByRequete(Justificatifs[i].Requete.IdRequete);
				Justificatifs[i].Requete.TypeRequete = _TypeRequeteRepository.GetTypeRequeteById((int)Justificatifs[i].Requete.IdTypeRequete);
				Justificatifs[i].Requete.initiateDateFinEcheance();
			}
			return Ok(Justificatifs);
		}

		[HttpGet("admin/refuses/word/{word}/page/{page}")]
		public IActionResult GetJustifRefuseesAdmin(int page, string word)
		{
			int userId = 0;
			if (HttpContext.User.Claims.ToArray().Length != 0)
			{
				userId = int.Parse(HttpContext.User.Claims.ToArray()[0].Value);
			}

			if (userId == 0)
				return Unauthorized("Utilisateur non trouvé. Veuillez vérifier votre login!");

			List<Justificatif> Justificatifs = _JustificatifRepository.GetJustifsRefuseesAdminByPageAndWord(userId, word, page);
			for (int i = 0; i < Justificatifs.Count(); i++)
			{
				Console.WriteLine(i);
				Justificatifs[i].Utilisateur = _UtilisateurRepository.GetUtilisateurByRequete(Justificatifs[i].Requete.IdRequete);
				//Requetes[i].Activite = _ActiviteRepository.GetActivtieByRequete(Requetes[i].IdRequete);
				//Requetes[i].Activite.Projet = _ProjetRepository.GetProjetByActivite(Requetes[i].Activite.idActivite);
				Justificatifs[i].Requete.Montant = _RequeteRubriqueRepository.GetSommeRequeteRubriquesByRequete(Justificatifs[i].Requete.IdRequete);
				Justificatifs[i].Requete.TypeRequete = _TypeRequeteRepository.GetTypeRequeteById((int)Justificatifs[i].Requete.IdTypeRequete);
				Justificatifs[i].Requete.initiateDateFinEcheance();
			}
			return Ok(Justificatifs);
		}

		/*--------------------------------*/
		[HttpGet("en_cours/pages")]
        public async Task<IActionResult> GetNbJustifsEnCoursByUtilisatueur()
        {
            int userId = 0;
            if (HttpContext.User.Claims.ToArray().Length != 0)
            {
                userId = int.Parse(HttpContext.User.Claims.ToArray()[0].Value);
            }

            if (userId == 0)
                return Unauthorized("Utilisateur non trouvé. Veuillez vérifier votre login!");

            int nbPage = _JustificatifRepository.GetNbJustifsEnCoursByUtilisateur(userId);

            return Ok(nbPage);

        }

        [HttpGet("en_cours/word/{word}/pages")]
        public async Task<IActionResult> GetNbJustifsEnCoursByUtilisatueur(string word)
        {
            int userId = 0;
            if (HttpContext.User.Claims.ToArray().Length != 0)
            {
                userId = int.Parse(HttpContext.User.Claims.ToArray()[0].Value);
            }

            if (userId == 0)
                return Unauthorized("Utilisateur non trouvé. Veuillez vérifier votre login!");

            int nbPage = _JustificatifRepository.GetNbJustifsEnCoursByUtilisateurAndWord(userId,word);

            return Ok(nbPage);

        }


        [HttpGet("en_cours/page/{page}")]
        public IActionResult GetJustifsEnCoursByUtilisatueur(int page)
        {
            int userId = 0;
            if (HttpContext.User.Claims.ToArray().Length != 0)
            {
                userId = int.Parse(HttpContext.User.Claims.ToArray()[0].Value);
            }

            if (userId == 0)
                return Unauthorized("Utilisateur non trouvé. Veuillez vérifier votre login!");

            List<Justificatif> Justificatifs = _JustificatifRepository.GetJustifsEnCoursByUtilisateurByPage(userId,page);
            for (int i = 0; i < Justificatifs.Count(); i++)
            {
                Justificatifs[i].Utilisateur = _UtilisateurRepository.GetUtilisateurByRequete(Justificatifs[i].Requete.IdRequete);
                Console.WriteLine(i);
                //Requetes[i].Activite = _ActiviteRepository.GetActivtieByRequete(Requetes[i].IdRequete);
                //Requetes[i].Activite.Projet = _ProjetRepository.GetProjetByActivite(Requetes[i].Activite.idActivite);
                Justificatifs[i].Requete.Montant = _RequeteRubriqueRepository.GetSommeRequeteRubriquesByRequete(Justificatifs[i].Requete.IdRequete);
                Justificatifs[i].Requete.TypeRequete = _TypeRequeteRepository.GetTypeRequeteById((int)Justificatifs[i].Requete.IdTypeRequete);
                Justificatifs[i].Requete.initiateDateFinEcheance();

                Justificatifs[i].CircuitEtapeCheckListDetailsDTO = _CircuitRepository.GetCircuitEtapeActuelByIdJustifSync(Justificatifs[i].IdJustif);
            }
            return Ok(Justificatifs);
        }

        [HttpGet("en_cours/word/{word}/page/{page}")]
        public IActionResult GetJustifsEnCoursByUtilisatueur(int page,string word)
        {
            int userId = 0;
            if (HttpContext.User.Claims.ToArray().Length != 0)
            {
                userId = int.Parse(HttpContext.User.Claims.ToArray()[0].Value);
            }

            if (userId == 0)
                return Unauthorized("Utilisateur non trouvé. Veuillez vérifier votre login!");

            List<Justificatif> Justificatifs = _JustificatifRepository.GetJustifsEnCoursByUtilisateurByPageAndWord(userId,word, page);
            for (int i = 0; i < Justificatifs.Count(); i++)
            {
                Justificatifs[i].Utilisateur = _UtilisateurRepository.GetUtilisateurByRequete(Justificatifs[i].Requete.IdRequete);
                Console.WriteLine(i);
                //Requetes[i].Activite = _ActiviteRepository.GetActivtieByRequete(Requetes[i].IdRequete);
                //Requetes[i].Activite.Projet = _ProjetRepository.GetProjetByActivite(Requetes[i].Activite.idActivite);
                Justificatifs[i].Requete.Montant = _RequeteRubriqueRepository.GetSommeRequeteRubriquesByRequete(Justificatifs[i].Requete.IdRequete);
                Justificatifs[i].Requete.TypeRequete = _TypeRequeteRepository.GetTypeRequeteById((int)Justificatifs[i].Requete.IdTypeRequete);
                Justificatifs[i].Requete.initiateDateFinEcheance();

                Justificatifs[i].CircuitEtapeCheckListDetailsDTO = _CircuitRepository.GetCircuitEtapeActuelByIdJustifSync(Justificatifs[i].IdJustif);
            }
            return Ok(Justificatifs);
        }
        /*--------------------------------*/
        [HttpGet("valides/pages")]
        public async Task<IActionResult> GetNbJustifsValidesByUtilisateur()
        {
            int userId = 0;
            if (HttpContext.User.Claims.ToArray().Length != 0)
            {
                userId = int.Parse(HttpContext.User.Claims.ToArray()[0].Value);
            }

            if (userId == 0)
                return Unauthorized("Utilisateur non trouvé. Veuillez vérifier votre login!");

            int nbPage = _JustificatifRepository.GetNbJustifsValidesByUtilisateur(userId);

            return Ok(nbPage);

        }

        [HttpGet("valides/word/{word}/pages")]
        public async Task<IActionResult> GetNbJustifsValidesByUtilisateur(string word)
        {
            int userId = 0;
            if (HttpContext.User.Claims.ToArray().Length != 0)
            {
                userId = int.Parse(HttpContext.User.Claims.ToArray()[0].Value);
            }

            if (userId == 0)
                return Unauthorized("Utilisateur non trouvé. Veuillez vérifier votre login!");

            int nbPage = _JustificatifRepository.GetNbJustifsValidesByUtilisateurAndWord(userId,word);

            return Ok(nbPage);

        }

        [HttpGet("valides/page/{page}")]
        public IActionResult GetJustifsValidesByUtilisatueur(int page)
        {
            int userId = 0;
            if (HttpContext.User.Claims.ToArray().Length != 0)
            {
                userId = int.Parse(HttpContext.User.Claims.ToArray()[0].Value);
            }

            if (userId == 0)
                return Unauthorized("Utilisateur non trouvé. Veuillez vérifier votre login!");

            List<Justificatif> Justificatifs = _JustificatifRepository.GetJustifsValidesByUtilisateurByPage(userId,page);
            for (int i = 0; i < Justificatifs.Count(); i++)
            {
                Justificatifs[i].Utilisateur = _UtilisateurRepository.GetUtilisateurByRequete(Justificatifs[i].Requete.IdRequete);
                Console.WriteLine(i);
                //Requetes[i].Activite = _ActiviteRepository.GetActivtieByRequete(Requetes[i].IdRequete);
                //Requetes[i].Activite.Projet = _ProjetRepository.GetProjetByActivite(Requetes[i].Activite.idActivite);
                Justificatifs[i].Requete.Montant = _RequeteRubriqueRepository.GetSommeRequeteRubriquesByRequete(Justificatifs[i].Requete.IdRequete);
                Justificatifs[i].Requete.TypeRequete = _TypeRequeteRepository.GetTypeRequeteById((int)Justificatifs[i].Requete.IdTypeRequete);
                Justificatifs[i].Requete.initiateDateFinEcheance();
            }
            return Ok(Justificatifs);
        }

        [HttpGet("valides/word/{word}/page/{page}")]
        public IActionResult GetJustifsValidesByUtilisatueur(int page,string word)
        {
            int userId = 0;
            if (HttpContext.User.Claims.ToArray().Length != 0)
            {
                userId = int.Parse(HttpContext.User.Claims.ToArray()[0].Value);
            }

            if (userId == 0)
                return Unauthorized("Utilisateur non trouvé. Veuillez vérifier votre login!");

            List<Justificatif> Justificatifs = _JustificatifRepository.GetJustifsValidesByUtilisateurByPageAndWord(userId,word, page);
            for (int i = 0; i < Justificatifs.Count(); i++)
            {
                Justificatifs[i].Utilisateur = _UtilisateurRepository.GetUtilisateurByRequete(Justificatifs[i].Requete.IdRequete);
                Console.WriteLine(i);
                //Requetes[i].Activite = _ActiviteRepository.GetActivtieByRequete(Requetes[i].IdRequete);
                //Requetes[i].Activite.Projet = _ProjetRepository.GetProjetByActivite(Requetes[i].Activite.idActivite);
                Justificatifs[i].Requete.Montant = _RequeteRubriqueRepository.GetSommeRequeteRubriquesByRequete(Justificatifs[i].Requete.IdRequete);
                Justificatifs[i].Requete.TypeRequete = _TypeRequeteRepository.GetTypeRequeteById((int)Justificatifs[i].Requete.IdTypeRequete);
                Justificatifs[i].Requete.initiateDateFinEcheance();
            }
            return Ok(Justificatifs);
        }

        /*--------------------------------*/

        [HttpGet("refuses/pages")]
        public async Task<IActionResult> GetNbJustifsrefusesByUtilisatueur()
        {
            int userId = 0;
            if (HttpContext.User.Claims.ToArray().Length != 0)
            {
                userId = int.Parse(HttpContext.User.Claims.ToArray()[0].Value);
            }

            if (userId == 0)
                return Unauthorized("Utilisateur non trouvé. Veuillez vérifier votre login!");

            int nbPage = _JustificatifRepository.GetNbJustifsRefusesByUtilisateur(userId);

            return Ok(nbPage);

        }

        [HttpGet("refuses/word/{word}/pages")]
        public async Task<IActionResult> GetNbJustifsrefusesByUtilisatueur(string word)
        {
            int userId = 0;
            if (HttpContext.User.Claims.ToArray().Length != 0)
            {
                userId = int.Parse(HttpContext.User.Claims.ToArray()[0].Value);
            }

            if (userId == 0)
                return Unauthorized("Utilisateur non trouvé. Veuillez vérifier votre login!");

            int nbPage = _JustificatifRepository.GetNbJustifsRefusesByUtilisateurAndWord(userId,word);

            return Ok(nbPage);

        }

        [HttpGet("refuses/page/{page}")]
        public IActionResult GetJustifsrefusesByUtilisatueur(int page)
        {
            int userId = 0;
            if (HttpContext.User.Claims.ToArray().Length != 0)
            {
                userId = int.Parse(HttpContext.User.Claims.ToArray()[0].Value);
            }

            if (userId == 0)
                return Unauthorized("Utilisateur non trouvé. Veuillez vérifier votre login!");

            List<Justificatif> Justificatifs = _JustificatifRepository.GetJustifsRefusesByUtilisateurByPage(userId,page);
            for (int i = 0; i < Justificatifs.Count(); i++)
            {
                Justificatifs[i].Utilisateur = _UtilisateurRepository.GetUtilisateurByRequete(Justificatifs[i].Requete.IdRequete);
                Console.WriteLine(i);
                //Requetes[i].Activite = _ActiviteRepository.GetActivtieByRequete(Requetes[i].IdRequete);
                //Requetes[i].Activite.Projet = _ProjetRepository.GetProjetByActivite(Requetes[i].Activite.idActivite);
                Justificatifs[i].Requete.Montant = _RequeteRubriqueRepository.GetSommeRequeteRubriquesByRequete(Justificatifs[i].Requete.IdRequete);
                Justificatifs[i].Requete.TypeRequete = _TypeRequeteRepository.GetTypeRequeteById((int)Justificatifs[i].Requete.IdTypeRequete);
                Justificatifs[i].Requete.initiateDateFinEcheance();
            }
            return Ok(Justificatifs);
        }

        [HttpGet("refuses/word/{word}/page/{page}")]
        public IActionResult GetJustifsrefusesByUtilisatueur(string word,int page)
        {
            int userId = 0;
            if (HttpContext.User.Claims.ToArray().Length != 0)
            {
                userId = int.Parse(HttpContext.User.Claims.ToArray()[0].Value);
            }

            if (userId == 0)
                return Unauthorized("Utilisateur non trouvé. Veuillez vérifier votre login!");

            List<Justificatif> Justificatifs = _JustificatifRepository.GetJustifsRefusesByUtilisateurByPageAndWord(userId,word, page);
            for (int i = 0; i < Justificatifs.Count(); i++)
            {
                Justificatifs[i].Utilisateur = _UtilisateurRepository.GetUtilisateurByRequete(Justificatifs[i].Requete.IdRequete);
                Console.WriteLine(i);
                //Requetes[i].Activite = _ActiviteRepository.GetActivtieByRequete(Requetes[i].IdRequete);
                //Requetes[i].Activite.Projet = _ProjetRepository.GetProjetByActivite(Requetes[i].Activite.idActivite);
                Justificatifs[i].Requete.Montant = _RequeteRubriqueRepository.GetSommeRequeteRubriquesByRequete(Justificatifs[i].Requete.IdRequete);
                Justificatifs[i].Requete.TypeRequete = _TypeRequeteRepository.GetTypeRequeteById((int)Justificatifs[i].Requete.IdTypeRequete);
                Justificatifs[i].Requete.initiateDateFinEcheance();
            }
            return Ok(Justificatifs);
        }
        /*--------------------------------*/

        [HttpGet("a_rattacher/pages")]
        public async Task<IActionResult> GetNbJustifsArattacher()
        {
            int userId = 0;
            if (HttpContext.User.Claims.ToArray().Length != 0)
            {
                userId = int.Parse(HttpContext.User.Claims.ToArray()[0].Value);
            }

            if (userId == 0)
                return Unauthorized("Utilisateur non trouvé. Veuillez vérifier votre login!");

            int nbPage = _JustificatifRepository.GetNbJustifsAmettreCircuit(userId);

            return Ok(nbPage);

        }

        [HttpGet("a_rattacher/word/{word}/pages")]
        public async Task<IActionResult> GetNbJustifsArattacher(string word)
        {
            int userId = 0;
            if (HttpContext.User.Claims.ToArray().Length != 0)
            {
                userId = int.Parse(HttpContext.User.Claims.ToArray()[0].Value);
            }

            if (userId == 0)
                return Unauthorized("Utilisateur non trouvé. Veuillez vérifier votre login!");

            int nbPage = _JustificatifRepository.GetNbJustifsAmettreCircuitByWord(userId,word);

            return Ok(nbPage);

        }

        [HttpGet("a_rattacher/page/{page}")]
        public IActionResult GetJustifsArattacher(int page)
        {
            int userId = 0;
            if (HttpContext.User.Claims.ToArray().Length != 0)
            {
                userId = int.Parse(HttpContext.User.Claims.ToArray()[0].Value);
            }

            if (userId == 0)
                return Unauthorized("Utilisateur non trouvé. Veuillez vérifier votre login!");

            List<Justificatif> Justificatifs = _JustificatifRepository.GetJustifsAmettreCircuitByPage(userId,page);
            for (int i = 0; i < Justificatifs.Count(); i++)
            {
                Justificatifs[i].Utilisateur = _UtilisateurRepository.GetUtilisateurByRequete(Justificatifs[i].Requete.IdRequete);
                Console.WriteLine(i);
                //Requetes[i].Activite = _ActiviteRepository.GetActivtieByRequete(Requetes[i].IdRequete);
                //Requetes[i].Activite.Projet = _ProjetRepository.GetProjetByActivite(Requetes[i].Activite.idActivite);
                Justificatifs[i].Requete.Montant = _RequeteRubriqueRepository.GetSommeRequeteRubriquesByRequete(Justificatifs[i].Requete.IdRequete);
                Justificatifs[i].Requete.TypeRequete = _TypeRequeteRepository.GetTypeRequeteById((int)Justificatifs[i].Requete.IdTypeRequete);
                Justificatifs[i].JustificatifAccuse = _JustificatifAccuseRepository.GetJustificatifAccuseByIdRequete(Justificatifs[i].IdJustif);
                Justificatifs[i].Requete.initiateDateFinEcheance();
            }
            return Ok(Justificatifs);
        }

        [HttpGet("a_rattacher/word/{word}/page/{page}")]
        public IActionResult GetJustifsArattacher(int page,string word)
        {
            int userId = 0;
            if (HttpContext.User.Claims.ToArray().Length != 0)
            {
                userId = int.Parse(HttpContext.User.Claims.ToArray()[0].Value);
            }

            if (userId == 0)
                return Unauthorized("Utilisateur non trouvé. Veuillez vérifier votre login!");

            List<Justificatif> Justificatifs = _JustificatifRepository.GetJustifsAmettreCircuitByPageAndWord(userId,word, page);
            for (int i = 0; i < Justificatifs.Count(); i++)
            {
                Justificatifs[i].Utilisateur = _UtilisateurRepository.GetUtilisateurByRequete(Justificatifs[i].Requete.IdRequete);
                Console.WriteLine(i);
                //Requetes[i].Activite = _ActiviteRepository.GetActivtieByRequete(Requetes[i].IdRequete);
                //Requetes[i].Activite.Projet = _ProjetRepository.GetProjetByActivite(Requetes[i].Activite.idActivite);
                Justificatifs[i].Requete.Montant = _RequeteRubriqueRepository.GetSommeRequeteRubriquesByRequete(Justificatifs[i].Requete.IdRequete);
                Justificatifs[i].Requete.TypeRequete = _TypeRequeteRepository.GetTypeRequeteById((int)Justificatifs[i].Requete.IdTypeRequete);
                Justificatifs[i].JustificatifAccuse = _JustificatifAccuseRepository.GetJustificatifAccuseByIdRequete(Justificatifs[i].IdJustif);
                Justificatifs[i].Requete.initiateDateFinEcheance();
            }
            return Ok(Justificatifs);
        }
        /*--------------------------------*/

        [HttpGet("a_valider/pages")]
        public async Task<IActionResult> GetNbJustifsValider()
        {
            int userId = 0;
            if (HttpContext.User.Claims.ToArray().Length != 0)
            {
                userId = int.Parse(HttpContext.User.Claims.ToArray()[0].Value);
            }

            if (userId == 0)
                return Unauthorized("Utilisateur non trouvé. Veuillez vérifier votre login!");

            int nbPage = _JustificatifRepository.GetNbJustifsAvalider(userId);

            return Ok(nbPage);

        }

        [HttpGet("a_valider/word/{word}/pages")]
        public async Task<IActionResult> GetNbJustifsValider(string word)
        {
            int userId = 0;
            if (HttpContext.User.Claims.ToArray().Length != 0)
            {
                userId = int.Parse(HttpContext.User.Claims.ToArray()[0].Value);
            }

            if (userId == 0)
                return Unauthorized("Utilisateur non trouvé. Veuillez vérifier votre login!");

            int nbPage = _JustificatifRepository.GetNbJustifsAvaliderByWord(userId,word);

            return Ok(nbPage);

        }

        [HttpGet("a_valider/page/{page}")]
        public IActionResult GetJustifsValider(int page)
        {
            int userId = 0;
            if (HttpContext.User.Claims.ToArray().Length != 0)
            {
                userId = int.Parse(HttpContext.User.Claims.ToArray()[0].Value);
            }

            if (userId == 0)
                return Unauthorized("Utilisateur non trouvé. Veuillez vérifier votre login!");

            List<Justificatif> Justificatifs = _JustificatifRepository.GetJustifsAvaliderByPage(userId, page);
            for (int i = 0; i < Justificatifs.Count(); i++)
            {
                Justificatifs[i].Utilisateur = _UtilisateurRepository.GetUtilisateurByRequete(Justificatifs[i].Requete.IdRequete);
                Console.WriteLine(i);
                //Requetes[i].Activite = _ActiviteRepository.GetActivtieByRequete(Requetes[i].IdRequete);
                //Requetes[i].Activite.Projet = _ProjetRepository.GetProjetByActivite(Requetes[i].Activite.idActivite);
                Justificatifs[i].Requete.Montant = _RequeteRubriqueRepository.GetSommeRequeteRubriquesByRequete(Justificatifs[i].Requete.IdRequete);
                Justificatifs[i].Requete.TypeRequete = _TypeRequeteRepository.GetTypeRequeteById((int)Justificatifs[i].Requete.IdTypeRequete);
                Justificatifs[i].Requete.initiateDateFinEcheance();
                Justificatifs[i].JustifDetails = _JustifDetailsRepository.GetJustifDetailsByIdJustificatif(Justificatifs[i].IdJustif);
            }
            return Ok(Justificatifs);
        }

        [HttpGet("a_valider/word/{word}/page/{page}")]
        public IActionResult GetJustifsValider(int page,string word)
        {
            int userId = 0;
            if (HttpContext.User.Claims.ToArray().Length != 0)
            {
                userId = int.Parse(HttpContext.User.Claims.ToArray()[0].Value);
            }

            if (userId == 0)
                return Unauthorized("Utilisateur non trouvé. Veuillez vérifier votre login!");

            List<Justificatif> Justificatifs = _JustificatifRepository.GetJustifsAvaliderByPageAndWord(userId,word,page);
            for (int i = 0; i < Justificatifs.Count(); i++)
            {
                Justificatifs[i].Utilisateur = _UtilisateurRepository.GetUtilisateurByRequete(Justificatifs[i].Requete.IdRequete);
                Console.WriteLine(i);
                //Requetes[i].Activite = _ActiviteRepository.GetActivtieByRequete(Requetes[i].IdRequete);
                //Requetes[i].Activite.Projet = _ProjetRepository.GetProjetByActivite(Requetes[i].Activite.idActivite);
                Justificatifs[i].Requete.Montant = _RequeteRubriqueRepository.GetSommeRequeteRubriquesByRequete(Justificatifs[i].Requete.IdRequete);
                Justificatifs[i].Requete.TypeRequete = _TypeRequeteRepository.GetTypeRequeteById((int)Justificatifs[i].Requete.IdTypeRequete);
                Justificatifs[i].Requete.initiateDateFinEcheance();
                Justificatifs[i].JustifDetails = _JustifDetailsRepository.GetJustifDetailsByIdJustificatif(Justificatifs[i].IdJustif) ;

            }
            return Ok(Justificatifs);
        }
        /*------------------------------*/
        [HttpGet("validateur/valides/pages")]
        public async Task<IActionResult> GetNbJustifsValidesValidateur()
        {
            int userId = 0;
            if (HttpContext.User.Claims.ToArray().Length != 0)
            {
                userId = int.Parse(HttpContext.User.Claims.ToArray()[0].Value);
            }

            if (userId == 0)
                return Unauthorized("Utilisateur non trouvé. Veuillez vérifier votre login!");

            int nbPage = _JustificatifRepository.GetNbJustifsValidesValidateur(userId);

            return Ok(nbPage);

        }

        [HttpGet("validateur/valides/word/{word}/pages")]
        public async Task<IActionResult> GetNbJustifsValidesValidateur(string word)
        {
            int userId = 0;
            if (HttpContext.User.Claims.ToArray().Length != 0)
            {
                userId = int.Parse(HttpContext.User.Claims.ToArray()[0].Value);
            }

            if (userId == 0)
                return Unauthorized("Utilisateur non trouvé. Veuillez vérifier votre login!");

            int nbPage = _JustificatifRepository.GetNbJustifsValidesValidateurByWord(userId,word);

            return Ok(nbPage);

        }

        [HttpGet("validateur/valides/page/{page}")]
        public IActionResult GetJustifsAvalider(int page)
        {
            int userId = 0;
            if (HttpContext.User.Claims.ToArray().Length != 0)
            {
                userId = int.Parse(HttpContext.User.Claims.ToArray()[0].Value);
            }

            if (userId == 0)
                return Unauthorized("Utilisateur non trouvé. Veuillez vérifier votre login!");

            List<Justificatif> Justificatifs = _JustificatifRepository.GetJustifsValidesValidateurByPage(userId, page);
            for (int i = 0; i < Justificatifs.Count(); i++)
            {
                Justificatifs[i].Utilisateur = _UtilisateurRepository.GetUtilisateurByRequete(Justificatifs[i].Requete.IdRequete);
                Console.WriteLine(i);
                //Requetes[i].Activite = _ActiviteRepository.GetActivtieByRequete(Requetes[i].IdRequete);
                //Requetes[i].Activite.Projet = _ProjetRepository.GetProjetByActivite(Requetes[i].Activite.idActivite);
                Justificatifs[i].Requete.Montant = _RequeteRubriqueRepository.GetSommeRequeteRubriquesByRequete(Justificatifs[i].Requete.IdRequete);
                Justificatifs[i].Requete.TypeRequete = _TypeRequeteRepository.GetTypeRequeteById((int)Justificatifs[i].Requete.IdTypeRequete);
                Justificatifs[i].Requete.initiateDateFinEcheance();
            }
            return Ok(Justificatifs);
        }

        [HttpGet("validateur/valides/word/{word}/page/{page}")]
        public IActionResult GetJustifsAvalider(int page,string word)
        {
            int userId = 0;
            if (HttpContext.User.Claims.ToArray().Length != 0)
            {
                userId = int.Parse(HttpContext.User.Claims.ToArray()[0].Value);
            }

            if (userId == 0)
                return Unauthorized("Utilisateur non trouvé. Veuillez vérifier votre login!");

            List<Justificatif> Justificatifs = _JustificatifRepository.GetJustifsValidesValidateurByPageAndWord(userId,word, page);
            for (int i = 0; i < Justificatifs.Count(); i++)
            {
                Justificatifs[i].Utilisateur = _UtilisateurRepository.GetUtilisateurByRequete(Justificatifs[i].Requete.IdRequete);
                Console.WriteLine(i);
                //Requetes[i].Activite = _ActiviteRepository.GetActivtieByRequete(Requetes[i].IdRequete);
                //Requetes[i].Activite.Projet = _ProjetRepository.GetProjetByActivite(Requetes[i].Activite.idActivite);
                Justificatifs[i].Requete.Montant = _RequeteRubriqueRepository.GetSommeRequeteRubriquesByRequete(Justificatifs[i].Requete.IdRequete);
                Justificatifs[i].Requete.TypeRequete = _TypeRequeteRepository.GetTypeRequeteById((int)Justificatifs[i].Requete.IdTypeRequete);
                Justificatifs[i].Requete.initiateDateFinEcheance();
            }
            return Ok(Justificatifs);
        }

        [HttpGet("etats_justifs")]
        public IActionResult getEtats()
        {
            int userId = 0;
            if (HttpContext.User.Claims.ToArray().Length != 0)
            {
                userId = int.Parse(HttpContext.User.Claims.ToArray()[0].Value);
            }

            if (userId == 0)
                return Unauthorized("Utilisateur non trouvé. Veuillez vérifier votre login!");

            int[] etats = new int[5];
            etats[0] = _JustificatifRepository.GetNombreJustifsInitieesByUtilisateur(userId);
            etats[1] = _JustificatifRepository.GetNombreJustifsEnCoursByUtilisateur(userId);
            etats[2] = _JustificatifRepository.GetNombreJustifsValidesByUtilisateur(userId);
            etats[3] = _JustificatifRepository.GetNombreJustifsRefusesByUtilisateur(userId);
            etats[4] = _JustificatifRepository.GetNombreJustifsAreviser(userId);

            return Ok(etats);
        }

        [HttpGet("etats_justifs/validateur")]
        public IActionResult getEtatsValidateur()
        {
            int userId = 0;
            if (HttpContext.User.Claims.ToArray().Length != 0)
            {
                userId = int.Parse(HttpContext.User.Claims.ToArray()[0].Value);
            }

            if (userId == 0)
                return Unauthorized("Utilisateur non trouvé. Veuillez vérifier votre login!");

            int[] etats = new int[5];
            etats[0] = _JustificatifRepository.GetNombreJustifsAmettreCircuit(userId);
            etats[1] = _JustificatifRepository.GetNombreJustifsAvalider(userId);
            etats[2] = _JustificatifRepository.GetNombreJustifsEnCoursValidateur(userId);
            etats[3] = _JustificatifRepository.GetNombreJustifsRefuseesValidateur(userId);
            etats[4] = _JustificatifRepository.GetNombreJustifsValidesValidateur(userId);
            

            return Ok(etats);
        }

        [HttpGet("etats_justifs/admin")]
        public IActionResult getEtatsAdmin()
        {
            int userId = 0;
            if (HttpContext.User.Claims.ToArray().Length != 0)
            {
                userId = int.Parse(HttpContext.User.Claims.ToArray()[0].Value);
            }

            if (userId == 0)
                return Unauthorized("Utilisateur non trouvé. Veuillez vérifier votre login!");

            int[] etats = new int[5];
            etats[0] = _JustificatifRepository.GetNombreJustifsAmettreCircuit(userId);
            etats[1] = _JustificatifRepository.GetNombreJustifsAvalider(userId);
            etats[2] = _JustificatifRepository.GetNombreJustifsEnCoursAdmin(userId);
            etats[3] = _JustificatifRepository.GetNombreJustifsRefuseesAdmin(userId);
            etats[4] = _JustificatifRepository.GetNombreJustifsValidesValidateur(userId);


            return Ok(etats);
        }
    }

}
