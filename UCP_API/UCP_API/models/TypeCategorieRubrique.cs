using System.ComponentModel.DataAnnotations.Schema;
using System.ComponentModel.DataAnnotations;

namespace UCP_API.models
{
    public class TypeCategorieRubrique
    {
        [Key]
        [DatabaseGenerated(DatabaseGeneratedOption.Identity)]
        public int IdTypeCategorieRubrique { get; set; }
        public int IdTypeRubrique { get; set; }
        public int IdCategorieRubrique { get; set; }

        [NotMapped]
        public CategorieRubrique? CategorieRubrique { get; set; }
        [NotMapped]
        public TypeRubrique? TypeRubrique { get; set; }
        
        public TypeCategorieRubrique()
        {
        }
    }
}
