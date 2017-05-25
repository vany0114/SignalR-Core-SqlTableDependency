using Microsoft.AspNetCore.SignalR;
using SignalRCore.Web.Repository;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;

namespace SignalRCore.Web.Hubs
{
    public class Inventory : Hub
    {
        private readonly IInventoryRepository _repository;

        public Inventory(IInventoryRepository repository)
        {
            _repository = repository;
        }

        public Task RegisterProduct(string product, int quantity)
        {
            _repository.RegisterProduct(product, quantity);
            return Clients.All.InvokeAsync("UpdateCatalog", _repository.Products);
        }

        public async Task SellProduct(string product, int quantity)
        {
            await _repository.SellProduct(product, quantity);
            await Clients.All.InvokeAsync("UpdateCatalog", _repository.Products);
        }
    }
}
