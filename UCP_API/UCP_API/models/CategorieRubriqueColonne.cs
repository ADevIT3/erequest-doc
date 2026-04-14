using System.ComponentModel.DataAnnotations.Schema;
using System.ComponentModel.DataAnnotations;

namespace UCP_API.models
{
    public class CategorieRubriqueColonne
    {
        [Key]
        [DatabaseGenerated(DatabaseGeneratedOption.Identity)]
        public int IdCategorieRubriqueColonne { get; set; }
        public int IdCategorieRubrique { get; set; }
        public string Nom { get; set; }
        public string Datatype { get; set; }
        public int IsFormule { get; set; }
        public int Numero { get; set; }
        public string? Formule { get; set; }
        public string? Role { get; set; }

        [NotMapped]
        public CategorieRubrique? CategorieRubrique { get; set; }
        public CategorieRubriqueColonne()
        {

        }
    }
}
