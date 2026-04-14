namespace UCP_API.dto
{
    public class HistoValidationDTO
    {
        public string IntituleEtape { get; set; } = "";
        public string Validateur { get; set; } = "";
        public string DateValidation { get; set; } = "";
        public string Commentaire { get; set; } = "";
        public string ListValidateur { get; set; } = "";
        public string ListValidateurPo { get; set; } = "";
        public string ListeCheckList { get; set; } = "";
    }
}