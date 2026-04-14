using Microsoft.AspNetCore.Mvc;
using UCP_API.repositories;
using UCP_API.models;

namespace UCP_API.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class RoleController : ControllerBase
    {
        private readonly RoleRepository _RoleRepository;

        public RoleController(RoleRepository RoleRepository)
        {
            _RoleRepository = RoleRepository;
        }

        [HttpGet]
        public IActionResult GetAllRolex()
        {
            List<Role> Roles = _RoleRepository.GetRoles();
            return Ok(Roles);
        }

        [HttpGet("{id}")]
        public IActionResult GetRole(int id)
        {
            Role Role = _RoleRepository.GetRoleById(id);
            return Ok(Role);
        }

        [HttpPost]
        public IActionResult CreateRole([FromBody] Role Role)
        {
            _RoleRepository.AddRole(Role);
            return Ok(Role);
        }

        [HttpPut]
        public IActionResult UpdateRole([FromBody] Role Role)
        {
            _RoleRepository.UpdateRole(Role);
            return Ok(Role);
        }

        [HttpDelete("{id}")]
        public string DeleteRole(int id)
        {
            _RoleRepository.DeleteRole(id);
            return "Role deleted";
        }
    }

}
