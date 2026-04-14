
using System.ComponentModel.DataAnnotations.Schema;
using System.ComponentModel.DataAnnotations;
using Microsoft.AspNetCore.Components.Server.Circuits;

namespace UCP_API.models
{
    public class HistoriqueValidationJustificatifRedirection
    {
        [Key]
        [DatabaseGenerated(DatabaseGeneratedOption.Identity)]
        public int idHistoriqueValidationJustificatifRedirection { get; set; }
        public int idJustif { get; set; }
        [ForeignKey(nameof(idJustif))]
        public Justificatif Justificatif { get; set; }

        public int idfrom { get; set; }
        public int idto { get; set; }
        public int isValidator { get; set; }
        public string? commentaire { get; set; }
        public DateTime creationdate { get; set; }

        public HistoriqueValidationJustificatifRedirection()
        {

        }
    }
}