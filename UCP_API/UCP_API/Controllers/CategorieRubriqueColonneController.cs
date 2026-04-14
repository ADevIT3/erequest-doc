using Microsoft.AspNetCore.Mvc;
using UCP_API.repositories;
using UCP_API.models;

namespace UCP_API.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class CategorieRubriqueColonneController : ControllerBase
    {
        private readonly CategorieRubriqueColonneRepository _CategorieRubriqueColonneRepository;
        private readonly CategorieRubriqueRepository _CategorieRubriqueRepository;

        public CategorieRubriqueColonneController(CategorieRubriqueColonneRepository CategorieRubriqueColonneRepository, CategorieRubriqueRepository CategorieRubriqueRepository)
        {
            _CategorieRubriqueColonneRepository = CategorieRubriqueColonneRepository;
            _CategorieRubriqueRepository = CategorieRubriqueRepository;
        }

        [HttpGet]
        public IActionResult GetAllCategorieRubriqueColonnex()
        {
            List<CategorieRubriqueColonne> CategorieRubriqueColonnes = _CategorieRubriqueColonneRepository.GetCategorieRubriqueColonnes();
            for (int i = 0; i < CategorieRubriqueColonnes.Count(); i++)
            {
                var categorieRubrique = _CategorieRubriqueRepository.GetCategorieRubriqueById(CategorieRubriqueColonnes[i].IdCategorieRubrique);
                if (categorieRubrique != null)
                {
                    CategorieRubriqueColonnes[i].CategorieRubrique = categorieRubrique;
                }
            }
            return Ok(CategorieRubriqueColonnes);
        }

        [HttpGet("categorie/{idCategorieRubrique}")]
        public IActionResult GetAllCategorieRubriqueColonnesByCategorie(int idCategorieRubrique)
        {
            List<CategorieRubriqueColonne> CategorieRubriqueColonnes = _CategorieRubriqueColonneRepository.GetCategorieRubriqueColonnesByCategorie(idCategorieRubrique);
            return Ok(CategorieRubriqueColonnes);
        }

        [HttpGet("{id}")]
        public IActionResult GetCategorieRubriqueColonne(int id)
        {
            CategorieRubriqueColonne CategorieRubriqueColonne = _CategorieRubriqueColonneRepository.GetCategorieRubriqueColonneById(id);
            return Ok(CategorieRubriqueColonne);
        }

        [HttpPost]
        public IActionResult CreateCategorieRubriqueColonne([FromBody] CategorieRubriqueColonne CategorieRubriqueColonne)
        {
            _CategorieRubriqueColonneRepository.AddCategorieRubriqueColonne(CategorieRubriqueColonne);
            return Ok(CategorieRubriqueColonne);
        }

        [HttpPost("batch")]
        public IActionResult CreateCategorieRubriqueColonnes([FromBody] List<CategorieRubriqueColonne> CategorieRubriqueColonnes)
        {
            foreach (var CategorieRubriqueColonne in CategorieRubriqueColonnes)
            {
                _CategorieRubriqueColonneRepository.AddCategorieRubriqueColonne(CategorieRubriqueColonne);
            }
            return Ok(CategorieRubriqueColonnes);
        }

        [HttpPut]
        public IActionResult UpdateCategorieRubriqueColonne([FromBody] CategorieRubriqueColonne CategorieRubriqueColonne)
        {
            _CategorieRubriqueColonneRepository.UpdateCategorieRubriqueColonne(CategorieRubriqueColonne);
            return Ok(CategorieRubriqueColonne);
        }

        [HttpDelete("{id}")]
        public string DeleteCategorieRubriqueColonne(int id)
        {
            _CategorieRubriqueColonneRepository.DeleteCategorieRubriqueColonne(id);
            return "CategorieRubriqueColonne deleted";
        }
    }

}
