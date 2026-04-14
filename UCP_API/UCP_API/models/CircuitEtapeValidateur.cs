using System.ComponentModel.DataAnnotations.Schema;
using System.ComponentModel.DataAnnotations;
using Microsoft.AspNetCore.Components.Server.Circuits;
using System.Text.Json.Serialization;

namespace UCP_API.models
{
    public class CircuitEtapeValidateur
    {
        [Key]
        [DatabaseGenerated(DatabaseGeneratedOption.Identity)]
        public int idCircuitEtapeValidateur { get; set; }

        public int idCircuitEtape { get; set; }
        [ForeignKey(nameof(idCircuitEtape))]
        [JsonIgnore]
        public CircuitEtape CircuitEtape { get; set; }
        public int idValidateur { get; set; }
        public int numero { get; set; }
        public DateTime creationdate { get; set; }
        public int createdby { get; set; }
        public DateTime? deletiondate { get; set; }
        public int? deletedby { get; set; }
        public bool? isPassMarche { get; set; }

        [NotMapped]
        public Utilisateur Utilisateur { get; set; }


        public CircuitEtapeValidateur()
        {

        }
    }
}