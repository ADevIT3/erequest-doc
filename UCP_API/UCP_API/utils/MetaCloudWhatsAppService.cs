namespace UCP_API.utils
{
    public class MetaCloudWhatsAppService
    {
        private readonly HttpClient _httpClient;
        private readonly string _phoneNumberId = "635663726303728";
        private readonly string _accessToken = "EAAUfATutIWkBOxBPjGJUNkYWoQYZCzPCyxWnTAyQR01rnnQ6AJe4AetoTZBoiyb4QRqTXhp9n07t5QZBimb7ZCIMh63lM8WjdG75vnyyiO2T8uy28xFsvymVF1nM4Vp5sm3sWmCmoeEdhq7swOdjXi9MeRiablrjRXvNjka6lzaj0E1LqHKBGVSeeBZAcb4nIriZCubpI98SMx0NQuhC0beuy4yAZDZD";

        public MetaCloudWhatsAppService(HttpClient httpClient)
        {
            _httpClient = httpClient;
            _httpClient.DefaultRequestHeaders.Authorization = new System.Net.Http.Headers.AuthenticationHeaderValue("Bearer", _accessToken);
        }

        public async Task SendWhatsAppMessage(string recipientPhone, string objet, string numero, string montant, string message)
        {
            var url = $"https://graph.facebook.com/v19.0/{_phoneNumberId}/messages";

            var data = new
            {
                messaging_product = "whatsapp",
                to = recipientPhone,
                type = "template",
                template = new
                {
                    name = "reception_requete", // le nom exact du template
                    language = new { code = "fr" },
                    components = new[]
            {
                new
                {
                    type = "body",
                    parameters = new[]
                    {
                        new { type = "text", text = objet },
                        new { type = "text", text = numero },
                        new { type = "text", text = montant },
                        new { type = "text", text = message }
                    }
                }
            }
                }
            };

            var response = await _httpClient.PostAsJsonAsync(url, data);
            var responseContent = await response.Content.ReadAsStringAsync();

            if (!response.IsSuccessStatusCode)
            {
                throw new Exception($"Erreur envoi WhatsApp : {responseContent}");
            }
        }
    }
}