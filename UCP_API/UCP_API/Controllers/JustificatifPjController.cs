using Microsoft.AspNetCore.Mvc;
using UCP_API.repositories;
using UCP_API.models;
using UCP_API.utils;
using System.IO;

namespace UCP_API.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class JustifPjController : ControllerBase
    {
        private readonly JustifPjRepository _JustifPjRepository;
        private readonly JustificatifRepository _JustificatifRepository;

        private readonly IWebHostEnvironment _webHostEnvironment;
       

        public JustifPjController(JustifPjRepository JustifPjRepository, IWebHostEnvironment webHostEnvironment, JustificatifRepository justificatifRepository)
        {
            _JustifPjRepository = JustifPjRepository;
            _webHostEnvironment = webHostEnvironment;
            _JustificatifRepository = justificatifRepository;
        }

        [HttpGet]
        public IActionResult GetAllJustifPjx()
        {
            List<JustifPj> JustifPjs = _JustifPjRepository.GetJustifPjs();
            return Ok(JustifPjs);
        }

        [HttpGet("{id}")]
        public IActionResult GetJustifPj(int id)
        {
            JustifPj JustifPj = _JustifPjRepository.GetJustifPjById(id);
            return Ok(JustifPj);
        }

        // Nouvel endpoint pour télécharger et visualiser un justificatif
        [HttpGet("download/{id}")]
        public IActionResult DownloadJustificatif(int id)
        {
            try
            {
                // Récupérer le justificatif par son ID
                var justificatif = _JustifPjRepository.GetJustifPjById(id);
                if (justificatif == null)
                {
                    return NotFound($"Justificatif avec l'ID {id} non trouvé");
                }

                // Construire le chemin complet du fichier
                string rootPath = _webHostEnvironment.ContentRootPath;
                string filePath = Path.Combine(rootPath, justificatif.Src.TrimStart('\\', '/'));

                // Vérifier si le fichier existe
                if (!System.IO.File.Exists(filePath))
                {
                    return NotFound($"Le fichier n'existe pas sur le serveur: {filePath}");
                }

                // Déterminer le type MIME du fichier
                string contentType = "application/octet-stream"; // Par défaut
                string extension = Path.GetExtension(filePath).ToLowerInvariant();

                // Définir les types MIME courants
                if (extension == ".pdf") contentType = "application/pdf";
                else if (extension == ".jpg" || extension == ".jpeg") contentType = "image/jpeg";
                else if (extension == ".png") contentType = "image/png";
                else if (extension == ".gif") contentType = "image/gif";
                else if (extension == ".doc" || extension == ".docx") contentType = "application/msword";
                else if (extension == ".xls" || extension == ".xlsx") contentType = "application/vnd.ms-excel";
                else if (extension == ".txt") contentType = "text/plain";

                // Lire le fichier
                var fileBytes = System.IO.File.ReadAllBytes(filePath);

                // ✅ Set the header on the actual HTTP Response object
                Response.Headers["Content-Disposition"] = $"inline; filename=\"{Path.GetFileName(filePath)}\"";
                // Renvoyer le fichier
                return File(fileBytes, contentType);
            }
            catch (Exception ex)
            {
                return StatusCode(500, $"Erreur lors du téléchargement du justificatif: {ex.Message}");
            }
        }

       

        // Nouvel endpoint pour récupérer les justificatifs par idRequete
        [HttpGet("justificatif/{idJustificatif}")]
        public IActionResult GetJustificatifsByRequeteId(int idJustificatif)
        {
            List<JustifPj> justificatifs = _JustifPjRepository.GetJustifPjs()
                .Where(j => j.IdJustif == idJustificatif)
                .ToList();
            return Ok(justificatifs);
        }

        [HttpPost("justificatifs/{idJustif}")]
        public IActionResult CreateJustifPj([FromForm] IFormFile[] justificatifs, int idJustif)
        {
            //_JustifPjRepository.AddJustifPj(JustifPj);
            //return Ok(JustifPj);
            /*for(int i = 0;i < justificatifs.Length; i++)
            {*/
            string folderPath = ".\\wwwroot\\Stockages\\justificatifs";
            string fileName = ""; // e.g. "resume.pdf"
            string fullPath = "";

            string extension = "";
            string uniqueName = "";

            Boolean isFileCreated = false;
            for (int i = 0; i < justificatifs.Length; i++)
            {
                //fileName = Path.GetFileName(justificatifs[i].FileName); // e.g. "resume.pdf"

                fileName = Path.GetFileNameWithoutExtension(justificatifs[i].FileName);
                extension = Path.GetExtension(justificatifs[i].FileName);

                uniqueName = $"{fileName}_{Guid.NewGuid()}{extension}";
                fullPath = Path.Combine(folderPath, uniqueName);

                isFileCreated = FileUtil.SaveFile(justificatifs[i], fullPath);
                if (isFileCreated == true)
                {
                    JustifPj rj = new JustifPj();
                    rj.IdJustif = idJustif;
                    rj.Src = fullPath;
                    rj.DateCreation = DateTime.Now;

                    _JustifPjRepository.AddJustifPj(rj);
                }
            }
            _JustificatifRepository.UpdateManquePj(idJustif,false);

            /*}*/
            return Ok("ok");
        }


        [HttpPut]
        public IActionResult UpdateJustifPj([FromBody] JustifPj JustifPj)
        {
            _JustifPjRepository.UpdateJustifPj(JustifPj);
            return Ok(JustifPj);
        }

        [HttpDelete("{id}")]
        public string DeleteJustifPj(int id)
        {
            _JustifPjRepository.DeleteJustifPj(id);
            return "JustifPj deleted";
        }
    }

}