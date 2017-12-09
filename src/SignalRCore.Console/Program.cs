using System;
using Microsoft.AspNetCore.SignalR.Client;
using System.Threading;
using Microsoft.Extensions.Logging;
using System.Threading.Tasks;
using System.Linq;
using Newtonsoft.Json.Linq;
using System.Collections.Generic;

namespace SignalRCore.CommandLine
{
    public class Program
    {
        public static int Main(string[] args)
        {
            Thread.Sleep(2000);

            return Task.Run(async () =>
            {
                return await ExecuteAsync();
            }).Result;
        }

        public static async Task<int> ExecuteAsync()
        {
            var baseUrl = "http://localhost:4235/inventory";

            Console.WriteLine("Connecting to {0}", baseUrl);
            var connection = new HubConnectionBuilder()
                .WithUrl(baseUrl)
                .WithConsoleLogger()
                .Build();

            try
            {
                await connection.StartAsync();
                Console.WriteLine("Connected to {0}", baseUrl);

                var cts = new CancellationTokenSource();
                Console.CancelKeyPress += (sender, a) =>
                {
                    a.Cancel = true;
                    Console.WriteLine("Stopping loops...");
                    cts.Cancel();
                };

                // Set up handler
                connection.On<List<dynamic>>("UpdateCatalog", data =>
                {
                    var products = data;
                    foreach (var item in products)
                    {
                        Console.WriteLine($"{item.name}: {item.quantity}");
                    }
                });

                while (!cts.Token.IsCancellationRequested)
                {
                    var product = await Task.Run(() => ReadProduct(), cts.Token);
                    var quanity = await Task.Run(() => ReadQuantity(), cts.Token);

                    if (product == null)
                    {
                        break;
                    }

                    await connection.InvokeAsync("RegisterProduct", product, quanity, cts.Token);
                }
            }
            catch (AggregateException aex) when (aex.InnerExceptions.All(e => e is OperationCanceledException))
            {
            }
            catch (OperationCanceledException)
            {
            }
            finally
            {
                await connection.DisposeAsync();
            }
            return 0;
        }

        private static string ReadProduct()
        {
            Console.WriteLine("Please enter the Product Name");
            var product = Console.ReadLine();
            return product;
        }

        private static int ReadQuantity()
        {
            Console.WriteLine("Please enter the Product Quantity");
            var quantity = int.Parse(Console.ReadLine());
            return quantity;
        }
    }
}
