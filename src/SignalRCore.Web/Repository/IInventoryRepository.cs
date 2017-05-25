using SignalRCore.Web.Models;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;

namespace SignalRCore.Web.Repository
{
    public interface IInventoryRepository
    {
        IEnumerable<Product> Products { get; }

        Task RegisterProduct(string product, int quantity);

        Task SellProduct(string product, int quantity);
    }
}
