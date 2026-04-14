using UCP_API.data;
using UCP_API.Models;

namespace UCP_API.repositories
{
    public class RouteDistanceRepository
    {
        private readonly AppDbContext _context;

        public RouteDistanceRepository(AppDbContext context)
        {
            _context = context;
        }

        public List<RouteDistance> GetAll()
        {
            return _context.RouteDistance.ToList();
        }

        public void Add(RouteDistance route)
        {
            _context.RouteDistance.Add(route);
            _context.SaveChanges();
        }
    }
}