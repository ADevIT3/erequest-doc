using UCP_API.models;

namespace UCP_API.dto
{
    public class CircuitDetailsDTOV2
    {
        public Circuit Circuit { get; set; }
        public List<int> Projets { get; set; }
        public List<int> Sites { get; set; }
        public List<CircuitEtapeDTOV2> Etapes { get; set; }
        public string DureeTotale { get; set; }
        public bool isUsed { get; set; }
    }
}