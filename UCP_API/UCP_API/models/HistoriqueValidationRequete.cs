using System.ComponentModel.DataAnnotations.Schema;
using System.ComponentModel.DataAnnotations;

namespace UCP_API.models
{
    public class HistoriqueValidationRequete
    {
        [Key]
        [DatabaseGenerated(DatabaseGeneratedOption.Identity)]
        public int idHistoriqueValidationRequete { get; set; }
        public int idRequete { get; set; }
        public int idCircuitEtape { get; set; }
        public int? numero { get; set; }
        public int etatValidation { get; set; }
        public string? commentaire { get; set; }
        public DateTime? dateValidation { get; set; }
        public int? idValidateur { get; set; }
        public bool? isPotential { get; set; }
        public bool? isValidator { get; set; }
        public DateTime creationdate { get; set; }
        public int createdby { get; set; }
        public bool? isPassMarche { get; set; }
        public bool? isPassMarcheSkyp { get; set; }

        public HistoriqueValidationRequete()
        {

        }
    }
}