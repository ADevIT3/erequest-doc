namespace UCP_API.dto
{
    public class ValidationJustifChecklistReponseDTO
    {
        public int idCircuitEtapeCheckList { get; set; }
        public bool? oui { get; set; }
        public bool? non { get; set; }
        public bool? nonapplicable { get; set; }
    }
}