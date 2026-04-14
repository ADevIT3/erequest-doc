using System.ComponentModel.DataAnnotations.Schema;
using System.ComponentModel.DataAnnotations;

namespace UCP_API.models
{
    public class JustifDetailsDTO
    {
        [Key]
        [DatabaseGenerated(DatabaseGeneratedOption.Identity)]
        public int IdJustifDetails { get; set; }

        public int IdJustif { get; set; }
        public int IdCategorieRubrique { get; set; }

        //public int IdRubrique { get; set; }

        public double Montant { get; set; }

        public double? MontantValide { get; set; }

        public string? Commentaire { get; set; }


        public JustifDetailsDTO()
        {

        }
    }
}