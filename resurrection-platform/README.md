# 🎃 Resurrection Platform - SAP Legacy AI Alternative

> Transform haunted legacy ABAP into modern SAP CAP applications. Bring your legacy systems back from the dead!

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Next.js](https://img.shields.io/badge/Next.js-16.0-black)](https://nextjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.0-blue)](https://www.typescriptlang.org/)
[![Prisma](https://img.shields.io/badge/Prisma-5.22-2D3748)](https://www.prisma.io/)

## 🌟 Overview

The Resurrection Platform is an open-source alternative to SAP Legacy AI that intelligently analyzes legacy ABAP code and generates production-ready SAP CAP applications. Each "resurrection" is a complete, deployable CAP project with its own GitHub repository.

### Key Features

- 🔮 **Spectral Analysis**: AI-powered ABAP parsing and business logic extraction
- ⚗️ **5-Step Transformation**: Orchestrated workflow (Analyze → Plan → Generate → Validate → Deploy)
- 🪦 **GitHub Integration**: Automatic repository creation with complete CAP projects
- 👻 **Halloween Theme**: Immersive, spooky UI built with Shadcn/ui
- 🚀 **Clean Core Compliant**: Generates modern, maintainable SAP applications
- 💻 **SAP BAS Ready**: One-click open in SAP Business Application Studio

## 🎯 Quick Start

### Prerequisites

- Node.js 18+ and npm
- PostgreSQL 14+ (or Docker)
- Git

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/yourusername/resurrection-platform.git
   cd resurrection-platform
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up environment variables**
   ```bash
   cp .env.example .env.local
   ```

   Edit `.env.local` with your configuration:
   ```env
   # Database
   DATABASE_URL="postgresql://user:password@localhost:5432/resurrection_db"

   # GitHub (for repository creation)
   GITHUB_TOKEN="your_github_personal_access_token"

   # OpenAI (for LLM planning)
   OPENAI_API_KEY="your_openai_api_key"

   # Optional: Slack notifications
   SLACK_BOT_TOKEN="your_slack_bot_token"
   SLACK_TEAM_ID="your_slack_team_id"
   ```

4. **Set up the database**
   ```bash
   npx prisma migrate dev
   npx prisma generate
   ```

5. **Start the development server**
   ```bash
   npm run dev
   ```

6. **Open your browser**
   Navigate to [http://localhost:3000](http://localhost:3000)

## 🧙 Usage

### 1. Upload ABAP Code

Navigate to the upload page and drag-and-drop your `.abap` or `.txt` files:

```bash
http://localhost:3000/upload
```

Supported formats:
- `.abap` - ABAP source files
- `.txt` - Text files containing ABAP code
- `.zip` - Archives containing multiple ABAP files

### 2. Start Resurrection

Once uploaded, the platform will:

1. **ANALYZE** (30s): Parse ABAP code and extract business logic
2. **PLAN** (20s): Create transformation architecture with CDS models
3. **GENERATE** (60s): Build complete CAP project (CDS, services, UI)
4. **VALIDATE** (15s): Check syntax, structure, and Clean Core compliance
5. **DEPLOY** (20s): Create GitHub repository with all files

### 3. Access Your Resurrection

After completion, you'll receive:

- 📦 **GitHub Repository**: Complete CAP project with all source code
- 💻 **BAS Deep Link**: One-click open in SAP Business Application Studio
- 📊 **Quality Report**: Validation results and metrics
- 📥 **ZIP Export**: Download complete project for manual deployment

## 🏗️ Architecture

### Technology Stack

**Frontend:**
- Next.js 16 (App Router)
- React 19
- TypeScript 5
- Tailwind CSS 4
- Shadcn/ui (Halloween-themed)

**Backend:**
- Node.js 18+
- Prisma ORM
- PostgreSQL
- OpenAI API

**MCP Integration:**
- ABAP Analyzer MCP
- SAP CAP Generator MCP
- SAP UI5 Generator MCP
- GitHub MCP

### Project Structure

```
resurrection-platform/
├── app/                      # Next.js app directory
│   ├── api/                  # API routes
│   │   ├── abap/            # ABAP upload endpoints
│   │   └── resurrections/   # Resurrection workflow endpoints
│   ├── upload/              # Upload page
│   ├── resurrections/       # Resurrection details pages
│   └── page.tsx             # Landing page
├── components/              # React components
│   ├── ui/                  # Shadcn UI components
│   ├── ErrorBoundary.tsx   # Error handling
│   └── LoadingState.tsx    # Loading states
├── lib/                     # Utilities and services
│   ├── mcp/                 # MCP client wrappers
│   ├── workflow/            # Resurrection workflow engine
│   ├── llm/                 # LLM service
│   └── toast.ts             # Halloween-themed notifications
├── prisma/                  # Database schema and migrations
│   └── schema.prisma
└── __tests__/               # Test files
```

## 🔧 MCP Server Configuration

The platform requires 4 MCP servers for full functionality:

### 1. ABAP Analyzer MCP

Parses and analyzes ABAP code.

```json
{
  "mcpServers": {
    "abap-analyzer": {
      "command": "node",
      "args": ["./mcp-servers/abap-analyzer/index.js"],
      "env": {
        "SAP_DOMAIN_KNOWLEDGE": "enabled"
      }
    }
  }
}
```

### 2. SAP CAP Generator MCP

Generates CDS models and CAP services.

```json
{
  "mcpServers": {
    "sap-cap-generator": {
      "command": "node",
      "args": ["./mcp-servers/sap-cap-generator/index.js"]
    }
  }
}
```

### 3. SAP UI5 Generator MCP

Generates Fiori Elements UI.

```json
{
  "mcpServers": {
    "sap-ui5-generator": {
      "command": "node",
      "args": ["./mcp-servers/sap-ui5-generator/index.js"]
    }
  }
}
```

### 4. GitHub MCP

Automates GitHub repository operations.

```json
{
  "mcpServers": {
    "github": {
      "command": "uvx",
      "args": ["mcp-server-github"],
      "env": {
        "GITHUB_PERSONAL_ACCESS_TOKEN": "${GITHUB_TOKEN}"
      }
    }
  }
}
```

**Configuration File Location:** `.kiro/settings/mcp.json`

## 🎨 Halloween Theme

The platform features a fully immersive Halloween theme:

### Color Palette

- **Spooky Purple**: `#2e1065` - Backgrounds and cards
- **Pumpkin Orange**: `#FF6B35` - Primary actions and accents
- **Ghost White**: `#F7F7FF` - Text and highlights
- **Graveyard Black**: `#0a0a0f` - Deep backgrounds
- **Haunted Red**: `#DC2626` - Errors and warnings

### Spooky Terminology

- **Transform** → Resurrect
- **Analyze** → Spectral Analysis
- **Generate** → Summon
- **Validate** → Exorcise Bugs
- **Deploy** → Release Spirit
- **Error** → Haunted
- **Archive** → Graveyard

### Halloween Icons

- 🎃 Start/Begin
- 👻 In Progress
- ⚰️ Completed
- 🦇 Failed/Error
- 🔮 Loading/Processing
- 🪦 Repository/Archive

## 📊 Workflow Architecture

### 5-Step Resurrection Process

```
┌─────────────────────────────────────────────────────────────────┐
│                    Resurrection Workflow                         │
│                  (User-Initiated, LLM-Orchestrated)              │
└─────────────────────────────────────────────────────────────────┘
                               │
                               ▼
┌─────────────────────────────────────────────────────────────────┐
│ Step 1: ANALYZE                                                  │
│ ├─ Input: ABAP code                                             │
│ ├─ Process: ABAP Analyzer MCP + LLM                             │
│ ├─ Output: Business logic, dependencies, metadata               │
│ └─ Duration: ~30 seconds                                        │
└─────────────────────────────────────────────────────────────────┘
                               │
                               ▼
┌─────────────────────────────────────────────────────────────────┐
│ Step 2: PLAN                                                     │
│ ├─ Input: Analysis results                                      │
│ ├─ Process: LLM + SAP domain knowledge                          │
│ ├─ Output: Transformation plan, CDS models, architecture        │
│ └─ Duration: ~20 seconds                                        │
└─────────────────────────────────────────────────────────────────┘
                               │
                               ▼
┌─────────────────────────────────────────────────────────────────┐
│ Step 3: GENERATE                                                 │
│ ├─ Input: Transformation plan                                   │
│ ├─ Process: CAP Generator MCP + UI5 Generator MCP + LLM         │
│ ├─ Output: Complete CAP project (CDS, services, UI, configs)    │
│ └─ Duration: ~60 seconds                                        │
└─────────────────────────────────────────────────────────────────┘
                               │
                               ▼
┌─────────────────────────────────────────────────────────────────┐
│ Step 4: VALIDATE                                                 │
│ ├─ Input: Generated CAP project                                 │
│ ├─ Process: Syntax validation, structure checks, Clean Core     │
│ ├─ Output: Quality report, validation results                   │
│ └─ Duration: ~15 seconds                                        │
└─────────────────────────────────────────────────────────────────┘
                               │
                               ▼
┌─────────────────────────────────────────────────────────────────┐
│ Step 5: DEPLOY                                                   │
│ ├─ Input: Validated CAP project                                 │
│ ├─ Process: GitHub MCP (create repo, commit files)              │
│ ├─ Output: GitHub repository URL, BAS deep link                 │
│ └─ Duration: ~20 seconds                                        │
└─────────────────────────────────────────────────────────────────┘
                               │
                               ▼
                    ✅ Resurrection Complete
                    📦 GitHub Repo Created
                    💬 Slack Notification Sent (optional)
```

### Generated CAP Project Structure

Each resurrection creates a complete CAP application:

```
resurrection-{name}-{timestamp}/
├── db/
│   ├── schema.cds              # CDS data models
│   └── data/                   # Sample data (CSV)
├── srv/
│   ├── service.cds             # Service definitions
│   ├── service.js              # Service implementation
│   └── handlers/               # Business logic handlers
├── app/
│   └── orders/                 # Fiori UI app
│       ├── webapp/
│       │   ├── manifest.json
│       │   └── annotations.cds
│       └── package.json
├── .github/
│   └── workflows/
│       └── ci.yml              # GitHub Actions CI/CD
├── mta.yaml                    # BTP deployment descriptor
├── package.json                # Dependencies and scripts
├── xs-security.json            # XSUAA configuration
├── .gitignore
├── README.md                   # Setup and deployment guide
└── RESURRECTION.md             # Original ABAP context
```

## 🧪 Testing

### Run All Tests

```bash
npm test
```

### Run Specific Test Suites

```bash
# Database schema tests
npm test -- database-schema.test.ts

# MCP client tests
npm test -- mcp-client.test.ts

# End-to-end workflow tests
npm test -- e2e-workflow.test.ts
```

### Test Coverage

```bash
npm run test:coverage
```

## 🚀 Deployment

### Deploy to Vercel (Recommended)

1. **Push to GitHub**
   ```bash
   git push origin main
   ```

2. **Import to Vercel**
   - Go to [vercel.com](https://vercel.com)
   - Import your GitHub repository
   - Add environment variables
   - Deploy

3. **Set up PostgreSQL**
   - Use Vercel Postgres or external provider
   - Update `DATABASE_URL` in Vercel environment variables

### Deploy to AWS

See [DEPLOYMENT.md](./DEPLOYMENT.md) for detailed AWS deployment instructions.

### Docker Deployment

```bash
# Build image
docker build -t resurrection-platform .

# Run container
docker run -p 3000:3000 \
  -e DATABASE_URL="postgresql://..." \
  -e GITHUB_TOKEN="..." \
  -e OPENAI_API_KEY="..." \
  resurrection-platform
```

## 📖 API Documentation

### Upload ABAP Code

```http
POST /api/abap/upload
Content-Type: multipart/form-data

file: <ABAP file>
```

### Create Resurrection

```http
POST /api/resurrections
Content-Type: application/json

{
  "name": "sales-order-processing",
  "description": "SD pricing logic",
  "abapObjectIds": ["uuid1", "uuid2"]
}
```

### Start Workflow

```http
POST /api/resurrections/:id/start
```

### Get Status

```http
GET /api/resurrections/:id/status
```

### Export Project

```http
GET /api/resurrections/:id/export
```

## 🤝 Contributing

Contributions are welcome! Please read [CONTRIBUTING.md](./CONTRIBUTING.md) for details.

### Development Workflow

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📝 License

This project is licensed under the MIT License - see the [LICENSE](./LICENSE) file for details.

## 🙏 Acknowledgments

- Built with [Next.js](https://nextjs.org/)
- UI components from [Shadcn/ui](https://ui.shadcn.com/)
- MCP protocol by [Anthropic](https://www.anthropic.com/)
- Inspired by SAP Legacy AI

## 📞 Support

- 📧 Email: support@resurrection-platform.dev
- 💬 Discord: [Join our community](https://discord.gg/resurrection)
- 🐛 Issues: [GitHub Issues](https://github.com/yourusername/resurrection-platform/issues)
- 📚 Docs: [Full Documentation](https://docs.resurrection-platform.dev)

## 🎃 Happy Resurrecting!

Transform your haunted ABAP code into modern SAP CAP applications. The spirits of legacy systems await their resurrection! 👻

---

**Made with 🎃 and ☕ by the Resurrection Platform team**
