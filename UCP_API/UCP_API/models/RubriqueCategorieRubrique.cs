using System.ComponentModel.DataAnnotations.Schema;
using System.ComponentModel.DataAnnotations;

namespace UCP_API.models
{
    public class RubriqueCategorieRubrique
    {
        [Key]
        [DatabaseGenerated(DatabaseGeneratedOption.Identity)]
        public int IdRubriqueCategorieRubrique { get; set; }
        public int IdRubrique { get; set; }
        public int IdCategorieRubrique { get; set; }

        [NotMapped]
        public Rubrique? Rubrique { get; set; }
        [NotMapped]
        public CategorieRubrique? CategorieRubrique { get; set; }
        public RubriqueCategorieRubrique()
        {
        }
    }
}
