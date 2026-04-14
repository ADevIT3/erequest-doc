using System.ComponentModel.DataAnnotations.Schema;
using System.ComponentModel.DataAnnotations;
using UCP_API.models;

namespace UCP_API.models
{
    public class CircuitRequete
    {
        [Key]
        [DatabaseGenerated(DatabaseGeneratedOption.Identity)]
        public int idCircuitRequete { get; set; }
        public int idRequete { get; set; }
        public int idCircuit { get; set; }
        //public DateTime? creationDate { get; set; }

        public CircuitRequete()
        {

        }
    }
}
