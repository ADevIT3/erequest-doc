using System.Text.Json.Serialization;

namespace UCP_API.dto
{
    public class FiltresDTO
    {
        public List<int>? idprojets { get; set; } = new();
        public List<int>? idsites { get; set; } = new();
        public List<int>? idagmos { get; set; } = new();
        public DateTime? datedu { get; set; } = new();
        public DateTime? dateau { get; set; } = new();
        public int? statut { get; set; }

        public string? numero { get; set; }
        public string? refinterne { get; set; }
        public string? etattrj { get; set; }

        public int? circuit { get; set; }
    }
}