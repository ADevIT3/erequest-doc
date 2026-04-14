using Microsoft.AspNetCore.Mvc;
using UCP_API.repositories;
using UCP_API.models;
using UCP_API.utils;
using System.IO;

namespace UCP_API.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class RequeteJustificatifController : ControllerBase
    {
        private readonly RequeteJustificatifRepository _RequeteJustificatifRepository;
        private readonly RequeteRepository _RequeteRepository;
        private readonly IWebHostEnvironment _webHostEnvironment;
       

        public RequeteJustificatifController(RequeteJustificatifRepository RequeteJustificatifRepository, IWebHostEnvironment webHostEnvironment, RequeteRepository requeteRepository)
        {
            _RequeteJustificatifRepository = RequeteJustificatifRepository;
            _webHostEnvironment = webHostEnvironment;
            _RequeteRepository = requeteRepository;
        }

        [HttpGet]
        public IActionResult GetAllRequeteJustificatifx()
        {
            List<RequeteJustificatif> RequeteJustificatifs = _RequeteJustificatifRepository.GetRequeteJustificatifs();
            return Ok(RequeteJustificatifs);
        }

        [HttpGet("{id}")]
        public IActionResult GetRequeteJustificatif(int id)
        {
            RequeteJustificatif RequeteJustificatif = _RequeteJustificatifRepository.GetRequeteJustificatifById(id);
            return Ok(RequeteJustificatif);
        }

        // Nouvel endpoint pour télécharger et visualiser un justificatif
        [HttpGet("download/{id}")]
        public IActionResult DownloadJustificatif(int id)
        {
            try
            {
                // Récupérer le justificatif par son ID
                var justificatif = _RequeteJustificatifRepository.GetRequeteJustificatifById(id);
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
        [HttpGet("requete/{idRequete}")]
        public IActionResult GetJustificatifsByRequeteId(int idRequete)
        {
            List<RequeteJustificatif> justificatifs = _RequeteJustificatifRepository.GetRequeteJustificatifs()
                .Where(j => j.IdRequete == idRequete)
                .ToList();
            return Ok(justificatifs);
        }

        [HttpGet("justificatif/{idJustificatif}")]
        public IActionResult GetRequeteJustificatifByIdJustif(int idJustificatif)
        {
            List<RequeteJustificatif> justificatifs = _RequeteJustificatifRepository.GetRequeteJustificatifByIdJustif(idJustificatif);
            
            return Ok(justificatifs);
        }

        [HttpPost("justificatifs/{idRequete}")]
        public IActionResult CreateRequeteJustificatif([FromForm] IFormFile[] justificatifs, int idRequete)
        {
            //_RequeteJustificatifRepository.AddRequeteJustificatif(RequeteJustificatif);
            //return Ok(RequeteJustificatif);
            /*for(int i = 0;i < justificatifs.Length; i++)
            {*/
            string folderPath = ".\\wwwroot\\Stockages\\justificatifs";
            string fileName = ""; // e.g. "resume.pdf"
            string fullPath = "";
            int checking = 0;
            int invalides = 0;
            string extension = "";
            string uniqueName = "";

            Boolean isFileCreated = false;
            for (int i = 0; i < justificatifs.Length; i++)
            {
                //fileName = Path.GetFileName(justificatifs[i].FileName); // e.g. "resume.pdf"

                fileName = Path.GetFileNameWithoutExtension(justificatifs[i].FileName);
                extension = Path.GetExtension(justificatifs[i].FileName);

                uniqueName = $"{fileName}_{Guid.NewGuid()}{extension}";


                if (extension.ToLower() != ".pdf")
                {
                    checking = 1;
                    invalides++;
                }
                if (checking == 0)
                {


                    fullPath = Path.Combine(folderPath, uniqueName);

                    isFileCreated = FileUtil.SaveFile(justificatifs[i], fullPath);
                    if (isFileCreated == true)
                    {
                        RequeteJustificatif rj = new RequeteJustificatif();
                        rj.IdRequete = idRequete;
                        rj.Src = fullPath;
                        rj.DateCreation = DateTime.Now;

                        _RequeteJustificatifRepository.AddRequeteJustificatif(rj);
                    }
                }
                checking = 0;
            }
            if (invalides != justificatifs.Length) {
                _RequeteRepository.UpdateManquePj(idRequete, false);
            }
            
            /*}*/
            if(invalides != 0)
            {
                return Ok("Certains pièces jointes n'ont pas été enregistrées");
            }
            else
            {
                return Ok("Justificatifs enregistrées");
            }
            
        }


        [HttpPut]
        public IActionResult UpdateRequeteJustificatif([FromBody] RequeteJustificatif RequeteJustificatif)
        {
            _RequeteJustificatifRepository.UpdateRequeteJustificatif(RequeteJustificatif);
            return Ok(RequeteJustificatif);
        }

        [HttpDelete("{id}")]
        public string DeleteRequeteJustificatif(int id)
        {
            _RequeteJustificatifRepository.DeleteRequeteJustificatif(id);
            return "RequeteJustificatif deleted";
        }
    }

}