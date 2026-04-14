using System.ComponentModel.DataAnnotations.Schema;
using System.ComponentModel.DataAnnotations;
using System.Text.Json.Serialization;

namespace UCP_API.models
{
    public class CircuitProjet
    {
        [Key]
        [DatabaseGenerated(DatabaseGeneratedOption.Identity)]
        public int idCircuitProjet { get; set; }
        public int idCircuit { get; set; }
        public int idProjet { get; set; }

        [ForeignKey(nameof(idCircuit))]
        [JsonIgnore]
        public Circuit? Circuit { get; set; }

        [ForeignKey(nameof(idProjet))]
        public Projet? Projet { get; set; }


        public CircuitProjet()
        {

        }
    }
}