using System.Text.Json.Serialization;

namespace UCP_API.dto
{
    public class ValidationRequetePjDTO
    {
      
        public string validationnext { get; set; }
        public IFormFile[]? justificatifs { get; set; }
    }
}