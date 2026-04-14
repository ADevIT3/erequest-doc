using UCP_API.repositories;
using UCP_API.models;

namespace UCP_API.services


{
    public class Edge
    {
        public string Destination { get; set; }
        public int Distance { get; set; }
    }

    public class GraphService
    {
        private readonly RouteDistanceRepository _routeRepo;

        public GraphService(RouteDistanceRepository routeRepo)
        {
            _routeRepo = routeRepo;
        }

        public (List<string> path, int distance) GetShortestPath(string start, string end)
        {
            var routes = _routeRepo.GetAll();

            var graph = new Dictionary<string, List<Edge>>();

            foreach (var route in routes)
            {
                if (!graph.ContainsKey(route.Depart))
                    graph[route.Depart] = new List<Edge>();

                if (!graph.ContainsKey(route.Arrivee))
                    graph[route.Arrivee] = new List<Edge>();

                graph[route.Depart].Add(new Edge { Destination = route.Arrivee, Distance = route.Distance });
                graph[route.Arrivee].Add(new Edge { Destination = route.Depart, Distance = route.Distance });
            }

            if (!graph.ContainsKey(start) || !graph.ContainsKey(end))
                throw new Exception("Ville inexistante.");

            return Dijkstra(graph, start, end);
        }


        private (List<string>, int) Dijkstra(Dictionary<string, List<Edge>> graph, string start, string end)
        {
            var distances = new Dictionary<string, int>();
            var previous = new Dictionary<string, string>();
            var unvisited = new HashSet<string>(graph.Keys);

            foreach (var node in graph.Keys)
                distances[node] = int.MaxValue;

            distances[start] = 0;

            while (unvisited.Count > 0)
            {
                var current = unvisited.OrderBy(n => distances[n]).First();
                unvisited.Remove(current);

                foreach (var edge in graph[current])
                {
                    int alt = distances[current] + edge.Distance;
                    if (alt < distances[edge.Destination])
                    {
                        distances[edge.Destination] = alt;
                        previous[edge.Destination] = current;
                    }
                }
            }

            var path = new List<string>();
            var temp = end;

            while (previous.ContainsKey(temp))
            {
                path.Insert(0, temp);
                temp = previous[temp];
            }

            path.Insert(0, start);

            return (path, distances[end]);
        }

        public List<string> GetAllVilles()
        {
            var routes = _routeRepo.GetAll();
            var villes = new HashSet<string>();

            foreach (var route in routes)
            {
                villes.Add(route.Depart);
                villes.Add(route.Arrivee);
            }

            return villes.OrderBy(v => v).ToList();
        }
    }

}