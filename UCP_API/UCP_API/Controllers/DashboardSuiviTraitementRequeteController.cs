using Microsoft.AspNetCore.Mvc;
using System.Threading.Tasks;
using UCP_API.repositories;
using UCP_API.dto;
using System.Collections.Generic;

namespace UCP_API.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class DashboardSuiviTraitementRequeteController : ControllerBase
    {
        private readonly DashboardSuiviTraitementRequeteRepository _repository;

        public DashboardSuiviTraitementRequeteController(
            DashboardSuiviTraitementRequeteRepository repository)
        {
            _repository = repository;
        }

        [HttpGet("requete-suivi-traitement")]
        public async Task<IActionResult> GetSuiviTraitementRequete(
            [FromQuery] int? idProjet,
            [FromQuery] int? idSite,
            [FromQuery] int? idCircuit,
            [FromQuery] DateTime? dateDebut,
            [FromQuery] DateTime? dateFin,
            [FromQuery] string? numRequete,
            [FromQuery] string? referenceInterne)
        {


            var data = await _repository.GetSuiviTraitementRequete(
                idProjet, idSite, idCircuit, dateDebut, dateFin, numRequete, referenceInterne);
            return Ok(data);
        }

        [HttpGet("etapes-circuit/{idCircuit}")]
        public async Task<IActionResult> GetEtapesCircuit(int idCircuit)
        {
            var etapes = await _repository.GetEtapesByCircuit(idCircuit);
            return Ok(etapes);
        }
    }
}