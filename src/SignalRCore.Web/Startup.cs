using Microsoft.AspNetCore.Builder;
using Microsoft.AspNetCore.Hosting;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;
using SignalRCore.Web.Repository;
using SignalRCore.Web.Hubs;
using Microsoft.AspNetCore.SignalR;
using SignalRCore.Web.Persistence;
using SignalRCore.Web.EndPoints;
using EFCore.DbContextFactory.Extensions;
using Microsoft.EntityFrameworkCore;

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
            services.AddEndPoint<MessagesEndPoint>();

            // dependency injection
            services.AddSqlServerDbContextFactory<InventoryContext>(Configuration.GetConnectionString("DefaultConnection"));
            services.AddScoped<IInventoryRepository, DatabaseRepository>();
            services.AddSingleton<InventoryDatabaseSubscription, InventoryDatabaseSubscription>();
            services.AddScoped<IHubContext<Inventory>, HubContext<Inventory>>();
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
                routes.MapHub<Inventory>("inventory");
            });

            app.UseSockets(routes =>
            {
                routes.MapEndPoint<MessagesEndPoint>("message");
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
