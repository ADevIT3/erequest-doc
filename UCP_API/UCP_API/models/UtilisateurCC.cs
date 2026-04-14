using System.ComponentModel.DataAnnotations.Schema;
using System.ComponentModel.DataAnnotations;
using System.Text.Json.Serialization;

namespace UCP_API.models
{
    public class UtilisateurCC
    {
        [Key]
        [DatabaseGenerated(DatabaseGeneratedOption.Identity)]
        public int idUtilisateurCC { get; set; }

        [ForeignKey(nameof(Utilisateur))]
        public int idUtilisateur { get; set; }
        public string? mailCC { get; set; }

        [JsonIgnore]
        public Utilisateur? Utilisateur { get; set; }
        

        public UtilisateurCC()
        {

        }
    }
}