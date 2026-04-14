using Microsoft.AspNetCore.Mvc;
using UCP_API.repositories;
using UCP_API.models;
using CsvHelper;
using System.Globalization;
using System.Text;
using UCP_API.dto;

namespace UCP_API.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class SiteController : ControllerBase
    {
        private readonly SiteRepository _SiteRepository;
        private readonly AgmoRepository _AgmoRepository;

        public SiteController(SiteRepository SiteRepository,AgmoRepository AgmoRepository)
        {
            _SiteRepository = SiteRepository;
            _AgmoRepository = AgmoRepository;
        }

        [HttpGet]
        public async Task<IActionResult> GetAllSites()
        {
            var sites = await _SiteRepository.GetSites();
            return Ok(sites);
        }

        [HttpGet("{id}")]
        public IActionResult GetSite(int id)
        {
            Site Site = _SiteRepository.GetSiteById(id);

            if (Site == null)
                return NotFound("Site non trouvé!");

            return Ok(Site);
        }

        [HttpGet("sitesbyuser")]
        public IActionResult GetSitesByUser()
        {
            //var currentUserId = int.Parse(HttpContext.User.Claims.FirstOrDefault(x => x.Type == "Id")!.Value);
            //Console.WriteLine("id="+HttpContext.User.Claims.ToArray()[0].Value);
            //var claim = HttpContext.User.Claims.FirstOrDefault(x => x.Type == "Id");
            int userId = 0;
            if (HttpContext.User.Claims.ToArray().Length != 0)
            {
                userId = int.Parse(HttpContext.User.Claims.ToArray()[0].Value);
            }

            if (userId == 0)
                return Unauthorized("Utilisateur non trouvé. Veuillez vérifier votre login!");

            //var currentUserId = int.Parse(claim.Value);

            var Site = _SiteRepository.GetSitesByIdUser(userId);

            if (Site == null)
                return NotFound("Projet non trouvé!");

            return Ok(Site);
        }


        [HttpPost]
        public async Task<IActionResult> CreateSite([FromBody] Site Site)
        {
            //var currentUserId = int.Parse(HttpContext.User.Claims.FirstOrDefault(x => x.Type == "Id")!.Value);
            var claim = HttpContext.User.Claims.FirstOrDefault(x => x.Type == "Id");
            if (claim == null)
                return Unauthorized("Utilisateur non trouvé. Veuillez vérifier votre login!");

            var currentUserId = int.Parse(claim.Value);

            var exist = await _SiteRepository.GetSiteByNameCode(Site.code, Site.nom);
            if (exist != null)
                return BadRequest("Site existe déjà!");

            _SiteRepository.AddSite(Site, currentUserId);
            Agmo agmo = new Agmo();
            agmo.nom = Site.nom;
            agmo.creationdate = DateTime.Now;
            agmo.createdby = currentUserId;


            _AgmoRepository.AddAgmo(agmo,currentUserId);
            return Ok(Site);
        }

        [HttpPut]
        public async Task<IActionResult> UpdateSite([FromBody] Site Site, int id)
        {
            var exist = await _SiteRepository.GetSiteByNameCodeId(Site.code, Site.nom, id);
            if (exist != null)
                return BadRequest("Site existe déjà!");

            var result = _SiteRepository.UpdateSite(Site, id);
            if (!result)
                return NotFound("Site non trouvé!");

            return Ok(Site);
        }

        [HttpDelete("{id}")]
        public IActionResult DeleteSite(int id)
        {
            //var currentUserId = int.Parse(HttpContext.User.Claims.FirstOrDefault(x => x.Type == "Id")!.Value);
            var claim = HttpContext.User.Claims.FirstOrDefault(x => x.Type == "Id");
            if (claim == null)
                return Unauthorized("Utilisateur non trouvé. Veuillez vérifier votre login!");

            var currentUserId = int.Parse(claim.Value);

            var result = _SiteRepository.DeleteSite(id, currentUserId);
            if (!result)
                return NotFound("Site non trouvé!");

            return Ok(new { message = "Site supprimé avec succès!" });
        }

        [HttpPost("import")]
        public IActionResult ImportSites(IFormFile file)
        {
            var claim = HttpContext.User.Claims.FirstOrDefault(x => x.Type == "Id");
            if (claim == null)
                return Unauthorized("Utilisateur non trouvé. Veuillez vérifier votre login!");
            var currentUserId = int.Parse(claim.Value);

            Encoding.RegisterProvider(CodePagesEncodingProvider.Instance); // Add this at the top of your method or app
            if (file == null || file.Length == 0)
            {
                return null;
            }

            Agmo agmo = null;
          
            //string filePath = "./import/Participants.csv";
            // Materialize the records into a list inside the using block.

            List<SiteDTO> doublons = new List<SiteDTO>();
            List<SiteDTO> records = new List<SiteDTO>();
            List<int> invalides = new List<int>();
            int i = 0;
            using (Stream stream = file.OpenReadStream())
            {
                var config = new CsvHelper.Configuration.CsvConfiguration(CultureInfo.InvariantCulture)
                {
                    Delimiter = ";"
                };
                using (var reader = new StreamReader(stream, Encoding.GetEncoding("ISO-8859-1")))
                {
                    using (var csv = new CsvReader(reader, config))
                    {
                        csv.Read();          // Moves to first line
                        csv.ReadHeader();
                        while (csv.Read())
                        {
                            // Check if the row is effectively blank (all fields empty)
                            bool isRowEmpty = false;
                            /*for (i = 0; i < csv.HeaderRecord.Length; i++)
                            {
                                Console.WriteLine(csv.GetField(i));
                                if (csv.GetField(i) == "" || csv.GetField(i) == " ")
                                {
                                    isRowEmpty = true;
                                    break;
                                }
                            }
                            */
                            if (isRowEmpty == true)
                            {
                                invalides.Add(i);
                                isRowEmpty = false;
                            }
                            else
                            {
                                SiteDTO record = new SiteDTO();
                                record.code = csv.GetField("Code");
                                record.nom = csv.GetField("Nom");
                                records.Add(record);
                            }

                        }
                        for (i = 0; i < records.Count(); i++)
                        {
                            Console.WriteLine(records[i].code);
                            Console.WriteLine(records[i].nom);
                        }

                        //csv.Context.RegisterClassMap<ParticipantRecordMap>();

                        //records = csv.GetRecords<ParticipantRecord>().ToList();
                        /*check doublon*/
                        for (int j = 0; j < records.Count; j++) {
                            Site? doublon = _SiteRepository.CheckDoublon(records[j].code, records[j].nom);
                            if (doublon == null) { 
                                Site s = new Site();
                                s.code = records[j].code;
                                s.nom = records[j].nom;
                                s.creationdate = DateTime.Now;
                                _SiteRepository.AddSite(s,currentUserId);

                                agmo = new Agmo();
                                agmo.nom = s.nom;
                                agmo.creationdate = DateTime.Now;
                                agmo.createdby = currentUserId;


                                _AgmoRepository.AddAgmo(agmo, currentUserId);
                            }
                            else
                            {
                                doublons.Add(records[j]);
                            }
                        }

                    }
                }
            }
            if (invalides.Count > 0 || doublons.Count > 0) {
                return Ok( new {invalides = invalides , doublons = doublons});
            }

            return Ok("Importation réussie");
        }
    }
}