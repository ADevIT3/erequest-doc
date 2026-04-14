namespace UCP_API.dto
{
    public class Tdb14RequeteJustifDTO
    {
        public string ProjetName { get; set; } = "";
        public string SiteName { get; set; } = "";
        public string Agmo { get; set; } = "";
        public string Demandeur { get; set; } = "";
        public string NumeroRequete { get; set; } = "";
        public string NumeroJustif { get; set; } = "";
        public string Objet { get; set; } = "";
        public string Statut { get; set; } = "";
        public string MontantRequeteValide { get; set; } = "";
        public string MontantJustif { get; set; } = "";
        public string MontantReste { get; set; } = "";
        public string DateFinExecution { get; set; } = "";
        public string DateFinEcheance { get; set; } = "";
        public string Retard { get; set; } = "";
    }
}