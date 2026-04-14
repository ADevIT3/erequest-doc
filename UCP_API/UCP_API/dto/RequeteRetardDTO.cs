namespace UCP_API.dto
{
    public class RequeteRetardDto
    {
        public string Projet { get; set; }
        public string Site { get; set; }
        public string NumeroRequete { get; set; }
        public string Objet { get; set; }
        public string AGMO { get; set; }
        public decimal MontantValide { get; set; }
        public decimal MontantJustifie { get; set; }
        public DateTime DateFinEcheance { get; set; }
        public double RetardHeures { get; set; }
    }
}