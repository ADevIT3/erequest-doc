using System;
using System.IO;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Http;


namespace UCP_API.utils
{
    public class FileUtil
    {
        public static Boolean SaveFile(IFormFile file, string fullFilePath)
        {
            if (file == null || file.Length == 0)
            {
                return false;
            }

            using (var stream = new FileStream(fullFilePath, FileMode.Create))
            {
                try
                {
                   file.CopyTo(stream);
                    return true;
                }
                catch (Exception e)
                {
                    Console.WriteLine(e.Message);
                    return false;                    
               }                
            }
        }
    }
}
