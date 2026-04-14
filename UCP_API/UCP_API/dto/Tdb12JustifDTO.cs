namespace UCP_API.dto
{
    public class Tdb12JustifDTO
    {
        public string ProjetName { get; set; } = "";
        public string SiteName { get; set; } = "";
        public string Agmo { get; set; } = "";
        public int Envoye { get; set; }
        public int EnCours { get; set; }
        public int Valide { get; set; }
        public int Refuse { get; set; }
        public int Cloture { get; set; }
        public int Total => Envoye + EnCours + Refuse + Valide + Cloture; //Style hafa kely tsy mitovy TDB11 REQUETE => Tdb11RequeteDTO
    }
}