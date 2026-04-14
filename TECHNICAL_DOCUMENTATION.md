# UCP Technical Documentation

## Project Overview

**UCP (Unité de Coordination des Projects)** is a web-based request and justification management system built with a .NET backend and React frontend. The system manages approval workflows for requests and associated justifications through configurable validation circuits.

---

## Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                     Frontend (React)                       │
│              Port 3000 (dev) / Port 443 (prod)             │
├─────────────────────────────────────────────────────────────┤
│                     Backend (.NET Core)                    │
│               Port 5084 (default)                          │
├─────────────────────────────────────────────────────────────┤
│                     Database (SQL Server)                  │
└─────────────────────────────────────────────────────────────┘
```

---

## Technology Stack

### Frontend
- **Framework**: React 19.0.0 with TypeScript
- **Build Tool**: Vite 6.3.1
- **Styling**: TailwindCSS 4.1.4 + @material-tailwind/react
- **Routing**: React Router DOM 7.5.2
- **Forms**: React Hook Form 7.56.1 + Zod validation
- **HTTP Client**: Axios 1.9.0
- **Charts**: Chart.js 4.5.0 + react-chartjs-2
- **PDF Generation**: jsPDF + jspdf-autotable
- **UI Components**: Radix UI primitives (Dialog, Select, Dropdown, etc.)
- **Icons**: Lucide React, Heroicons

### Backend
- **Framework**: ASP.NET Core 8.x
- **ORM**: Entity Framework Core
- **Database**: SQL Server
- **Authentication**: Cookie-based authentication (custom scheme)
- **Background Services**: RequeteService for batch processing

---

## Project Structure

### Frontend (`UCP_FRONTEND/ucp_frontend/`)

```
ucp_frontend/
├── src/
│   ├── api/                 # API clients
│   │   ├── fetch.ts         # Native fetch wrapper
│   │   └── axios.ts        # Axios instance configuration
│   ├── components/          # Reusable UI components
│   │   ├── ui/           # Base UI components (Button, Input, Select, etc.)
│   │   ├── layout/       # Layout components
│   │   └── ProtectedRoute.tsx
│   ├── pages/              # Page components
│   │   ├── login/        # Login page
│   │   ├── requetes/     # Request management pages
│   │   ├── justificatifs/ # Justification management pages
│   │   ├── parametrage/  # Configuration pages
│   │   ├── circuit/     # Workflow circuit pages
│   │   ├── tableauDeBord/ # Dashboard pages
│   │   └── dashboard/   # Alternative dashboard pages
│   ├── hooks/             # Custom React hooks
│   │   ├── useSessionCheck.ts
│   │   ├── useDebounce.ts
│   │   ├── useFilteredPagination.ts
│   │   └── use-mobile.ts
│   ├── services/           # Business logic services
│   │   ├── sessionService.ts
│   │   └── CsvService.ts
│   ├── lib/              # Utility libraries
│   │   └── utils.ts     # Common utilities (cn, date formatting)
│   ├── App.tsx          # Main app with routes
│   ├── routes.tsx       # Route definitions
│   ├── main.tsx         # Entry point
│   └── index.css       # Global styles
├── public/              # Static assets
├── dist/               # Production build
├── package.json
├── tsconfig.json
├── vite.config.ts
└── .env.development / .env.production
```

### Backend (`UCP_API/UCP_API/`)

```
UCP_API/
├── data/
│   ├── AppDbContext.cs      # EF Core DbContext
│   └── SqlServerConnexion.cs
├── dto/                    # Data Transfer Objects
│   ├── RequeteData.cs
│   ├── ValidationRequeteDTO.cs
│   ├── ProjetDTO.cs
│   └── [many other DTOs]
├── models/                  # Entity models
│   ├── Requete.cs
│   ├── Justificatif.cs
│   ├── Utilisateur.cs
│   ├── Circuit.cs
│   ├── Role.cs
│   ├── Site.cs
│   └── [many other entities]
├── repositories/           # Data access layer
├── services/               # Business services
│   ├── RequeteService.cs  # Background service
│   └── GraphService.cs
├── utils/                 # Utility classes
│   ├── DatabaseConnex.cs
│   ├── Mailservice.cs
│   └── Password.cs
├── Program.cs             # Application entry point
└── appsettings.json
```

---

## Database Schema

### Core Entities

| Entity | Description |
|--------|-------------|
| `Utilisateur` | Users with roles and permissions |
| `Role` | User roles (Admin, Validateur, Demandeur) |
| `Site` | Geographic sites |
| `Projet` | Projects |
| `TypeRequete` | Request types |
| `Requete` | Requests submitted by users |
| `Justificatif` | Supporting documents/justifications |
| `Circuit` | Validation workflow definitions |
| `CircuitEtape` | Steps in a validation circuit |
| `CircuitEtapeValidateur` | Validators assigned to steps |
| `HistoriqueValidationRequete` | Request validation history |
| `HistoriqueValidationJustificatif` | Justification validation history |
| `CategorieRubrique` | Categories for request fields |
| `Rubrique` | Request fields/columns |
| `Unit` | Measurement units |

---

## API Endpoints

### Authentication
- `POST /api/login` - User login
- `POST /api/logout` - User logout
- `GET /api/user` - Get current user

### Requests (Requetes)
- `GET /api/requetes` - List requests
- `POST /api/requetes` - Create request
- `GET /api/requetes/{id}` - Get request details
- `PUT /api/requetes/{id}` - Update request
- `DELETE /api/requetes/{id}` - Delete request

### Justifications (Justificatifs)
- `GET /api/justificatifs` - List justifications
- `POST /api/justificatifs` - Create justification
- `PUT /api/justificatifs/{id}` - Update justification

### Validation
- `POST /api/validation/requete` - Validate request
- `POST /api/validation/justificatif` - Validate justification
- `POST /api/validation/refuser` - Reject with reason

### Configuration
- `GET /api/sites` - List sites
- `GET /api/projets` - List projects
- `GET /api/roles` - List roles
- `GET /api/types` - List request types
- `GET /api/categories` - List categories
- `GET /api/rubriques` - List rubriques

---

## User Roles & Permissions

| Role | Description |
|------|-------------|
| `Admin` | Full system access |
| `Validateur` | Can approve/reject requests |
| `Demandeur` | Can submit requests |
| `Ministere` | Ministry-level access |

---

## Workflow

### Request Lifecycle
1. **Initiation** - User creates a request
2. **En Cours** - Request is being processed
3. **A Valider** - Submitted for validation
4. **Validation** - Validator reviews and approves/rejects
5. **Cloturee** - Request is closed
6. **Refusee** - Request was rejected

### Validation Circuit
- Each request type can have a defined circuit
- Circuits define sequential validation steps
- Each step assigns specific validators
- Checklists can be required at each step

---

## Running the Application

### Frontend Development
```bash
cd UCP_FRONTEND/ucp_frontend
npm install
npm run dev    # Runs on http://localhost:3000
```

### Backend Development
```bash
cd UCP_API
dotnet restore
dotnet run    # Runs on http://localhost:5084
```

### Environment Variables

**Frontend (.env.development)**:
```
VITE_API_URL=http://localhost:5084/api
VITE_ENV=development
```

**Frontend (.env.production)**:
```
VITE_API_URL=/api
VITE_ENV=production
```

---

## Key Configuration Files

### Frontend
- `vite.config.ts` - Vite configuration with path aliases (@/)
- `tsconfig.json` - TypeScript configuration
- `eslint.config.js` - ESLint rules

### Backend
- `appsettings.json` - Application settings
- `appsettings.Development.json` - Development-specific settings

---

## Security

- **Authentication**: Cookie-based with custom scheme
- **Session Duration**: 12 hours
- **CORS**: Configured for localhost:3000 (dev)
- **HTTPS**: Required in production

---

## Build & Deployment

### Frontend Production Build
```bash
npm run build    # Output to dist/
```

### Backend Publication
```bash
dotnet publish -c Release
```

---

## Dependencies Summary

### Core Dependencies (Frontend)
- react, react-dom
- react-router-dom
- react-hook-form
- @hookform/resolvers
- zod
- axios
- chart.js
- react-chartjs-2
- jspdf, jspdf-autotable
- lucide-react
- @radix-ui/react-*
- @material-tailwind/react
- tailwindcss
- date-fns

### Core Dependencies (Backend)
- Microsoft.EntityFrameworkCore
- Microsoft.EntityFrameworkCore.SqlServer
- Azure.Core (for Azure integrations)
- System.Net (networking)