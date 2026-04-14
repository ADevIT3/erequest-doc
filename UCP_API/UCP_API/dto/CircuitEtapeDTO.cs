namespace UCP_API.dto
{
    public class CircuitEtapeDTO
    {
        public int? Id { get; set; }
        public int Numero { get; set; }
        public string Description { get; set; }
        public int Duree { get; set; }
        public bool? isPassMarche { get; set; }
        public List<int> Validateurs { get; set; } = new();
        public List<int> CheckList { get; set; } = new();
        public bool? isModifiable { get; set; }
        public bool? isRefusable { get; set; }
        public bool? checkBudget { get; set; }

    }
}