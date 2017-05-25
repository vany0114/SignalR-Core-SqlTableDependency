using System;
using System.Collections.Concurrent;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using SignalRCore.Web.Models;

namespace SignalRCore.Web.Repository
{
    public class InMemoryInventoryRepository : IInventoryRepository
    {
        private readonly ConcurrentDictionary<string, int> _products =
            new ConcurrentDictionary<string, int>(new List<KeyValuePair<string, int>>
            {
                new KeyValuePair<string, int>("Desk", 3),
                new KeyValuePair<string, int>("Tablet", 3),
                new KeyValuePair<string, int>("Kindle", 3),
                new KeyValuePair<string, int>("MS Surface", 1),
                new KeyValuePair<string, int>("ESP Guitar", 2)
            });

        public IEnumerable<Product> Products => GetProducts();

        public Task RegisterProduct(string product, int quantity)
        {
            if (_products.ContainsKey(product))
                _products[product] = _products[product] + quantity;
            else
                _products.TryAdd(product, quantity);

            return Task.CompletedTask;
        }

        public Task SellProduct(string product, int quantity)
        {
            _products.TryGetValue(product, out int oldQuantity);

            if (oldQuantity >= quantity)
                _products[product] = oldQuantity - quantity;

            return Task.FromResult(oldQuantity >= quantity);
        }

        private IEnumerable<Product> GetProducts()
        {
            return _products.Select(x => new Product
            {
                Name = x.Key,
                Quantity = x.Value
            });
        }
    }
}
