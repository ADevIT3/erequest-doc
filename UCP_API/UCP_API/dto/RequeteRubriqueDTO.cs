using System.ComponentModel.DataAnnotations.Schema;
using System.ComponentModel.DataAnnotations;

namespace UCP_API.dto
{
    public class RequeteRubriqueDTO
    {
        public int IdRubrique { get; set; }
        public int IdTypeRubrique { get; set; }
        public int IdCategorieRubriqueColonne { get; set; }
        public string Valeur { get; set; }

        public RequeteRubriqueDTO()
        {

        }
    }
}
