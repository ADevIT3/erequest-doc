using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Conventions;
using System.ComponentModel;
using System.Data.SqlClient;
using UCP_API.data;
using UCP_API.dto;
using UCP_API.models;
using utils;
using static System.Runtime.InteropServices.JavaScript.JSType;


namespace UCP_API.data
{
    public class SqlServerConnexion
    {

        public SqlServerConnexion()
        {
            
        }

        // Get all exercice by idProjet
        public static List<string> GetDatabases(DatabaseConnex d)
        {
            try
            {
                List<string> databases = new List<string>();
                // Connect to the master database
                var connectionString =
                    "Server=" + d.serveur + ";Database=master;User Id="+d.user+";Password="+d.password+";Encrypt=True;TrustServerCertificate=True;Max Pool Size=200;Min Pool Size=5";

                using (var conn = new SqlConnection(connectionString))
                using (var cmd = conn.CreateCommand())
                {
                    cmd.CommandText = "SELECT name FROM sys.databases ORDER BY name";

                    conn.Open();
                    using (var reader = cmd.ExecuteReader())
                    {
                        Console.WriteLine("Databases on instance:");
                        while (reader.Read())
                        {
                            Console.WriteLine(" • " + reader.GetString(0));
                            databases.Add(reader.GetString(0));
                        }
                    }
                }

                return databases;
            }
            catch (Exception ex) {
                return new List<string>();
            }
            
        }

    }
}