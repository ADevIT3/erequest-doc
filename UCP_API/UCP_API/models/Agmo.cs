using System.ComponentModel.DataAnnotations.Schema;
using System.ComponentModel.DataAnnotations;
using System.Text.Json.Serialization;

namespace UCP_API.models
{
    public class Agmo
    {
        [Key]
        [DatabaseGenerated(DatabaseGeneratedOption.Identity)]
        public int idAgmo { get; set; }
        public string nom { get; set; }
        public DateTime? creationdate { get; set; }
        public int createdby { get; set; }
        public DateTime? deletiondate { get; set; }
        public int? deletedby { get; set; }

        [JsonIgnore]
        public ICollection<Utilisateur>? Utilisateurs { get; set; }

        public Agmo()
        {

        }
    }
}
