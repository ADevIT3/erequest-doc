namespace UCP_API.dto
{
    public class Tdb16RequeteJustifDTO
    {
        public string ProjetName { get; set; } = "";
        public string NumeroEtape { get; set; } = "";
        public string IntituleEtape { get; set; } = "";
        public List<string> Validateur { get; set; } = new List<string>();
        public string DureePrevue { get; set; } = "";
        public int Retard { get; set; } = 0;
        public int RetardTotal { get; set; } = 0;
    }
}