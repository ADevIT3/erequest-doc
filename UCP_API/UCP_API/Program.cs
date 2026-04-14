using Microsoft.EntityFrameworkCore;
using UCP_API.data;
using System.Reflection;
using System.Net;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Azure.Core;
using UCP_API.utils;
using Microsoft.Extensions.Hosting;
using UCP_API.services;
using UCP_API.repositories;

var builder = WebApplication.CreateBuilder(args);

// Register the background service
builder.Services.AddHostedService<RequeteService>();
// Add services to the container.
builder.Services.AddDbContext<AppDbContext>(options =>
{
    options.UseSqlServer(builder.Configuration.GetConnectionString("DefaultConnection"));

    if (builder.Environment.IsDevelopment())
    {
        options.EnableSensitiveDataLogging();
        options.EnableDetailedErrors();
    }
});

builder.Services.AddCors(options =>
{
    options.AddPolicy("AllowReactApp", policy =>
    {
        // Allow CORS requests from React app at localhost:5173
        //policy.WithOrigins("http://151.80.218.41:3011")  // React's dev server
        //policy.WithOrigins("https://15.235.10.156:3001")  // React's dev server
        //policy.WithOrigins("https://erequest.ucp.mg:443")  // React's dev server
        policy.WithOrigins("http://localhost:3000")
              .AllowAnyHeader()
              .AllowAnyMethod()  // Allow all HTTP methods (GET, POST, etc.)
              .AllowCredentials();// Allow all headers
    });
});

builder.Services.AddAuthentication(options =>
{
    options.DefaultScheme = "10mOyIm3S1WMbwaCE7";
})
    .AddCookie("10mOyIm3S1WMbwaCE7", options =>
    {
        
        options.Cookie.Name = "iji87ZZD32rh";
        options.Cookie.SameSite = SameSiteMode.Lax;
        options.Cookie.SecurePolicy =
        builder.Environment.IsProduction()
        ? CookieSecurePolicy.Always
        : CookieSecurePolicy.None;
        //options.Cookie.SecurePolicy = CookieSecurePolicy.None; // HTTPS
        options.Cookie.HttpOnly = true;
        options.ExpireTimeSpan = TimeSpan.FromHours(12);
    });

// Dynamically register all repository classes that end with "Repository"
var repositoryTypes = Assembly.GetExecutingAssembly()
                               .GetTypes()
                               .Where(t => t.Name.EndsWith("Repository") /*&& !t.IsInterface && !t.IsAbstract*/)
                               .ToList();

foreach (var repositoryType in repositoryTypes)
{
    // Register repository class as itself
    builder.Services.AddScoped(repositoryType);
}

builder.Services.AddScoped<Mailservice>();
builder.Services.AddHttpClient<MetaCloudWhatsAppService>();

builder.Services.AddScoped<MetaCloudWhatsAppService>();
builder.Services.AddControllers();
builder.Services.AddAuthorization();
builder.Services.AddScoped<DashboardMontantRepository>();
builder.Services.AddScoped<DashboardRetardRepository>();


builder.Services.AddScoped<RouteDistanceRepository>();
builder.Services.AddScoped<GraphService>();

// Learn more about configuring Swagger/OpenAPI at https://aka.ms/aspnetcore/swashbuckle
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen(

    );


var app = builder.Build();

// Configure the HTTP request pipeline.
if (app.Environment.IsDevelopment())
{
    app.UseSwagger();
    app.UseSwaggerUI();
}
app.UseRouting();   
app.UseCors("AllowReactApp");

//app.UseHttpsRedirection();
app.UseAuthentication();
app.UseAuthorization();


app.MapControllers();

app.Run();