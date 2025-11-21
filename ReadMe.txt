Run Instructions

Project layout after unzipping
- Unzip the archive anywhere you like; you’ll end up with 'backend/' (ASP.NET Core API) and 'frontend/' (static site). Replace '/path/to/...' below with your actual folder path—users don’t need the original directory structure.

Backend (ASP.NET Core)
- Terminal → 'cd /path/to/backend'
- Restore dependencies: 'dotnet restore'
- Run the API: 'dotnet run'

Frontend (static files)
- Install Node.js (includes 'npx').
- New terminal → 'cd /path/to/frontend'
- Start a simple static server, e.g. 'npx http-server -p 8080' (or 'npx serve .').
- Open 'http://localhost:8080/login.html/' in the browser.

Seed admin login
- Email: 'admin@ecole.com'
- Password: 'password'
- Created automatically when the backend starts ('SeedMasterAdmin' in 'Program.cs').
