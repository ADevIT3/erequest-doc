using System.Text.Json.Serialization;

namespace UCP_API.dto
{
    public class RefusJustifDTO
    {
        public int idCircuitEtape { get; set; }
        public string commentaire { get; set; } = "";
    }
}