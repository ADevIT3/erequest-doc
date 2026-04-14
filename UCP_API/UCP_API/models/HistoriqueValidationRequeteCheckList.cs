using System.ComponentModel.DataAnnotations.Schema;
using System.ComponentModel.DataAnnotations;

namespace UCP_API.models
{
    public class HistoriqueValidationRequeteCheckList
    {
        [Key]
        [DatabaseGenerated(DatabaseGeneratedOption.Identity)]
        public int idHistoriqueValidationRequeteCheckList { get; set; }
        public int idRequete { get; set; }
        public int idCircuitEtape { get; set; }
        public int idCircuitEtapeCheckList { get; set; }
        public bool? oui { get; set; }
        public bool? non { get; set; }
        public bool? nonapplicable { get; set; }
        public DateTime creationdate { get; set; }
        public int createdby { get; set; }

        public HistoriqueValidationRequeteCheckList()
        {

        }
    }
}