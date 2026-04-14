using System.ComponentModel.DataAnnotations.Schema;
using System.ComponentModel.DataAnnotations;

namespace UCP_API.models
{
    public class HistoriqueValidationJustificatifPj
    {
        [Key]
        [DatabaseGenerated(DatabaseGeneratedOption.Identity)]
        public int IdHistoriqueValidationJustificatifPj { get; set; }
        public int IdHistoriqueValidationJustificatif { get; set; }
        public string Src { get; set; }
        public DateTime DateCreation { get; set; }
        public DateTime? DateSuppression { get; set; }
        public HistoriqueValidationJustificatifPj()
        {
        
        }
    }
}
