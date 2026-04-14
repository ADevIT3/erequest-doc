using Microsoft.AspNetCore.Mvc;
using UCP_API.repositories;
using UCP_API.models;
using Azure.Core;

namespace UCP_API.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class RequeteRubriqueController : ControllerBase
    {
        private readonly RequeteRubriqueRepository _RequeteRubriqueRepository;
        private readonly RequeteRepository _RequeteRepository;

        public RequeteRubriqueController(RequeteRubriqueRepository RequeteRubriqueRepository, RequeteRepository RequeteRepository)
        {
            _RequeteRubriqueRepository = RequeteRubriqueRepository;
            _RequeteRepository = RequeteRepository;
        }

        [HttpGet]
        public IActionResult GetAllRequeteRubriquex()
        {
            List<RequeteRubrique> RequeteRubriques = _RequeteRubriqueRepository.GetRequeteRubriques();
            return Ok(RequeteRubriques);
        }

        [HttpGet("{id}")]
        public IActionResult GetRequeteRubrique(int id)
        {
            RequeteRubrique RequeteRubrique = _RequeteRubriqueRepository.GetRequeteRubriqueById(id);
            return Ok(RequeteRubrique);
        }

        [HttpPost]
        public IActionResult CreateRequeteRubrique([FromBody] RequeteRubrique RequeteRubrique)
        {
            _RequeteRubriqueRepository.AddRequeteRubrique(RequeteRubrique);
            return Ok(RequeteRubrique);
        }

        [HttpPut]
        public IActionResult UpdateRequeteRubrique([FromBody] RequeteRubrique RequeteRubrique)
        {
            _RequeteRubriqueRepository.UpdateRequeteRubrique(RequeteRubrique);
            return Ok(RequeteRubrique);
        }

        [HttpPut("list")]
        public IActionResult UpdateRequeteRubriques([FromBody] List<RequeteRubrique> RequeteRubriques)
        {
            if (RequeteRubriques.Count() != 0)
            {


                _RequeteRubriqueRepository.DeleteRequeteRubriquesOfRequete(RequeteRubriques[0].IdRequete);
                
                for (int i = 0; i < RequeteRubriques.Count(); i++)
                {
                    RequeteRubrique r = new RequeteRubrique();
                    r.IdRequete = RequeteRubriques[i].IdRequete;
                    r.IdTypeRubrique = RequeteRubriques[i].IdTypeRubrique;
                    r.IdCategorieRubriqueColonne = RequeteRubriques[i].IdCategorieRubriqueColonne;
                    r.Valeur = RequeteRubriques[i].Valeur;
                    r.IdRubrique = RequeteRubriques[i].IdRubrique;

                    _RequeteRubriqueRepository.AddRequeteRubrique(r);
                }
                if (RequeteRubriques.Count() != 0)
                {
                    double? montantValide = _RequeteRubriqueRepository.GetSommeRequeteRubriquesValideByRequete(RequeteRubriques[0].IdRequete);
                    Requete r = _RequeteRepository.GetRequeteById(RequeteRubriques[0].IdRequete);
                    r.MontantValide = montantValide;
                    _RequeteRepository.UpdateRequete(r);
                }
            }
          
            return Ok("données mises à jour");
        }

        [HttpDelete("{id}")]
        public string DeleteRequeteRubrique(int id)
        {
            _RequeteRubriqueRepository.DeleteRequeteRubrique(id);
            return "RequeteRubrique deleted";
        }
    }

}
