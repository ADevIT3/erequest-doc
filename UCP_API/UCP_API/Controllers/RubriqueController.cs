using Microsoft.AspNetCore.Mvc;
using UCP_API.repositories;
using UCP_API.models;

namespace UCP_API.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class RubriqueController : ControllerBase
    {
        private readonly RubriqueRepository _RubriqueRepository;

        public RubriqueController(RubriqueRepository RubriqueRepository)
        {
            _RubriqueRepository = RubriqueRepository;
        }

        [HttpGet]
        public IActionResult GetAllRubriquex()
        {
            List<Rubrique> Rubriques = _RubriqueRepository.GetRubriques();
            return Ok(Rubriques);
        }

        [HttpGet("categorie/{idCategorieRubrique}")]
        public IActionResult GetRubriquesByCategorie(int idCategorieRubrique)
        {
            List<Rubrique> Rubriques = _RubriqueRepository.GetRubriquesByCategorieRubrique(idCategorieRubrique);
            return Ok(Rubriques);
        }

        [HttpGet("requete/{idrequete}/categorie/{idCategorieRubrique}")]
        public IActionResult GetRubriquesByCategorie(int idRequete , int idCategorieRubrique)
        {
            List<Rubrique> Rubriques = _RubriqueRepository.GetRubriquesByCategorieAndRequete(idRequete,idCategorieRubrique);
            return Ok(Rubriques);
        }

        [HttpGet("{id}")]
        public IActionResult GetRubrique(int id)
        {
            Rubrique Rubrique = _RubriqueRepository.GetRubriqueById(id);
            return Ok(Rubrique);
        }

        [HttpPost]
        public IActionResult CreateRubrique([FromBody] Rubrique Rubrique)
        {
            _RubriqueRepository.AddRubrique(Rubrique);
            return Ok(Rubrique);
        }

        [HttpPut]
        public IActionResult UpdateRubrique([FromBody] Rubrique Rubrique)
        {
            _RubriqueRepository.UpdateRubrique(Rubrique);
            return Ok(Rubrique);
        }

        [HttpDelete("{id}")]
        public string DeleteRubrique(int id)
        {
            _RubriqueRepository.DeleteRubrique(id);
            return "Rubrique deleted";
        }
    }

}
