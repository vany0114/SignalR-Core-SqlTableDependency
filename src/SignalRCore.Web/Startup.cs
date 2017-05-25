using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Builder;
using Microsoft.AspNetCore.Hosting;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;
using SignalRCore.Web.Repository;
using SignalRCore.Web.Hubs;
using Microsoft.Extensions.FileProviders;
using System.IO;
using Microsoft.AspNetCore.SignalR;
using SignalRCore.Web;
using Microsoft.EntityFrameworkCore;
using SignalRCore.Web.Persistence;
using SignalRCore.Web.Extensions;

namespace SignalRCore.Web
{
    public class Startup
    {
        public IConfiguration Configuration { get; }

        public Startup(IHostingEnvironment env)
        {
            var builder = new ConfigurationBuilder()
                .SetBasePath(env.ContentRootPath)
                .AddJsonFile("appsettings.json", optional: true, reloadOnChange: true)
                .AddJsonFile($"appsettings.{env.EnvironmentName}.json", optional: true);

            builder.AddEnvironmentVariables();
            Configuration = builder.Build();
        }

        // This method gets called by the runtime. Use this method to add services to the container.
        public void ConfigureServices(IServiceCollection services)
        {
            services.AddMvc();
            services.AddSignalR();

            // dependency injection
            services.AddDbContextFactory<InventoryContext>(Configuration.GetConnectionString("DefaultConnection"));
            services.AddSingleton<InventoryDatabaseSubscription, InventoryDatabaseSubscription>();
            services.AddScoped<IHubContext<Inventory>, HubContext<Inventory>>();
            services.AddScoped<IInventoryRepository, DatabaseRepository>();
            //services.AddSingleton<IInventoryRepository, InMemoryInventoryRepository>();
        }

        // This method gets called by the runtime. Use this method to configure the HTTP request pipeline.
        public void Configure(IApplicationBuilder app, IHostingEnvironment env)
        {
            if (env.IsDevelopment())
            {
                app.UseDeveloperExceptionPage();
            }
            else
            {
                app.UseExceptionHandler("/Home/Error");
            }
            
            app.UseStaticFiles();

            app.UseSignalR(routes =>
            {
                routes.MapHub<Inventory>("/inventory");
            });

            app.UseMvc(routes =>
            {
                routes.MapRoute(
                    name: "default",
                    template: "{controller=Home}/{action=Index}/{id?}");
            });

            app.UseSqlTableDependency<InventoryDatabaseSubscription>(Configuration.GetConnectionString("DefaultConnection"));
        }
    }
}
