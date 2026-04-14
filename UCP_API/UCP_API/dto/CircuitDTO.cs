namespace UCP_API.dto
{
    public class CircuitDTO
    {
        public int IdCircuit { get; set; }
        public string Intitule { get; set; }
        public DateTime CreationDate { get; set; }
        public int CreatedBy { get; set; }

        public List<int> Projets { get; set; } = new();
        public List<int> Sites { get; set; } = new();

        public string Etapes { get; set; }
        public string DureeTotale { get; set; }
    }
}