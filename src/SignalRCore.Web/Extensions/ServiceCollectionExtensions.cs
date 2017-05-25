using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;

namespace SignalRCore.Web.Extensions
{
    public static class ServiceCollectionExtensions
    {
        public static void AddDbContextFactory<DataContext>(this IServiceCollection services, string connectionString)
            where DataContext : DbContext
        {
            services.AddScoped<Func<DataContext>>((ctx) =>
            {
                var options = new DbContextOptionsBuilder<DataContext>()
                    .UseSqlServer(connectionString)
                    .Options;

                return () => (DataContext)Activator.CreateInstance(typeof(DataContext), options);
            });
        }
    }
}
