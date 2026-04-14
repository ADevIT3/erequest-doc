namespace UCP_API.dto
{
    public class Tdb7JustifDTO
    {
        public string ProjetName { get; set; } = "";
        public string SiteName { get; set; } = "";
        public string NumeroEtape { get; set; } = "";
        public string IntituleEtape { get; set; } = "";
        public string Validateur { get; set; } = "";
        public string DateValidation { get; set; } = "";
        public string DureePrevue { get; set; } = "";
        public string DureeReelle { get; set; } = "";
        public string Retard { get; set; } = "";
        public string Avance { get; set; } = "";

        public string TotalDureePrevue { get; set; } = "";
        public string TotalDureeReelle { get; set; } = "";
        public string TotalRetardAvance { get; set; } = "";
        public string IntituleTotalRetardAvance { get; set; } = "";
    }
}