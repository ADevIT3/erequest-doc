using System.Text.Json.Serialization;

namespace UCP_API.dto
{
    public class RedirectionJustifDTO
    {
        public string commentaire { get; set; } = "";
        public int idCircuitEtapeActuelle { get; set; }
        public int idCircuitEtapeRedirection { get; set; }
    }
}