using Microsoft.AspNetCore.Mvc;
using UCP_API.repositories;
using UCP_API.models;

namespace UCP_API.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class TypeCategorieRubriqueController : ControllerBase
    {
        private readonly TypeCategorieRubriqueRepository _TypeCategorieRubriqueRepository;
        private readonly TypeRubriqueRepository _TypeRubriqueRepository;
        private readonly CategorieRubriqueRepository _CategorieRubriqueRepository;

        public TypeCategorieRubriqueController(TypeCategorieRubriqueRepository TypeCategorieRubriqueRepository, TypeRubriqueRepository TypeRubriqueRepository, CategorieRubriqueRepository CategorieRubriqueRepository)
        {
            _TypeCategorieRubriqueRepository = TypeCategorieRubriqueRepository;
            _TypeRubriqueRepository = TypeRubriqueRepository;
            _CategorieRubriqueRepository = CategorieRubriqueRepository;
        }

        [HttpGet]
        public IActionResult GetAllTypeCategorieRubriquex()
        {
            List<TypeCategorieRubrique> TypeCategorieRubriques = _TypeCategorieRubriqueRepository.GetTypeCategorieRubriques();
            for (int i = 0; i < TypeCategorieRubriques.Count(); i++)
            {
                var typeRubrique = _TypeRubriqueRepository.GetTypeRubriqueById(TypeCategorieRubriques[i].IdTypeRubrique);
                var categorieRubrique = _CategorieRubriqueRepository.GetCategorieRubriqueById(TypeCategorieRubriques[i].IdCategorieRubrique);
                
                if (typeRubrique != null)
                {
                    TypeCategorieRubriques[i].TypeRubrique = typeRubrique;
                }
                if (categorieRubrique != null)
                {
                    TypeCategorieRubriques[i].CategorieRubrique = categorieRubrique;
                }
            }
            return Ok(TypeCategorieRubriques);
        }
        [HttpGet("{id}")]
        public IActionResult GetTypeCategorieRubrique(int id)
        {
            TypeCategorieRubrique TypeCategorieRubrique = _TypeCategorieRubriqueRepository.GetTypeCategorieRubriqueById(id);
            return Ok(TypeCategorieRubrique);
        }

        [HttpPost]
        public IActionResult CreateTypeCategorieRubrique([FromBody] TypeCategorieRubrique TypeCategorieRubrique)
        {
            _TypeCategorieRubriqueRepository.AddTypeCategorieRubrique(TypeCategorieRubrique);
            return Ok(TypeCategorieRubrique);
        }

        [HttpPost("batch")]
        public IActionResult CreateTypeCategorieRubriques([FromBody] List<TypeCategorieRubrique> TypeCategorieRubriques)
        {
            foreach (var TypeCategorieRubrique in TypeCategorieRubriques)
            {
                _TypeCategorieRubriqueRepository.AddTypeCategorieRubrique(TypeCategorieRubrique);
            }
            return Ok(TypeCategorieRubriques);
        }

        [HttpPut]
        public IActionResult UpdateTypeCategorieRubrique([FromBody] TypeCategorieRubrique TypeCategorieRubrique)
        {
            _TypeCategorieRubriqueRepository.UpdateTypeCategorieRubrique(TypeCategorieRubrique);
            return Ok(TypeCategorieRubrique);
        }

        [HttpDelete("{id}")]
        public string DeleteTypeCategorieRubrique(int id)
        {
            _TypeCategorieRubriqueRepository.DeleteTypeCategorieRubrique(id);
            return "TypeCategorieRubrique deleted";
        }
    }
}
