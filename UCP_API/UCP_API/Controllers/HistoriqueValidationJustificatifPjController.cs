using Microsoft.AspNetCore.Mvc;
using UCP_API.repositories;
using UCP_API.models;
using Microsoft.AspNetCore.Hosting;

namespace UCP_API.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class HistoriqueValidationJustificatifPjController : ControllerBase
    {
        private readonly HistoriqueValidationJustificatifPjRepository _HistoriqueValidationJustificatifPjRepository;
        private readonly IWebHostEnvironment _webHostEnvironment;

        public HistoriqueValidationJustificatifPjController(
            HistoriqueValidationJustificatifPjRepository HistoriqueValidationJustificatifPjRepository,
            IWebHostEnvironment webHostEnvironment)
        {
            _HistoriqueValidationJustificatifPjRepository = HistoriqueValidationJustificatifPjRepository;
            _webHostEnvironment = webHostEnvironment;
        }

        [HttpGet]
        public IActionResult GetAllHistoriqueValidationJustificatifPjx()
        {
            List<HistoriqueValidationJustificatifPj> HistoriqueValidationJustificatifPjs =
                _HistoriqueValidationJustificatifPjRepository.GetHistoriqueValidationJustificatifPjs();
            return Ok(HistoriqueValidationJustificatifPjs);
        }

        [HttpGet("{id}")]
        public IActionResult GetHistoriqueValidationJustificatifPj(int id)
        {
            HistoriqueValidationJustificatifPj HistoriqueValidationJustificatifPj =
                _HistoriqueValidationJustificatifPjRepository.GetHistoriqueValidationJustificatifPjById(id);
            return Ok(HistoriqueValidationJustificatifPj);
        }

        [HttpGet("justificatif/{id}")]
        public IActionResult GetAllHistoriqueValidationRequetesByRequete(int id)
        {
            List<HistoriqueValidationJustificatifPj> HistoriqueValidationRequetes =
                _HistoriqueValidationJustificatifPjRepository.GetHistoriqueValidationJustificatifPjsByRequete(id);
            return Ok(HistoriqueValidationRequetes);
        }

        [HttpGet("preview/{id}")]
        public IActionResult PreviewValidationPj(int id)
        {
            try
            {
                var justificatif = _HistoriqueValidationJustificatifPjRepository.GetHistoriqueValidationJustificatifPjById(id);
                if (justificatif == null)
                    return NotFound($"Justificatif avec l'ID {id} non trouvé");

                string rootPath = _webHostEnvironment.ContentRootPath;
                string filePath = Path.Combine(rootPath, justificatif.Src.TrimStart('\\', '/'));

                if (!System.IO.File.Exists(filePath))
                    return NotFound($"Le fichier n'existe pas sur le serveur: {filePath}");

                string contentType = "application/octet-stream";
                string extension = Path.GetExtension(filePath).ToLowerInvariant();

                if (extension == ".pdf") contentType = "application/pdf";
                else if (extension == ".jpg" || extension == ".jpeg") contentType = "image/jpeg";
                else if (extension == ".png") contentType = "image/png";
                else if (extension == ".gif") contentType = "image/gif";
                else if (extension == ".doc" || extension == ".docx") contentType = "application/msword";
                else if (extension == ".xls" || extension == ".xlsx") contentType = "application/vnd.ms-excel";
                else if (extension == ".txt") contentType = "text/plain";

                var fileBytes = System.IO.File.ReadAllBytes(filePath);

                Response.Headers["Content-Disposition"] = $"inline; filename=\"{Path.GetFileName(filePath)}\"";
                return File(fileBytes, contentType);
            }
            catch (Exception ex)
            {
                return StatusCode(500, $"Erreur lors du téléchargement du justificatif: {ex.Message}");
            }
        }

        [HttpPost]
        public IActionResult CreateHistoriqueValidationJustificatifPj([FromBody] HistoriqueValidationJustificatifPj HistoriqueValidationJustificatifPj)
        {
            _HistoriqueValidationJustificatifPjRepository.AddHistoriqueValidationJustificatifPj(HistoriqueValidationJustificatifPj);
            return Ok(HistoriqueValidationJustificatifPj);
        }

        [HttpPut]
        public IActionResult UpdateHistoriqueValidationJustificatifPj([FromBody] HistoriqueValidationJustificatifPj HistoriqueValidationJustificatifPj)
        {
            _HistoriqueValidationJustificatifPjRepository.UpdateHistoriqueValidationJustificatifPj(HistoriqueValidationJustificatifPj);
            return Ok(HistoriqueValidationJustificatifPj);
        }

        // DELETE endpoint for soft delete (like the other controller)
        [HttpDelete("{id}")]
        public IActionResult DeleteHistoriqueValidationJustificatifPj(int id)
        {
            try
            {
                _HistoriqueValidationJustificatifPjRepository.SoftDeleteHistoriqueValidationJustificatifPj(id);
                return Ok(new { message = "HistoriquevalidationJustificatifPj supprimé" });
            }
            catch (Exception ex)
            {
                return StatusCode(500, $"Erreur lors de la suppression: {ex.Message}");
            }
        }

        [HttpGet("justificatif/{id}/NotDeleted")]
        public IActionResult GetAllHistoriqueValidationJustificatifByRequeteNotDeleted(int id)
        {
            List<HistoriqueValidationJustificatifPj> HistoriqueValidationJustificatif =
                _HistoriqueValidationJustificatifPjRepository.GetHistoriqueValidationJustificatifPjsByRequeteNotDeleted(id);
            return Ok(HistoriqueValidationJustificatif);
        }

        [HttpGet("justificatif/{id}/Deleted")]
        public IActionResult GetAllHistoriqueValidationJustificatifByRequeteDeleted(int id)
        {
            List<HistoriqueValidationJustificatifPj> HistoriqueValidationJustificatif =
                _HistoriqueValidationJustificatifPjRepository.GetHistoriqueValidationJustificatifPjsByRequeteDeleted(id);
            return Ok(HistoriqueValidationJustificatif);
        }
    }
}