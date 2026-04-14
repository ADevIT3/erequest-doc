using System.ComponentModel.DataAnnotations.Schema;
using System.ComponentModel.DataAnnotations;

namespace UCP_API.models
{
    public class Circuit
    {
        [Key]
        [DatabaseGenerated(DatabaseGeneratedOption.Identity)]
        public int idCircuit { get; set; }

        //public int IdProjet { get; set; }
        public string intitule { get; set; }
        public DateTime creationdate { get; set; }
        public int createdby { get; set; }
        public DateTime? deletiondate { get; set; }
        public int? deletedby { get; set; }
        public bool? isdisabled { get; set; }


        public ICollection<CircuitSite>? CircuitSites { get; set; } = new List<CircuitSite>();

        public ICollection<CircuitProjet>? CircuitProjets { get; set; } = new List<CircuitProjet>();

        public ICollection<CircuitEtape>? CircuitEtapes { get; set; } = new List<CircuitEtape>();

        [NotMapped]
        public List<Site>? Sites { get; set; }

        [NotMapped]
        public List<Projet>? Projets { get; set; }

        public Circuit()
        {

        }
    }
}