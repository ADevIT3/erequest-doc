using System.ComponentModel.DataAnnotations.Schema;
using UCP_API.models;

namespace UCP_API.dto
{
    public class CircuitProjetsSites
    {
        public Circuit Circuit { get; set; }
        public List<ProjetDTO> Projets { get; set; }
        public List<SiteDTO> Sites { get; set; }

        public string Etapes { get; set; }

        public string DureeTotale { get; set; }
    }
}