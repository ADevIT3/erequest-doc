using Microsoft.AspNetCore.Mvc;
using UCP_API.repositories;
using UCP_API.models;

namespace UCP_API.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class CategorieRubriqueController : ControllerBase
    {
        private readonly CategorieRubriqueRepository _CategorieRubriqueRepository;
        private readonly CategorieRubriqueColonneRepository _CategorieRubriqueColonneRepository;


        public CategorieRubriqueController(CategorieRubriqueRepository CategorieRubriqueRepository, CategorieRubriqueColonneRepository categorieRubriqueColonneRepository)
        {
            _CategorieRubriqueRepository = CategorieRubriqueRepository;
            _CategorieRubriqueColonneRepository = categorieRubriqueColonneRepository;
        }

        [HttpGet]
        public IActionResult GetAllCategorieRubriquex()
        {
            List<CategorieRubrique> CategorieRubriques = _CategorieRubriqueRepository.GetCategorieRubriques();
            return Ok(CategorieRubriques);
        }

        [HttpGet("type/{idTypeRubrique}")]
        public IActionResult GetCategorieRubriquesByTypeRubrique(int idTypeRubrique)
        {
            List<CategorieRubrique> CategorieRubriques = _CategorieRubriqueRepository.GetCategorieRubriquesByTypeRubrique(idTypeRubrique);
            return Ok(CategorieRubriques);
        }

        [HttpGet("requete/{idRequete}")]
        public IActionResult GetCategorieRubriquesByRequete(int idRequete)
        {
            List<CategorieRubrique> CategorieRubriques = _CategorieRubriqueRepository.GetCategorieRubriquesOfRequete(idRequete);
            return Ok(CategorieRubriques);
        }

        [HttpGet("{id}")]
        public IActionResult GetCategorieRubrique(int id)
        {
            CategorieRubrique CategorieRubrique = _CategorieRubriqueRepository.GetCategorieRubriqueById(id);
            return Ok(CategorieRubrique);
        }

        //[HttpPost]
        //public IActionResult CreateCategorieRubrique([FromBody] CategorieRubrique CategorieRubrique)
        //{
        //    _CategorieRubriqueRepository.AddCategorieRubrique(CategorieRubrique);
        //    return Ok(CategorieRubrique);
        //}

        [HttpPut]
        public IActionResult UpdateCategorieRubrique([FromBody] CategorieRubrique CategorieRubrique)
        {
            _CategorieRubriqueRepository.UpdateCategorieRubrique(CategorieRubrique);
            return Ok(CategorieRubrique);
        }

        [HttpDelete("{id}")]
        public string DeleteCategorieRubrique(int id)
        {
            _CategorieRubriqueRepository.DeleteCategorieRubrique(id);
            return "CategorieRubrique deleted";
        }

        [HttpPost]
        public IActionResult CreateCategorieRubrique([FromBody] CategorieRubrique CategorieRubrique)
        {
            _CategorieRubriqueRepository.AddCategorieRubrique(CategorieRubrique);

            /*CategorieRubriqueColonne categorieRubriqueColonne1 = new CategorieRubriqueColonne(); ;
            categorieRubriqueColonne1.IdCategorieRubrique = CategorieRubrique.IdCategorieRubrique;
            categorieRubriqueColonne1.Nom = "Unit";
            categorieRubriqueColonne1.Datatype = "nombre";


            categorieRubriqueColonne1.IsFormule = 0;

            _CategorieRubriqueColonneRepository.AddCategorieRubriqueColonne(categorieRubriqueColonne1);*/

            CategorieRubriqueColonne categorieRubriqueColonne2 = new CategorieRubriqueColonne(); ;
            categorieRubriqueColonne2.IdCategorieRubrique = CategorieRubrique.IdCategorieRubrique;
            categorieRubriqueColonne2.Nom = "Total";
            categorieRubriqueColonne2.Datatype = "nombre";
            categorieRubriqueColonne2.Numero = 99;
            categorieRubriqueColonne2.IsFormule = 0;

            _CategorieRubriqueColonneRepository.AddCategorieRubriqueColonne(categorieRubriqueColonne2);

            CategorieRubriqueColonne categorieRubriqueColonne3 = new CategorieRubriqueColonne(); ;
            categorieRubriqueColonne3.IdCategorieRubrique = CategorieRubrique.IdCategorieRubrique;
            categorieRubriqueColonne3.Nom = "Total_valide";
            categorieRubriqueColonne3.Datatype = "nombre";
            categorieRubriqueColonne3.Numero = 100;
            categorieRubriqueColonne3.IsFormule = 0;

            _CategorieRubriqueColonneRepository.AddCategorieRubriqueColonne(categorieRubriqueColonne3);

            return Ok(CategorieRubrique);
        }

    }

}
