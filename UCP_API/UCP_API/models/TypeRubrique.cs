using System.ComponentModel.DataAnnotations.Schema;
using System.ComponentModel.DataAnnotations;

namespace UCP_API.models
{
    public class TypeRubrique
    {
        [Key]
        [DatabaseGenerated(DatabaseGeneratedOption.Identity)]
        public int IdTypeRubrique { get; set; }
        
        public string Nom { get; set; }
        public bool NeedJustificatif { get; set; } 
        
        [NotMapped]
        public List<CategorieRubrique>? CategorieRubriques { get; set; }
        
        public TypeRubrique()
        {

        }
    }
}
