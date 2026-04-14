using Microsoft.AspNetCore.Mvc;
using UCP_API.repositories;
using UCP_API.models;

namespace UCP_API.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class TypeRequeteController : ControllerBase
    {
        private readonly TypeRequeteRepository _TypeRequeteRepository;

        public TypeRequeteController(TypeRequeteRepository TypeRequeteRepository)
        {
            _TypeRequeteRepository = TypeRequeteRepository;
        }

        [HttpGet]
        public IActionResult GetAllTypeRequetes()
        {
            List<TypeRequete> TypeRequetes = _TypeRequeteRepository.GetTypeRequetes();
            return Ok(TypeRequetes);
        }

        [HttpGet("{id}")]
        public IActionResult GetTypeRequete(int id)
        {
            TypeRequete TypeRequete = _TypeRequeteRepository.GetTypeRequeteById(id);
            return Ok(TypeRequete);
        }

        [HttpPost]
        public IActionResult CreateTypeRequete([FromBody] TypeRequete TypeRequete)
        {
            _TypeRequeteRepository.AddTypeRequete(TypeRequete);
            return Ok(TypeRequete);
        }

        [HttpPut]
        public IActionResult UpdateTypeRequete([FromBody] TypeRequete TypeRequete)
        {
            _TypeRequeteRepository.UpdateTypeRequete(TypeRequete);
            return Ok(TypeRequete);
        }

        [HttpDelete("{id}")]
        public string DeleteTypeRequete(int id)
        {
            _TypeRequeteRepository.DeleteTypeRequete(id);
            return "TypeRequete deleted";
        }
    }
}
