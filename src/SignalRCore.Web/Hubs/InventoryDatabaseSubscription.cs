using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using TableDependency.Enums;
using TableDependency.EventArgs;
using TableDependency.SqlClient;
using Microsoft.AspNetCore.SignalR;
using SignalRCore.Web.Hubs;
using SignalRCore.Web.Models;
using SignalRCore.Web.Repository;

namespace SignalRCore.Web.Hubs
{
    public class InventoryDatabaseSubscription : IDatabaseSubscription
    {
        private bool disposedValue = false;
        private readonly IInventoryRepository _repository;
        private readonly IHubContext<Inventory> _hubContext;
        private SqlTableDependency<Product> _tableDependency;

        public InventoryDatabaseSubscription(IInventoryRepository repository, IHubContext<Inventory> hubContext)
        {
            _repository = repository;
            _hubContext = hubContext;            
        }

        public void Configure(string connectionString)
        {
            _tableDependency = new SqlTableDependency<Product>(connectionString, null, null, null, null, DmlTriggerType.Delete);
            _tableDependency.OnChanged += Changed;
            _tableDependency.OnError += TableDependency_OnError;
            _tableDependency.Start();

            Console.WriteLine("Waiting for receiving notifications...");
        }

        private void TableDependency_OnError(object sender, ErrorEventArgs e)
        {
            Console.WriteLine($"SqlTableDependency error: {e.Error.Message}");
        }

        private void Changed(object sender, RecordChangedEventArgs<Product> e)
        {
            if (e.ChangeType != ChangeType.None)
            {
                // TODO: manage the changed entity
                var changedEntity = e.Entity;
                _hubContext.Clients.All.InvokeAsync("UpdateCatalog", _repository.Products);
            }
        }

        #region IDisposable

        ~InventoryDatabaseSubscription()
        {
            Dispose(false);
        }

        protected virtual void Dispose(bool disposing)
        {
            if (!disposedValue)
            {
                if (disposing)
                {
                    _tableDependency.Stop();
                }

                disposedValue = true;
            }
        }

        public void Dispose()
        {
            Dispose(true);
            GC.SuppressFinalize(this);
        }

        #endregion
    }
}
