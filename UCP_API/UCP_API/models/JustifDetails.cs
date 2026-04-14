using System.ComponentModel.DataAnnotations.Schema;
using System.ComponentModel.DataAnnotations;
using UCP_API.dto;
using System.Text.Json.Serialization;

namespace UCP_API.models
{
    public class JustifDetails
    {
        [Key]
        [DatabaseGenerated(DatabaseGeneratedOption.Identity)]
        public int IdJustifDetails { get; set; }

        public int IdJustif { get; set; }
        [JsonIgnore]
        [ForeignKey("IdJustif")]
        public virtual Justificatif? Justificatif { get; set; }
        public int IdCategorieRubrique { get; set; }
        [ForeignKey("IdCategorieRubrique")]
        public virtual CategorieRubrique? CategorieRubrique { get; set; }
        /* public int IdRubrique { get; set; }
         [ForeignKey("IdRubrique")]
         public virtual Rubrique? Rubrique { get; set; }
        */
        public double Montant { get; set; }
        public double? MontantValide { get; set; }

        public string? Commentaire { get; set; } // Comment for categorie Autre

        public JustifDetails()
        {

        }
    }
}