using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using SignalRCore.Web.Models;
using SignalRCore.Web.Persistence;
using Microsoft.EntityFrameworkCore;

namespace SignalRCore.Web.Repository
{
    public class DatabaseRepository : IInventoryRepository
    {
        private Func<InventoryContext> _contextFactory;

        public IEnumerable<Product> Products => GetProducts();

        public DatabaseRepository(Func<InventoryContext> context)
        {
            _contextFactory = context;
        }

        public Task RegisterProduct(string product, int quantity)
        {
            using (var context = _contextFactory.Invoke())
            {
                if (context.Products.Any(x => x.Name == product))
                {
                    var currentProduct = context.Products.FirstOrDefault(x => x.Name == product);
                    currentProduct.Quantity += quantity;
                    context.Update(currentProduct);
                }
                else
                {
                    context.Add(new Product { Name = product, Quantity = quantity });
                }

                context.SaveChanges();
            }

            return Task.FromResult(true);
        }

        public Task SellProduct(string product, int quantity)
        {
            using (var context = _contextFactory.Invoke())
            {
                var currentProduct = context.Products.FirstOrDefault(x => x.Name == product);

                if (currentProduct.Quantity >= quantity)
                {
                    currentProduct.Quantity -= quantity;
                    context.Update(currentProduct);
                }

                context.SaveChanges();
            }

            return Task.FromResult(true);
        }

        private IEnumerable<Product> GetProducts()
        {
            using (var context =_contextFactory.Invoke())
            {
                return context.Products.ToList();
            }
        }
    }
}
