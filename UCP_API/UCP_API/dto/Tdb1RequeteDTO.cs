namespace UCP_API.dto
{
    public class Tdb1RequeteDTO
    {
        public string ProjetName { get; set; } = "";
        public string SiteName { get; set; } = "";
        public string Numero { get; set; } = "";
        public string Objet { get; set; } = "";
        public string DateSoumission { get; set; } = "";
        public string Demandeur { get; set; } = "";
        public string Montant { get; set; } = "";
        public string Statut { get; set; } = "";
        public string DateFinExecution { get; set; } = "";
        public string DateFinEcheance { get; set; } = "";
    }
}