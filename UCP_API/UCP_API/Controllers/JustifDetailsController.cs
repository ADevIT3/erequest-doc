using Microsoft.AspNetCore.Mvc;
using UCP_API.repositories;
using UCP_API.models;

namespace UCP_API.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class JustifDetailsController : ControllerBase
    {
        private readonly JustifDetailsRepository _JustifDetailsRepository;
        private readonly JustificatifRepository _JustificatifRepository;

        public JustifDetailsController(JustifDetailsRepository JustifDetailsRepository, JustificatifRepository justificatifRepository)
        {
            _JustifDetailsRepository = JustifDetailsRepository;
            _JustificatifRepository = justificatifRepository;
        }

        [HttpGet]
        public IActionResult GetAllJustifDetailsx()
        {
            List<JustifDetails> JustifDetails = _JustifDetailsRepository.GetJustifDetailss();
            return Ok(JustifDetails);
        }

        [HttpGet("{id}")]
        public IActionResult GetUnit(int id)
        {
            JustifDetails JustifDetails = _JustifDetailsRepository.GetJustifDetailsById(id);
            return Ok(JustifDetails);
        }

        [HttpPost]
        public IActionResult CreateJustifDetails([FromBody] JustifDetails JustifDetails)
        {
            _JustifDetailsRepository.AddJustifDetails(JustifDetails);
            return Ok(JustifDetails);
        }

        [HttpPut]
        public IActionResult UpdateJustifDetails([FromBody] JustifDetails JustifDetails)
        {
            _JustifDetailsRepository.UpdateJustifDetails(JustifDetails);
            return Ok(JustifDetails);
        }

        [HttpPut("montant_valide")]
        public IActionResult UpdateJustifDetailss([FromBody] List<JustifDetailsDTO> JustifDetailsDTO)
        {
            
            JustifDetails justifDetails = null;

            for(int i= 0; i < JustifDetailsDTO.Count; i++)
            {
                justifDetails = new JustifDetails();
                justifDetails.IdJustifDetails = JustifDetailsDTO[i].IdJustifDetails;
                justifDetails.IdJustif = JustifDetailsDTO[i].IdJustif;
                justifDetails.IdCategorieRubrique = JustifDetailsDTO[i].IdCategorieRubrique;
                justifDetails.Montant = JustifDetailsDTO[i].Montant;
                justifDetails.MontantValide = JustifDetailsDTO[i].MontantValide;

                _JustifDetailsRepository.UpdateJustifDetails(justifDetails);
            }

            double montantJustifValide = 0;
            for (int i = 0; i < JustifDetailsDTO.Count(); i++)
            {
                montantJustifValide = montantJustifValide + (double) JustifDetailsDTO[i].MontantValide;
            }

            if (JustifDetailsDTO.Count != 0)
            {
                _JustificatifRepository.UpdateJustificatifWithSql(JustifDetailsDTO[0].IdJustif, montantJustifValide);
            }


            return Ok("montants validés modifiés avec succès");
        }

        [HttpDelete("{id}")]
        public string DeleteUnit(int id)
        {
            _JustifDetailsRepository.DeleteJustifDetails(id);
            return "JustifDetails deleted";
        }
    }

}
