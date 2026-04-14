using System.Text.Json.Serialization;

namespace UCP_API.dto
{
    public class RefusRequeteDTO
    {
        public int idCircuitEtape { get; set; }
        public string commentaire { get; set; } = "";
    }
}