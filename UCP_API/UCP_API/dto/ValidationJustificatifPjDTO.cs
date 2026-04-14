using System.Text.Json.Serialization;

namespace UCP_API.dto
{
    public class ValidationJustificatifPjDTO
    {
      
        public string validationnext { get; set; }
        public IFormFile[]? justificatifs { get; set; }
    }
}