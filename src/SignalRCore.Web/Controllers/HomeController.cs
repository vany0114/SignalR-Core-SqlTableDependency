using System.Diagnostics;
using Microsoft.AspNetCore.Mvc;
using SignalRCore.Web.Models;
using SignalRCore.Web.Repository;

namespace SignalRCore.Web.Controllers
{
    public class HomeController : Controller
    {
        private readonly IInventoryRepository _repository;

        public HomeController(IInventoryRepository repository)
        {
            _repository = repository;
        }

        public IActionResult Index()
        {
            return View(_repository.Products);
        }

        public IActionResult About()
        {
            ViewData["Message"] = "Your application description page.";

            return View();
        }

        public IActionResult Contact()
        {
            ViewData["Message"] = "Your contact page.";

            return View();
        }

        public IActionResult Error()
        {
            return View(new ErrorViewModel { RequestId = Activity.Current?.Id ?? HttpContext.TraceIdentifier });
        }
    }
}
