
using System.ComponentModel.DataAnnotations.Schema;
using System.ComponentModel.DataAnnotations;
using Microsoft.AspNetCore.Components.Server.Circuits;

namespace UCP_API.models
{
    public class HistoriqueValidationRequeteRedirection
    {
        [Key]
        [DatabaseGenerated(DatabaseGeneratedOption.Identity)]
        public int idHistoriqueValidationRequeteRedirection { get; set; }
        public int idRequete { get; set; }
        [ForeignKey(nameof(idRequete))]
        public Requete Requete { get; set; }

        public int idfrom { get; set; }
        public int idto { get; set; }
        public int isValidator { get; set; }
        public string? commentaire { get; set; }
        public DateTime creationdate { get; set; }

        public HistoriqueValidationRequeteRedirection()
        {

        }
    }
}