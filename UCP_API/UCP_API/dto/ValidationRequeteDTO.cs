using System.Text.Json.Serialization;

namespace UCP_API.dto
{
    public class ValidationRequeteDTO
    {
        [JsonPropertyName("ispmskyp")]
        public bool ispmskyp { get; set; }
        public int idCircuitEtape { get; set; }
        public List<int> idValidateurNext { get; set; } = new();
        public string commentaire { get; set; } = "";
        public List<ValidationRequeteChecklistReponseDTO> Checklist { get; set; } = new();
        public IFormFile[]? justificatifs { get; set; } = Array.Empty<IFormFile>();
        public string? numBr { get; set; }
    }
}