# SignalR Core and SqlTableDependency

Is very early to talk about [SignalR Core](https://github.com/aspnet/SignalR) but it's exciting too. With the recent releasing of .netcore 2.0 the last [Microsoft Build](https://build.microsoft.com/) we can test a lot of great improvements and new features, between of them, the new SignalR Core. (Or at least the aproximation of what the SignalR team wants to build.) I have to warning that SignalR Core is on development process right now (as a matter of fact, while I was doing this demo I faced some issues because of the constant upgrades of SignalR team), so a bunch of things could change, but in some months (6 months at least) we can compare the progress and we could have a stable version of SignalR Core, meanwhile we can enjoy of this "version".

## Prerequisites and Installation Requirements
+ [.NET Core 2.0.0 Preview 1](https://www.microsoft.com/net/core/preview#windowscmd)
+ Visual Studio 2017 [Preview version 15.3](https://www.visualstudio.com/vs/preview/)

## Instructions
1. Clone this repository.
2. Compile it.
3. In order to use the SQL Broker,  you must be sure to enable Service Broker for the database. You can use the following command: `ALTER DATABASE MyDatabase SET ENABLE_BROKER`
4. Create Products table:
```sql
CREATE TABLE [dbo].[Products](
	[Name] [varchar](200) NOT NULL,
	[Quantity] [int] NOT NULL,
 CONSTRAINT [PK_Products] PRIMARY KEY CLUSTERED 
(
	[Name] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, IGNORE_DUP_KEY = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON) ON [PRIMARY]
) ON [PRIMARY]

GO
```
5. Execute the SignalRCore.Web project.
6. Execute the SignalRCore.CommandLine project. You can use `dotnet run` command.

Visit my blog <http://elvanydev.com/> to view the whole post about SignalR Core.
