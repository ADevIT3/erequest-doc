using System.ComponentModel.DataAnnotations.Schema;
using System.ComponentModel.DataAnnotations;
using System.Text.Json.Serialization;

namespace UCP_API.models
{
    public class JustificatifAccuse
    {
        [Key]
        [DatabaseGenerated(DatabaseGeneratedOption.Identity)]
        public int idJustifAccuse { get; set; }

        public int idJustif { get; set; }

        [JsonIgnore]
        [ForeignKey(nameof(idJustif))]
        public Justificatif Justificatif { get; set; }

        public DateTime creationdate { get; set; }
        public int createdby { get; set; }
        public int? justifNumero { get; set; }
        public int? justifYear { get; set; }
        public string? justifSite { get; set; }
        public string? referenceInterne { get; set; }

        public JustificatifAccuse()
        {

        }
    }
}