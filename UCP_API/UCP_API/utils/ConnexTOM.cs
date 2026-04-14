using UCP_API.dto;

namespace utils
{
    public class ConnexTOM
    {
        public static string ConnexTOMPRO(TomProConnection conntom)
        {
            var connectionString = conntom.Login == null || conntom.Password == null ?
                   $"Server={conntom.ServerName}; Database={conntom.DatabaseName}; Persist Security Info=False;Trusted_Connection=True; "
                   : $"Server={conntom.ServerName}; User Id={conntom.Login}; Password={conntom.Password}; Database={conntom.DatabaseName}; TrustServerCertificate=true; ";

            return connectionString;
        }
    }
}