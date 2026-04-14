namespace UCP_API.dto
{
    public class ChangePassword
    {
        public int IdUtilisateur { get; set; }
        public string AncienPassword { get; set; }
        public string NouveauPassword { get; set; }
    }
}