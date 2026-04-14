namespace UCP_API.dto
{
    public class CreateCircuitDTO
    {
        public string Libelle { get; set; } = string.Empty;
        public List<int> Projets { get; set; } = new();
        public List<int> Sites { get; set; } = new();
        public List<CreateCircuitEtapeDTO> Etapes { get; set; } = new();
    }
}