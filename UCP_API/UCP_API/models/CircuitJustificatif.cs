using System.ComponentModel.DataAnnotations.Schema;
using System.ComponentModel.DataAnnotations;

namespace UCP_API.models
{
    public class CircuitJustificatif
    {
        [Key]
        [DatabaseGenerated(DatabaseGeneratedOption.Identity)]
        public int idCircuitJustificatif { get; set; }
        public int idJustif { get; set; }
        public int idCircuit { get; set; }

        public CircuitJustificatif()
        {

        }
    }
}