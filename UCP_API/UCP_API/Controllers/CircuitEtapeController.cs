using Microsoft.AspNetCore.Mvc;
using UCP_API.repositories;
using UCP_API.models;

namespace UCP_API.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class CircuitEtapeController : ControllerBase
    {
        private readonly CircuitEtapeRepository _CircuitEtapeRepository;
        private readonly UtilisateurRepository _UtilisateurRepository;

        public CircuitEtapeController(CircuitEtapeRepository CircuitEtapeRepository, UtilisateurRepository utilisateurRepository)
        {
            _CircuitEtapeRepository = CircuitEtapeRepository;
            _UtilisateurRepository = utilisateurRepository;
        }

        [HttpGet]
        public IActionResult GetAllCircuitEtapex()
        {
            List<CircuitEtape> CircuitEtapes = _CircuitEtapeRepository.GetCircuitEtapes();
            return Ok(CircuitEtapes);
        }

        [HttpGet("{id}")]
        public IActionResult GetCircuitEtape(int id)
        {
            CircuitEtape CircuitEtape = _CircuitEtapeRepository.GetCircuitEtapeById(id);
            return Ok(CircuitEtape);
        }

        [HttpGet("circuit/{idCircuit}")]
        public IActionResult GetCircuitEtapeByCircuit(int idCircuit)
        {
            

            List<CircuitEtape> CircuitEtape = _CircuitEtapeRepository.GetCircuitEtapesByCircuit(idCircuit);
            for(int i = 0; i < CircuitEtape.Count(); i++)
            {
                foreach (var cevalidateur in CircuitEtape[i].CircuitEtapeValidateurs)                
                {
                    cevalidateur.Utilisateur = _UtilisateurRepository.GetUtilisateurById(cevalidateur.idValidateur);
                }
            }
         return Ok(CircuitEtape);
        }

        [HttpPost]
        public IActionResult CreateCircuitEtape([FromBody] CircuitEtape CircuitEtape)
        {
            _CircuitEtapeRepository.AddCircuitEtape(CircuitEtape);
            return Ok(CircuitEtape);
        }

        [HttpPut]
        public IActionResult UpdateCircuitEtape([FromBody] CircuitEtape CircuitEtape)
        {
            _CircuitEtapeRepository.UpdateCircuitEtape(CircuitEtape);
            return Ok(CircuitEtape);
        }

        [HttpDelete("{id}")]
        public string DeleteCircuitEtape(int id)
        {
            _CircuitEtapeRepository.DeleteCircuitEtape(id);
            return "CircuitEtape deleted";
        }
    }

}
