using System.ComponentModel.DataAnnotations.Schema;
using System.ComponentModel.DataAnnotations;

namespace UCP_API.models
{
    public class Projet
    {
        [Key]
        [DatabaseGenerated(DatabaseGeneratedOption.Identity)]
        public int idProjet { get; set; }
        public string nom { get; set; }
        public string storage { get; set; }
        public string serverName { get; set; }
        public string login { get; set; }
        public string password { get; set; }
        public string databaseName { get; set; }
        public DateTime? creationDate { get; set; }
        public int createdBy { get; set; }
        public DateTime? deletionDate { get; set; }
        public int? deletedBy { get; set; }

        [NotMapped]
        public ICollection<UtilisateurProjet>? UtilisateurProjets { get; set; } = new List<UtilisateurProjet>();

        public Projet()
        {

        }
    }
}