using Microsoft.AspNetCore.Mvc;
using UCP_API.data;
using UCP_API.dto;

namespace UCP_API.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class SqlServerConnexionController : ControllerBase
    {
       

        public SqlServerConnexionController()
        {
            
        }

        [HttpGet]
        public IActionResult GetAllDatabases([FromQuery] string servername, [FromQuery] string login, [FromQuery] string password)
        {
            DatabaseConnex d = new DatabaseConnex();
            d.serveur = servername;
            d.user = login;
            d.password = password;
            List<string> Databases = SqlServerConnexion.GetDatabases(d);
            return Ok(Databases);
        }

        
    }

}
