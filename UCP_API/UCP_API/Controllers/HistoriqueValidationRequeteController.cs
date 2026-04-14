using Microsoft.AspNetCore.Mvc;
using UCP_API.repositories;
using UCP_API.models;
using Microsoft.AspNetCore.Hosting;
using Microsoft.EntityFrameworkCore.Metadata.Conventions;

namespace UCP_API.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class HistoriqueValidationRequeteController : ControllerBase
    {
        private readonly HistoriqueValidationRequeteRepository _HistoriqueValidationRequeteRepository;
        private readonly HistoriqueValidationRequetePjRepository _HistoriqueValidationRequetePjRepository;
        private readonly IWebHostEnvironment _webHostEnvironment;

        public HistoriqueValidationRequeteController(HistoriqueValidationRequeteRepository HistoriqueValidationRequeteRepository, HistoriqueValidationRequetePjRepository historiqueValidationRequetePjRepository)
        {
            _HistoriqueValidationRequeteRepository = HistoriqueValidationRequeteRepository;
            _HistoriqueValidationRequetePjRepository = historiqueValidationRequetePjRepository;
        }

        [HttpGet]
        public IActionResult GetAllHistoriqueValidationRequetex()
        {
            List<HistoriqueValidationRequete> HistoriqueValidationRequetes = _HistoriqueValidationRequeteRepository.GetHistoriqueValidationRequetes();
            return Ok(HistoriqueValidationRequetes);
        }

       
        

        [HttpGet("{id}")]
        public IActionResult GetHistoriqueValidationRequete(int id)
        {
            HistoriqueValidationRequete HistoriqueValidationRequete = _HistoriqueValidationRequeteRepository.GetHistoriqueValidationRequeteById(id);
            return Ok(HistoriqueValidationRequete);
        }

        [HttpPost]
        public IActionResult CreateHistoriqueValidationRequete([FromBody] HistoriqueValidationRequete HistoriqueValidationRequete)
        {
            _HistoriqueValidationRequeteRepository.AddHistoriqueValidationRequete(HistoriqueValidationRequete);
            return Ok(HistoriqueValidationRequete);
        }

        [HttpPut]
        public IActionResult UpdateHistoriqueValidationRequete([FromBody] HistoriqueValidationRequete HistoriqueValidationRequete)
        {
            _HistoriqueValidationRequeteRepository.UpdateHistoriqueValidationRequete(HistoriqueValidationRequete);
            return Ok(HistoriqueValidationRequete);
        }

        [HttpDelete("{id}")]
        public string DeleteHistoriqueValidationRequete(int id)
        {
            _HistoriqueValidationRequeteRepository.DeleteHistoriqueValidationRequete(id);
            return "HistoriqueValidationRequete deleted";
        }
    }

}
