using System.Net.Mail;

namespace UCP_API.utils
{
    public class Mailservice
    {
        private readonly IConfiguration _configuration;

        public Mailservice(IConfiguration configuration)
        {
            _configuration = configuration;
        }

        public async Task SendEmail(string subject, string body, List<string> to, List<string>? copie)
        {
            try
            {
                var mailMessage = new MailMessage
                {
                    From = new MailAddress(_configuration["Email:mail"]!, _configuration["Email:alias"])
                };

                foreach (string email in to)
                {
                    if (!String.IsNullOrEmpty(email))
                    {
                        mailMessage.To.Add(email);
                    }
                }

                try
                {
                    if (copie != null)
                    {
                        string resultatcopie = String.Join(",", copie);
                        foreach (string email in resultatcopie.Split(";"))
                        {
                            if (!String.IsNullOrEmpty(email))
                            {
                                MailAddress mailAddress = new MailAddress(email);
                                if (!mailMessage.CC.Contains(mailAddress))
                                {
                                    mailMessage.CC.Add(email);
                                }
                            }
                        }
                    }
                }
                catch (Exception) { }

                mailMessage.Priority = MailPriority.High;
                mailMessage.IsBodyHtml = true;
                mailMessage.Subject = subject;
                mailMessage.Body = body + @"
                    <br />
                    <p style=""font-style: italic; font-size: 12px; "">Merci de ne pas répondre à ce message!</p>
                ";

                var smtp = new SmtpClient(_configuration["Email:smtp"])
                {
                    Port = int.Parse(_configuration["Email:port"]!),
                    UseDefaultCredentials = false,
                    Credentials = new System.Net.NetworkCredential(_configuration["Email:mail"], _configuration["Email:password"]),
                    EnableSsl = true,
                    Host = _configuration["Email:smtp"]!
                };

                try
                {
                    await smtp.SendMailAsync(mailMessage);
                }
                catch (Exception e) { Console.WriteLine(e.Message); }
            }
            catch (Exception e) { Console.WriteLine(e.Message); }
        }
    }
}