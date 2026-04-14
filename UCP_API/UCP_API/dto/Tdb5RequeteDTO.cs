namespace UCP_API.dto
{
    public class Tdb5RequeteDTO
    {
        public string ProjetName { get; set; } = "";
        public string SiteName { get; set; } = "";
        public string Agmo { get; set; } = "";
        public string Numero { get; set; } = "";
        public string RefInterne { get; set; } = "";
        public string DateSoumission { get; set; } = "";
        public string DateFinExecution { get; set; } = "";
        public string DateFinEcheance { get; set; } = "";
       
        public string Objet { get; set; } = "";
       

        public string Statut { get; set; } = "";
        public string ARisque { get; set; } = "";
        public string EnRetard { get; set; } = "";
    }
}