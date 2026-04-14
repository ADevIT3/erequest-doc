using System.Text.Json.Serialization;

namespace UCP_API.dto
{
    public class ValidationJustifDTO
    {
        [JsonPropertyName("ispmskyp")]
        public bool ispmskyp { get; set; }
        public int idCircuitEtape { get; set; }
        public List<int> idValidateurNext { get; set; } = new();
        public string commentaire { get; set; } = "";
        public List<ValidationJustifChecklistReponseDTO> Checklist { get; set; } = new();
    }
}