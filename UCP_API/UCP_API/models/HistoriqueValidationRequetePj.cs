using System.ComponentModel.DataAnnotations.Schema;
using System.ComponentModel.DataAnnotations;

namespace UCP_API.models
{
    public class HistoriqueValidationRequetePj
    {
        [Key]
        [DatabaseGenerated(DatabaseGeneratedOption.Identity)]
        public int IdHistoriqueValidationRequetePj { get; set; }
        public int IdHistoriqueValidationRequete { get; set; }
        public string Src { get; set; }
        public DateTime DateCreation { get; set; }
        //public DateTime? DateSuppression { get; set; }

        public HistoriqueValidationRequetePj()
        {
        
        }
    }
}
