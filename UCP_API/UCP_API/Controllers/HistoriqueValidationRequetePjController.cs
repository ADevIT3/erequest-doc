using Microsoft.AspNetCore.Mvc;
using UCP_API.repositories;
using UCP_API.models;
using Microsoft.AspNetCore.Hosting;

namespace UCP_API.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class HistoriqueValidationRequetePjController : ControllerBase
    {
        private readonly HistoriqueValidationRequetePjRepository _HistoriqueValidationRequetePjRepository;
        private readonly IWebHostEnvironment _webHostEnvironment;

        public HistoriqueValidationRequetePjController(HistoriqueValidationRequetePjRepository HistoriqueValidationRequetePjRepository, IWebHostEnvironment webHostEnvironment)
        {
            _HistoriqueValidationRequetePjRepository = HistoriqueValidationRequetePjRepository;
            _webHostEnvironment = webHostEnvironment;
        }

        [HttpGet]
        public IActionResult GetAllHistoriqueValidationRequetePjx()
        {
            List<HistoriqueValidationRequetePj> HistoriqueValidationRequetePjs = _HistoriqueValidationRequetePjRepository.GetHistoriqueValidationRequetePjs();
            return Ok(HistoriqueValidationRequetePjs);
        }

        [HttpGet("{id}")]
        public IActionResult GetHistoriqueValidationRequetePj(int id)
        {
            HistoriqueValidationRequetePj HistoriqueValidationRequetePj = _HistoriqueValidationRequetePjRepository.GetHistoriqueValidationRequetePjById(id);
            return Ok(HistoriqueValidationRequetePj);
        }

        [HttpGet("requete/{id}")]
        public IActionResult GetAllHistoriqueValidationRequetesByRequete(int id)
        {
            List<HistoriqueValidationRequetePj> HistoriqueValidationRequetes = _HistoriqueValidationRequetePjRepository.GetHistoriqueValidationRequetePjsByRequete(id);
            return Ok(HistoriqueValidationRequetes);
        }

        [HttpGet("preview/{id}")]
        public IActionResult PreviewValidationPj(int id)
        {
            try
            {
                var justificatif = _HistoriqueValidationRequetePjRepository.GetHistoriqueValidationRequetePjById(id);
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

                // ✅ Set the header on the actual HTTP Response object
                Response.Headers["Content-Disposition"] = $"inline; filename=\"{Path.GetFileName(filePath)}\"";

                return File(fileBytes, contentType);
            }
            catch (Exception ex)
            {
                return StatusCode(500, $"Erreur lors du téléchargement du justificatif: {ex.Message}");
            }
        }



        [HttpPost]
        public IActionResult CreateHistoriqueValidationRequetePj([FromBody] HistoriqueValidationRequetePj HistoriqueValidationRequetePj)
        {
            _HistoriqueValidationRequetePjRepository.AddHistoriqueValidationRequetePj(HistoriqueValidationRequetePj);
            return Ok(HistoriqueValidationRequetePj);
        }

        [HttpPut]
        public IActionResult UpdateHistoriqueValidationRequetePj([FromBody] HistoriqueValidationRequetePj HistoriqueValidationRequetePj)
        {
            _HistoriqueValidationRequetePjRepository.UpdateHistoriqueValidationRequetePj(HistoriqueValidationRequetePj);
            return Ok(HistoriqueValidationRequetePj);
        }

        [HttpDelete("{id}")]
        public string DeleteHistoriqueValidationRequetePj(int id)
        {
            _HistoriqueValidationRequetePjRepository.SoftDeleteHistoriqueValidationRequetePj(id);
            return "HistoriquevalidationRequete supprimé";
        }

        [HttpGet("requete/{id}/NotDeleted")]
        public IActionResult GetAllHistoriqueValidationRequetesByRequeteNotDeleted(int id)
        {
            List<HistoriqueValidationRequetePj> HistoriqueValidationRequetes = _HistoriqueValidationRequetePjRepository.GetHistoriqueValidationRequetePjsByRequeteNotDeleted(id);
            return Ok(HistoriqueValidationRequetes);
        }
        [HttpGet("requete/{id}/Deleted")]
        public IActionResult GetAllHistoriqueValidationRequetesByRequeteDeleted(int id)
        {
            List<HistoriqueValidationRequetePj> HistoriqueValidationRequetes = _HistoriqueValidationRequetePjRepository.GetHistoriqueValidationRequetePjsByRequeteDeleted(id);
            return Ok(HistoriqueValidationRequetes);
        }

    }

}
