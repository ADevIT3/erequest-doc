using System.ComponentModel.DataAnnotations.Schema;
using System.ComponentModel.DataAnnotations;
using System.Text.Json.Serialization;
namespace UCP_API.models
{
    public class RequeteAccuse
    {
        [Key]
        [DatabaseGenerated(DatabaseGeneratedOption.Identity)]
        public int idRequeteAccuse { get; set; }
        public int idRequete { get; set; }
        [ForeignKey(nameof(idRequete))]
        [JsonIgnore]
        public Requete Requete { get; set; }
        public DateTime creationdate { get; set; }
        public int createdby { get; set; }
        public int? requeteNumero { get; set; }
        public int? requeteYear { get; set; }
        public string? requeteSite { get; set; }
        public string? referenceInterne { get; set; }

        public RequeteAccuse()
        {

        }
    }
}