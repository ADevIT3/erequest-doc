using System.ComponentModel.DataAnnotations.Schema;
using System.ComponentModel.DataAnnotations;

namespace UCP_API.models
{
    public class UtilisateurProjet
    {
        [Key]
        [DatabaseGenerated(DatabaseGeneratedOption.Identity)]
        public int IdUtilisateurProjet { get; set; }
        public int IdUtilisateur { get; set; }
        public int IdProjet { get; set; }
        
         [NotMapped]
        public Utilisateur? Utilisateur { get; set; }
        [NotMapped]
        public Projet? Projet { get; set; }


        public UtilisateurProjet()
        {

        }
    }
}
