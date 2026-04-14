namespace UCP_API.dto
{
    public class CircuitEtapeCheckListDTO
    {
        public int idCircuitEtapeCheckList { get; set; }
        public int idCircuitEtape { get; set; }
        public string code { get; set; }
        public string libelle { get; set; }
        public DateTime creationdate { get; set; }
        public int createdby { get; set; }
        public DateTime? deletiondate { get; set; }
        public int? deletedby { get; set; }
        
    }
}