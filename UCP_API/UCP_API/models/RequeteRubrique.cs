using System.ComponentModel.DataAnnotations.Schema;
using System.ComponentModel.DataAnnotations;

namespace UCP_API.models
{
    public class RequeteRubrique
    {
        [Key]
        [DatabaseGenerated(DatabaseGeneratedOption.Identity)]
        public int IdRequeteRubrique { get; set; }

        public int IdRequete { get; set; }
        public int IdTypeRubrique { get; set; }
        public int IdCategorieRubriqueColonne { get; set; }
        public string Valeur { get; set; }
        public int IdRubrique { get; set; }

        //public justificatifs;

        public RequeteRubrique()
        {

        }
    }
}
