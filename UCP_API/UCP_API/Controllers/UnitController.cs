using Microsoft.AspNetCore.Mvc;
using UCP_API.repositories;
using UCP_API.models;

namespace UCP_API.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class UnitController : ControllerBase
    {
        private readonly UnitRepository _UnitRepository;

        public UnitController(UnitRepository UnitRepository)
        {
            _UnitRepository = UnitRepository;
        }

        [HttpGet]
        public IActionResult GetAllUnitx()
        {
            List<Unit> Units = _UnitRepository.GetUnits();
            return Ok(Units);
        }

        [HttpGet("{id}")]
        public IActionResult GetUnit(int id)
        {
            Unit Unit = _UnitRepository.GetUnitById(id);
            return Ok(Unit);
        }

        [HttpPost]
        public IActionResult CreateUnit([FromBody] Unit Unit)
        {
            _UnitRepository.AddUnit(Unit);
            return Ok(Unit);
        }

        [HttpPut]
        public IActionResult UpdateUnit([FromBody] Unit Unit)
        {
            _UnitRepository.UpdateUnit(Unit);
            return Ok(Unit);
        }

        [HttpDelete("{id}")]
        public string DeleteUnit(int id)
        {
            _UnitRepository.DeleteUnit(id);
            return "Unit deleted";
        }
    }

}
