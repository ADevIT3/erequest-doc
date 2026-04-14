namespace UCP_API.dto
{
    public class Tdb11RequeteDTO
    {
        public string ProjetName { get; set; } = "";
        public string SiteName { get; set; } = "";
        public string Agmo { get; set; } = "";
        public int Initie { get; set; }
        public int Envoye { get; set; }
        public int EnCours { get; set; }
        public int Valide { get; set; }
        public int Refuse { get; set; }
        public int Cloture { get; set; }
        public int Total { get; set; }
    }
}