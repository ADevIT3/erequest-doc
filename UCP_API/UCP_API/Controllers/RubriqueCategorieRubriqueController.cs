using Microsoft.AspNetCore.Mvc;
using UCP_API.repositories;
using UCP_API.models;

namespace UCP_API.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class RubriqueCategorieRubriqueController : ControllerBase
    {
        private readonly RubriqueCategorieRubriqueRepository _RubriqueCategorieRubriqueRepository;
        private readonly RubriqueRepository _RubriqueRepository;
        private readonly CategorieRubriqueRepository _CategorieRubriqueRepository;

        public RubriqueCategorieRubriqueController(RubriqueCategorieRubriqueRepository RubriqueCategorieRubriqueRepository, RubriqueRepository RubriqueRepository, CategorieRubriqueRepository CategorieRubriqueRepository)
        {
            _RubriqueCategorieRubriqueRepository = RubriqueCategorieRubriqueRepository;
            _RubriqueRepository = RubriqueRepository;
            _CategorieRubriqueRepository = CategorieRubriqueRepository;
        }

        [HttpGet]
        public IActionResult GetAllRubriqueCategorieRubriquex()
        {
            List<RubriqueCategorieRubrique> RubriqueCategorieRubriques = _RubriqueCategorieRubriqueRepository.GetRubriqueCategorieRubriques();
            for (int i = 0; i < RubriqueCategorieRubriques.Count(); i++)
            {
                var rubrique = _RubriqueRepository.GetRubriqueById(RubriqueCategorieRubriques[i].IdRubrique);
                var categorieRubrique = _CategorieRubriqueRepository.GetCategorieRubriqueById(RubriqueCategorieRubriques[i].IdCategorieRubrique);
                
                if (rubrique != null)
                {
                    RubriqueCategorieRubriques[i].Rubrique = rubrique;
                }
                if (categorieRubrique != null)
                {
                    RubriqueCategorieRubriques[i].CategorieRubrique = categorieRubrique;
                }
            }
            return Ok(RubriqueCategorieRubriques);
        }

        [HttpGet("{id}")]
        public IActionResult GetRubriqueCategorieRubrique(int id)
        {
            RubriqueCategorieRubrique RubriqueCategorieRubrique = _RubriqueCategorieRubriqueRepository.GetRubriqueCategorieRubriqueById(id);
            return Ok(RubriqueCategorieRubrique);
        }

        [HttpPost]
        public IActionResult CreateRubriqueCategorieRubrique([FromBody] RubriqueCategorieRubrique RubriqueCategorieRubrique)
        {
            _RubriqueCategorieRubriqueRepository.AddRubriqueCategorieRubrique(RubriqueCategorieRubrique);
            return Ok(RubriqueCategorieRubrique);
        }

        [HttpPost("batch")]
        public IActionResult CreateRubriqueCategorieRubriques([FromBody] List<RubriqueCategorieRubrique> RubriqueCategorieRubriques)
        {
            foreach (var RubriqueCategorieRubrique in RubriqueCategorieRubriques)
            {
                _RubriqueCategorieRubriqueRepository.AddRubriqueCategorieRubrique(RubriqueCategorieRubrique);
            }
            return Ok(RubriqueCategorieRubriques);
        }

        [HttpPut]
        public IActionResult UpdateRubriqueCategorieRubrique([FromBody] RubriqueCategorieRubrique RubriqueCategorieRubrique)
        {
            _RubriqueCategorieRubriqueRepository.UpdateRubriqueCategorieRubrique(RubriqueCategorieRubrique);
            return Ok(RubriqueCategorieRubrique);
        }

        [HttpDelete("{id}")]
        public string DeleteRubriqueCategorieRubrique(int id)
        {
            _RubriqueCategorieRubriqueRepository.DeleteRubriqueCategorieRubrique(id);
            return "RubriqueCategorieRubrique deleted";
        }
    }
}
