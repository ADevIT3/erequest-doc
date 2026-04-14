using System.ComponentModel.DataAnnotations.Schema;
using System.ComponentModel.DataAnnotations;

namespace UCP_API.models
{
    public class UtilisateurSite
    {
        [Key]
        [DatabaseGenerated(DatabaseGeneratedOption.Identity)]
        public int IdUtilisateurSite { get; set; }
        public int IdUtilisateur { get; set; }
        public int IdSite { get; set; }

        [NotMapped]
        public Utilisateur? Utilisateur { get; set; }
        [NotMapped]
        public Site? Site { get; set; }

        public UtilisateurSite()
        {

        }
    }
}