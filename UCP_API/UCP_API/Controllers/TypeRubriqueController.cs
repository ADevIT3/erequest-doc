using Microsoft.AspNetCore.Mvc;
using UCP_API.repositories;
using UCP_API.models;

namespace UCP_API.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class TypeRubriqueController : ControllerBase
    {
        private readonly TypeRubriqueRepository _TypeRubriqueRepository;
        private readonly CategorieRubriqueRepository _CategorieRubriqueRepository;
        private readonly CategorieRubriqueColonneRepository _CategorieRubriqueColonneRepository;
        private readonly RubriqueRepository _RubriqueRepository;
        private readonly RequeteRubriqueRepository _RequeteRubriqueRepository;

        public TypeRubriqueController(TypeRubriqueRepository TypeRubriqueRepository, CategorieRubriqueRepository CategorieRubriqueRepository, CategorieRubriqueColonneRepository CategorieRubriqueColonneRepository, RubriqueRepository RubriqueRepository, RequeteRubriqueRepository RequeteRubriqueRepository)
        {
            _TypeRubriqueRepository = TypeRubriqueRepository;
            _CategorieRubriqueRepository = CategorieRubriqueRepository;
            _CategorieRubriqueColonneRepository = CategorieRubriqueColonneRepository;
            _RubriqueRepository = RubriqueRepository;
            _RequeteRubriqueRepository = RequeteRubriqueRepository;
        }
        [HttpGet]
        public IActionResult GetAllTypeRubriquex()
        {
            List<TypeRubrique> TypeRubriques = _TypeRubriqueRepository.GetTypeRubriques();
            return Ok(TypeRubriques);
        }

        [HttpGet("{id}")]
        public IActionResult GetTypeRubrique(int id)
        {
            TypeRubrique TypeRubrique = _TypeRubriqueRepository.GetTypeRubriqueById(id);
            return Ok(TypeRubrique);
        }

        [HttpPost]
        public IActionResult CreateTypeRubrique([FromBody] TypeRubrique TypeRubrique)
        {
            _TypeRubriqueRepository.AddTypeRubrique(TypeRubrique);
            return Ok(TypeRubrique);
        }

        [HttpGet("formulaire_rubrique_data")]
        public IActionResult GetAllTypeRubriquesFormulaire()
        {
            List<TypeRubrique> TypeRubriques = _TypeRubriqueRepository.GetTypeRubriques();
            for (int i = 0; i < TypeRubriques.Count(); i++)
            {
                TypeRubriques[i].CategorieRubriques = _CategorieRubriqueRepository.GetCategorieRubriquesByTypeRubrique(TypeRubriques[i].IdTypeRubrique);
                for (int j = 0; j < TypeRubriques[i].CategorieRubriques.Count(); j++)
                {
                    TypeRubriques[i].CategorieRubriques[j].CategorieRubriqueColonnes = _CategorieRubriqueColonneRepository.GetCategorieRubriqueColonnesByCategorie(TypeRubriques[i].CategorieRubriques[j].IdCategorieRubrique);
                    TypeRubriques[i].CategorieRubriques[j].Rubriques = _RubriqueRepository.GetRubriquesByCategorieRubrique(TypeRubriques[i].CategorieRubriques[j].IdCategorieRubrique);
                }
            }
            return Ok(TypeRubriques);
        }

        [HttpGet("formulaire_rubrique_modification_data/{idRequete}")]
        public IActionResult GetAllTypeRubriquesFormulaireModification(int idRequete)
        {
            List<TypeRubrique> TypeRubriques = _TypeRubriqueRepository.GetTypeRubriques();
            for (int i = 0; i < TypeRubriques.Count(); i++)
            {
                TypeRubriques[i].CategorieRubriques = _CategorieRubriqueRepository.GetCategorieRubriquesByTypeRubrique(TypeRubriques[i].IdTypeRubrique);
                for (int j = 0; j < TypeRubriques[i].CategorieRubriques.Count(); j++)
                {
                    TypeRubriques[i].CategorieRubriques[j].CategorieRubriqueColonnes = _CategorieRubriqueColonneRepository.GetCategorieRubriqueColonnesByCategorie(TypeRubriques[i].CategorieRubriques[j].IdCategorieRubrique);
                    TypeRubriques[i].CategorieRubriques[j].Rubriques = _RubriqueRepository.GetRubriquesByCategorieRubrique(TypeRubriques[i].CategorieRubriques[j].IdCategorieRubrique);

                    for (int k = 0; k < TypeRubriques[i].CategorieRubriques[j].Rubriques.Count(); k++)
                    {
                        Console.WriteLine("select * from getRequeteRubriquesOfRubriqueAndRequeteAndType("+ idRequete + "," + TypeRubriques[i].CategorieRubriques[j].Rubriques[k].IdRubrique + ","+ TypeRubriques[i].CategorieRubriques[j].IdCategorieRubrique+")" );
                        Console.WriteLine(i);
                        Console.WriteLine(j);
                        Console.WriteLine(k);

                        TypeRubriques[i].CategorieRubriques[j].Rubriques[k].RequeteRubriques = _RequeteRubriqueRepository.GetRequeteRubriquesByRequeteAndRubriqueAndType(idRequete, TypeRubriques[i].CategorieRubriques[j].Rubriques[k].IdRubrique, TypeRubriques[i].CategorieRubriques[j].IdCategorieRubrique, TypeRubriques[i].IdTypeRubrique);
/*Console.WriteLine(_RequeteRubriqueRepository.GetRequeteRubriquesByRequeteAndRubrique(idRequete, TypeRubriques[i].CategorieRubriques[j].Rubriques[k].IdRubrique, TypeRubriques[i].CategorieRubriques[j].IdCategorieRubrique).Count());
                        Console.WriteLine(TypeRubriques[i].CategorieRubriques[j].Rubriques[k].RequeteRubriques.Count());
                        Console.WriteLine(
    $"Rubrique object hash: {TypeRubriques[i].CategorieRubriques[j].Rubriques[k].GetHashCode()}, Rubrique ID: {TypeRubriques[i].CategorieRubriques[j].Rubriques[k].IdRubrique}"
);*/
                        if (j >= 1)
                        {
                            Console.WriteLine(TypeRubriques[0].CategorieRubriques[0].Rubriques[0].RequeteRubriques.Count());
                        }
                        
                    }
                }
            }
            for (int i = 0; i < TypeRubriques.Count(); i++)
            {
                
                for (int j = 0; j < TypeRubriques[i].CategorieRubriques.Count(); j++)
                {
                    for (int k = 0; k < TypeRubriques[i].CategorieRubriques[j].Rubriques.Count(); k++)
                    {
                        Console.WriteLine("select * from getRequeteRubriquesOfRubriqueAndRequete(" + idRequete + "," + TypeRubriques[i].CategorieRubriques[j].Rubriques[k].IdRubrique + "," + TypeRubriques[i].CategorieRubriques[j].IdCategorieRubrique + ")");
                        Console.WriteLine(i);
                        Console.WriteLine(j);
                        Console.WriteLine(k);
                        
                       
                        Console.WriteLine(TypeRubriques[i].CategorieRubriques[j].Rubriques[k].RequeteRubriques.Count());
                    }
                }
            }
            return Ok(TypeRubriques);
        }

        [HttpGet("formulaire_rubrique_modification_data_rubrique_multiple/{idRequete}")]
        public IActionResult GetAllTypeRubriquesFormulaireModificationRubriqueMultiple(int idRequete)
        {
            int RedondanceRubrique = 0;
            int RequeteRubriqueCount = 0;
            int RedondanceRubriqueIndividuelle = 0;

            List<TypeRubrique> TypeRubriques = _TypeRubriqueRepository.GetTypeRubriques();
            for (int i = 0; i < TypeRubriques.Count(); i++)
            {
                TypeRubriques[i].CategorieRubriques = _CategorieRubriqueRepository.GetCategorieRubriquesByTypeRubrique(TypeRubriques[i].IdTypeRubrique);
                for (int j = 0; j < TypeRubriques[i].CategorieRubriques.Count(); j++)
                {
                    TypeRubriques[i].CategorieRubriques[j].CategorieRubriqueColonnes = _CategorieRubriqueColonneRepository.GetCategorieRubriqueColonnesByCategorie(TypeRubriques[i].CategorieRubriques[j].IdCategorieRubrique);
                    TypeRubriques[i].CategorieRubriques[j].Rubriques = _RubriqueRepository.GetRubriquesByCategorieRubrique(TypeRubriques[i].CategorieRubriques[j].IdCategorieRubrique);

                    for (int k = 0; k < TypeRubriques[i].CategorieRubriques[j].Rubriques.Count() - RedondanceRubrique; k++)
                    {
                        Console.WriteLine("select * from getRequeteRubriquesOfRubriqueAndRequeteAndType(" + idRequete + "," + TypeRubriques[i].CategorieRubriques[j].Rubriques[k].IdRubrique + "," + TypeRubriques[i].CategorieRubriques[j].IdCategorieRubrique + ","+ TypeRubriques[i].IdTypeRubrique + ")");
                        Console.WriteLine(i);
                        Console.WriteLine(j);
                        Console.WriteLine(k);

                        TypeRubriques[i].CategorieRubriques[j].Rubriques[k].RequeteRubriques = _RequeteRubriqueRepository.GetRequeteRubriquesByRequeteAndRubriqueAndType(idRequete, TypeRubriques[i].CategorieRubriques[j].Rubriques[k].IdRubrique, TypeRubriques[i].CategorieRubriques[j].IdCategorieRubrique, TypeRubriques[i].IdTypeRubrique);
                        
                        for(int l = 1;l< TypeRubriques[i].CategorieRubriques[j].Rubriques[k].RequeteRubriques.Count(); l++)
                        {
                            //mijery raha miverina indroa le colonne 
                            if (TypeRubriques[i].CategorieRubriques[j].Rubriques[k].RequeteRubriques[0].IdCategorieRubriqueColonne == TypeRubriques[i].CategorieRubriques[j].Rubriques[k].RequeteRubriques[l].IdCategorieRubriqueColonne)
                            {
                                RedondanceRubrique++;
                                RedondanceRubriqueIndividuelle++;
                                //apina rubrique

                                TypeRubriques[i].CategorieRubriques[j].Rubriques.Add(new Rubrique());
                                    TypeRubriques[i].CategorieRubriques[j].Rubriques[TypeRubriques[i].CategorieRubriques[j].Rubriques.Count() - 1].IdRubrique = TypeRubriques[i].CategorieRubriques[j].Rubriques[k].IdRubrique;
                                    TypeRubriques[i].CategorieRubriques[j].Rubriques[TypeRubriques[i].CategorieRubriques[j].Rubriques.Count() - 1].Nom = TypeRubriques[i].CategorieRubriques[j].Rubriques[k].Nom;
                                    TypeRubriques[i].CategorieRubriques[j].Rubriques[TypeRubriques[i].CategorieRubriques[j].Rubriques.Count() - 1].RequeteRubriques = new List<RequeteRubrique>();

                                Console.WriteLine(TypeRubriques[i].CategorieRubriques[j].Rubriques[k].Nom);
                                    //mameno anle requeterubrique anle rubrique vao nampiana
                                    for (int  n = 0; n < TypeRubriques[i].CategorieRubriques[j].CategorieRubriqueColonnes.Count(); n++)
                                    {
                                        RequeteRubriqueCount++;
                                        TypeRubriques[i].CategorieRubriques[j].Rubriques[TypeRubriques[i].CategorieRubriques[j].Rubriques.Count() - 1].RequeteRubriques.Add(new RequeteRubrique());
                                        TypeRubriques[i].CategorieRubriques[j].Rubriques[TypeRubriques[i].CategorieRubriques[j].Rubriques.Count() - 1].RequeteRubriques[RequeteRubriqueCount-1].IdRequeteRubrique = TypeRubriques[i].CategorieRubriques[j].Rubriques[k].RequeteRubriques[l + n].IdRequeteRubrique;
                                        TypeRubriques[i].CategorieRubriques[j].Rubriques[TypeRubriques[i].CategorieRubriques[j].Rubriques.Count() - 1].RequeteRubriques[RequeteRubriqueCount - 1].IdRequete = TypeRubriques[i].CategorieRubriques[j].Rubriques[k].RequeteRubriques[l + n].IdRequete;
                                        TypeRubriques[i].CategorieRubriques[j].Rubriques[TypeRubriques[i].CategorieRubriques[j].Rubriques.Count() - 1].RequeteRubriques[RequeteRubriqueCount - 1].IdTypeRubrique = TypeRubriques[i].CategorieRubriques[j].Rubriques[k].RequeteRubriques[l + n].IdTypeRubrique;
                                        TypeRubriques[i].CategorieRubriques[j].Rubriques[TypeRubriques[i].CategorieRubriques[j].Rubriques.Count() - 1].RequeteRubriques[RequeteRubriqueCount - 1].IdCategorieRubriqueColonne = TypeRubriques[i].CategorieRubriques[j].Rubriques[k].RequeteRubriques[l + n].IdCategorieRubriqueColonne;
                                        TypeRubriques[i].CategorieRubriques[j].Rubriques[TypeRubriques[i].CategorieRubriques[j].Rubriques.Count() - 1].RequeteRubriques[RequeteRubriqueCount - 1].Valeur = TypeRubriques[i].CategorieRubriques[j].Rubriques[k].RequeteRubriques[l + n].Valeur;
                                        TypeRubriques[i].CategorieRubriques[j].Rubriques[TypeRubriques[i].CategorieRubriques[j].Rubriques.Count() - 1].RequeteRubriques[RequeteRubriqueCount - 1].IdRubrique = TypeRubriques[i].CategorieRubriques[j].Rubriques[k].RequeteRubriques[l + n].IdRubrique;
                                    }
                                RequeteRubriqueCount = 0;
                            }
                        }
                        
                        if (RedondanceRubriqueIndividuelle != 0)
                        {
                            //manala anle requeterubriques fanampiny 
                            TypeRubriques[i].CategorieRubriques[j].Rubriques[k].RequeteRubriques.RemoveRange(TypeRubriques[i].CategorieRubriques[j].CategorieRubriqueColonnes.Count(), TypeRubriques[i].CategorieRubriques[j].Rubriques[k].RequeteRubriques.Count() - TypeRubriques[i].CategorieRubriques[j].CategorieRubriqueColonnes.Count());
                        }
                        RedondanceRubriqueIndividuelle = 0;

                        /*Console.WriteLine(_RequeteRubriqueRepository.GetRequeteRubriquesByRequeteAndRubrique(idRequete, TypeRubriques[i].CategorieRubriques[j].Rubriques[k].IdRubrique, TypeRubriques[i].CategorieRubriques[j].IdCategorieRubrique).Count());
                                                Console.WriteLine(TypeRubriques[i].CategorieRubriques[j].Rubriques[k].RequeteRubriques.Count());
                                                Console.WriteLine(
                            $"Rubrique object hash: {TypeRubriques[i].CategorieRubriques[j].Rubriques[k].GetHashCode()}, Rubrique ID: {TypeRubriques[i].CategorieRubriques[j].Rubriques[k].IdRubrique}"
                        );*/
                        if (j >= 1)
                        {
                            Console.WriteLine(TypeRubriques[0].CategorieRubriques[0].Rubriques[0].RequeteRubriques.Count());
                        }

                    }
                    RedondanceRubrique = 0;
                }
            }
            for (int i = 0; i < TypeRubriques.Count(); i++)
            {

                for (int j = 0; j < TypeRubriques[i].CategorieRubriques.Count(); j++)
                {
                    for (int k = 0; k < TypeRubriques[i].CategorieRubriques[j].Rubriques.Count(); k++)
                    {
                        Console.WriteLine("select * from getRequeteRubriquesOfRubriqueAndRequete(" + idRequete + "," + TypeRubriques[i].CategorieRubriques[j].Rubriques[k].IdRubrique + "," + TypeRubriques[i].CategorieRubriques[j].IdCategorieRubrique + ")");
                        Console.WriteLine(i);
                        Console.WriteLine(j);
                        Console.WriteLine(k);


                        Console.WriteLine(TypeRubriques[i].CategorieRubriques[j].Rubriques[k].RequeteRubriques.Count());
                    }
                }
            }
            return Ok(TypeRubriques);
        }

        [HttpPut]
        public IActionResult UpdateTypeRubrique([FromBody] TypeRubrique TypeRubrique)
        {
            _TypeRubriqueRepository.UpdateTypeRubrique(TypeRubrique);
            return Ok(TypeRubrique);
        }

        [HttpDelete("{id}")]
        public string DeleteTypeRubrique(int id)
        {
            _TypeRubriqueRepository.DeleteTypeRubrique(id);
            return "TypeRubrique deleted";
        }
    }

}
