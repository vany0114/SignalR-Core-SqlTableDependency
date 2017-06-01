using Microsoft.AspNetCore.Sockets;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace SignalRCore.Web.EndPoints
{
    public class MessagesEndPoint : EndPoint
    {
        public ConnectionList Connections { get; } = new ConnectionList();

        public override async Task OnConnectedAsync(Connection connection)
        {
            Connections.Add(connection);
            await Broadcast($"{connection.ConnectionId} connected ({connection.Metadata[ConnectionMetadataNames.Transport]})");

            try
            {
                while (await connection.Transport.Input.WaitToReadAsync())
                {
                    Message message;
                    if (connection.Transport.Input.TryRead(out message))
                    {
                        var text = Encoding.UTF8.GetString(message.Payload);
                        text = $"{connection.ConnectionId}: {text}";
                        await Broadcast(Encoding.UTF8.GetBytes(text), message.Type, message.EndOfMessage);
                    }
                }
            }
            finally
            {
                Connections.Remove(connection);
                await Broadcast($"{connection.ConnectionId} disconnected ({connection.Metadata[ConnectionMetadataNames.Transport]})");
            }
        }

        private Task Broadcast(string text)
        {
            return Broadcast(Encoding.UTF8.GetBytes(text), MessageType.Text, endOfMessage: true);
        }

        private Task Broadcast(byte[] payload, MessageType format, bool endOfMessage)
        {
            var tasks = new List<Task>(Connections.Count);
            foreach (var c in Connections)
            {
                tasks.Add(c.Transport.Output.WriteAsync(new Message(
                    payload,
                    format,
                    endOfMessage)));
            }

            return Task.WhenAll(tasks);
        }
    }
}
