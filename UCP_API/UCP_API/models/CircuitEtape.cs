using System.ComponentModel.DataAnnotations.Schema;
using System.ComponentModel.DataAnnotations;
using Microsoft.AspNetCore.Components.Server.Circuits;
using System.Text.Json.Serialization;
namespace UCP_API.models
{
    public class CircuitEtape
    {
        [Key]
        [DatabaseGenerated(DatabaseGeneratedOption.Identity)]
        public int idCircuitEtape { get; set; }
        public int idCircuit { get; set; }
        [ForeignKey(nameof(idCircuit))]
        [JsonIgnore]
        public Circuit Circuit { get; set; }

        public int numero { get; set; }
        public string description { get; set; }
        public int duree { get; set; }
        public bool? isPassMarche { get; set; }
        public DateTime creationdate { get; set; }
        public int createdby { get; set; }
        public DateTime? deletiondate { get; set; }
        public int? deletedby { get; set; }

        public bool? isModifiable { get; set; }

        public bool? isRefusable { get; set; }

        public bool? checkBudget { get; set; }

      

        public ICollection<CircuitEtapeValidateur> CircuitEtapeValidateurs { get; set; }  
        public ICollection<CircuitEtapeCheckList> CircuitEtapeCheckLists { get; set; }

        public CircuitEtape()
        {

        }
    }
}