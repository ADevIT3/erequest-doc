using System.ComponentModel.DataAnnotations.Schema;
using System.ComponentModel.DataAnnotations;
using System.Text.Json.Serialization;

namespace UCP_API.models
{
    public class CircuitEtapeCheckList
    {
        [Key]
        [DatabaseGenerated(DatabaseGeneratedOption.Identity)]
        public int idCircuitEtapeCheckList { get; set; }
        public int idCircuitEtape { get; set; }
        [ForeignKey(nameof(idCircuitEtape))]
        [JsonIgnore]
        public CircuitEtape CircuitEtape { get; set; }

        public string code { get; set; }
        public string libelle { get; set; }
        public DateTime creationdate { get; set; }
        public int createdby { get; set; }
        public DateTime? deletiondate { get; set; }
        public int? deletedby { get; set; }

        public CircuitEtapeCheckList()
        {

        }
    }
}