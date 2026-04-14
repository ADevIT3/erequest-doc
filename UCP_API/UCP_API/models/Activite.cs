using System.ComponentModel.DataAnnotations.Schema;
using System.ComponentModel.DataAnnotations;

namespace UCP_API.models
{
    public class Activite
    {
        [Key]
        [DatabaseGenerated(DatabaseGeneratedOption.Identity)]
        public int idActivite { get; set; }
        public int idProjet { get; set; }
        public string code { get; set; }
        public string nom { get; set; }
        public DateTime? creationdate { get; set; }
        public int createdby { get; set; }
        public DateTime? deletiondate { get; set; }
        public int? deletedby { get; set; }

        [NotMapped]
        public Projet? Projet { get; set; }

        public Activite()
        {

        }
    }
}