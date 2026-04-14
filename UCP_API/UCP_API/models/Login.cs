using System.ComponentModel.DataAnnotations.Schema;
using System.ComponentModel.DataAnnotations;

namespace UCP_API.models
{

    public class Login
    {
        public string Username { get; set; }
        public string Password { get; set; }
    }
}