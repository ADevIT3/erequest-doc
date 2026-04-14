using System.ComponentModel.DataAnnotations.Schema;
using System.ComponentModel.DataAnnotations;
using System.Text.Json.Serialization;

namespace UCP_API.models
{
    public class CircuitSite
    {
        [Key]
        [DatabaseGenerated(DatabaseGeneratedOption.Identity)]
        public int idCircuitSite { get; set; }
        public int idCircuit { get; set; }
        public int idSite { get; set; }

        [ForeignKey(nameof(idCircuit))]
        [JsonIgnore]
        public Circuit? Circuit { get; set; }

        [ForeignKey(nameof(idSite))]
        public Site? Site { get; set; }

        public CircuitSite()
        {

        }
    }
}