using System.ComponentModel.DataAnnotations.Schema;
using System.ComponentModel.DataAnnotations;

namespace UCP_API.models
{
    public class Site
    {
        [Key]
        [DatabaseGenerated(DatabaseGeneratedOption.Identity)]
        public int idSite { get; set; }
        public string code { get; set; }
        public string nom { get; set; }
        public DateTime? creationdate { get; set; }
        public int createdby { get; set; }
        public DateTime? deletiondate { get; set; }
        public int? deletedby { get; set; }

        [NotMapped]
        public ICollection<UtilisateurSite>? UtilisateurSites { get; set; } = new List<UtilisateurSite>();

        public Site()
        {

        }
    }
}