# Design Document: SAP Legacy AI Alternative - Resurrection Platform

## Overview

This design document outlines the technical architecture for the SAP Legacy AI Alternative platform - a modern web application that analyzes legacy ABAP code and generates production-ready SAP CAP applications called "resurrections". The platform leverages MCP servers for intelligent transformation, GitHub for version control, and Slack for team collaboration.

### Key Design Principles

1. **Platform is NOT CAP** - Modern web stack (Next.js/Node.js/React) for flexibility and performance
2. **Resurrections ARE CAP** - Each output is a complete, deployable SAP CAP application
3. **Multi-Step LLM Workflow** - Orchestrated 5-step workflow (Analyze → Plan → Generate → Validate → Deploy) with LLM + MCP servers
4. **MCP-Powered Intelligence** - Leverage specialized MCP servers for ABAP analysis and CAP generation
5. **Halloween-Themed UX** - Spooky, immersive design with Shadcn UI components and resurrection-themed elements
6. **GitHub-First Workflow** - Every resurrection creates a GitHub repository (automated or manual)
7. **Automation via Hooks** - Use Kiro hooks for quality validation and CI/CD setup
8. **Flexible Deployment** - Platform can run on Vercel, AWS, or any Node.js environment

### Multi-Step LLM Workflow Architecture

The platform uses an orchestrated multi-step workflow where each step combines LLM intelligence with specialized MCP servers:

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
│ ├─ Process: LLM + Kiro Specs knowledge                          │
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
│ ├─ Process: Kiro Hooks (syntax, structure, Clean Core)          │
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
                    💬 Slack Notification Sent
```

**Key Characteristics:**
- **User-Initiated**: Users trigger each resurrection explicitly
- **Transparent**: Real-time progress updates for each step
- **Controllable**: Can pause, retry, or skip steps on errors
- **Auditable**: Full logs of each step's inputs/outputs
- **Not Agentic**: Platform orchestrates, doesn't make autonomous decisions

## Architecture

### High-Level Architecture Diagram

```
┌─────────────────────────────────────────────────────────────────┐
│                    Resurrection Platform                         │
│                  (Next.js/Node.js/React)                         │
│                                                                   │
│  ┌────────────────────────────────────────────────────────────┐ │
│  │                    Frontend (Next.js/React)                 │ │
│  │                                                              │ │
│  │  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐    │ │
│  │  │ Landing Page │  │ Intelligence │  │ Resurrection │    │ │
│  │  │ & Onboarding │  │ Dashboard    │  │ Wizard       │    │ │
│  │  └──────────────┘  └──────────────┘  └──────────────┘    │ │
│  │  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐    │ │
│  │  │ Q&A Chat     │  │ Resurrection │  │ Settings     │    │ │
│  │  │ Interface    │  │ Dashboard    │  │ & Admin      │    │ │
│  │  └──────────────┘  └──────────────┘  └──────────────┘    │ │
│  └────────────────────────────────────────────────────────────┘ │
│                               │                                   │
│  ┌────────────────────────────┼────────────────────────────────┐ │
│  │                    Backend (Node.js/Express)                 │ │
│  │  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐    │ │
│  │  │ REST/GraphQL │  │ MCP          │  │ Resurrection │    │ │
│  │  │ API          │  │ Orchestrator │  │ Engine       │    │ │
│  │  └──────────────┘  └──────────────┘  └──────────────┘    │ │
│  │  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐    │ │
│  │  │ Vector Search│  │ Hook Manager │  │ Auth Service │    │ │
│  │  │ (Pinecone)   │  │              │  │              │    │ │
│  │  └──────────────┘  └──────────────┘  └──────────────┘    │ │
│  └────────────────────────────────────────────────────────────┘ │
│                               │                                   │
│  ┌────────────────────────────┼────────────────────────────────┐ │
│  │                    Database (PostgreSQL/MongoDB)             │ │
│  │  - ABAP Objects                                              │ │
│  │  - Resurrections                                             │ │
│  │  - Users & Auth                                              │ │
│  │  - Transformation Logs                                       │ │
│  └────────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────────┘
                               │
                               │ MCP Protocol
                               ▼
┌─────────────────────────────────────────────────────────────────┐
│                    MCP Servers (External)                        │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐          │
│  │ ABAP Analyzer│  │ SAP CAP      │  │ SAP UI5      │          │
│  │ MCP Server   │  │ Generator    │  │ Generator    │          │
│  └──────────────┘  └──────────────┘  └──────────────┘          │
│  ┌──────────────┐  ┌──────────────┐                            │
│  │ GitHub MCP   │  │ Slack MCP    │                            │
│  │ (Repo Mgmt)  │  │ (Notifications)                           │
│  └──────────────┘  └──────────────┘                            │
└─────────────────────────────────────────────────────────────────┘
                               │
                               ▼
┌─────────────────────────────────────────────────────────────────┐
│                    Resurrection Output                           │
│                  (Complete CAP Application)                      │
│                                                                   │
│  📦 resurrection-sd-pricing-20241123/                           │
│  ├── db/                    (CDS schema, data)                  │
│  ├── srv/                   (CAP services, handlers)            │
│  ├── app/                   (Fiori UI)                          │
│  ├── mta.yaml               (BTP deployment descriptor)         │
│  ├── package.json           (Dependencies, scripts)             │
│  ├── xs-security.json       (XSUAA configuration)               │
│  ├── README.md              (Setup & deployment guide)          │
│  └── .github/workflows/     (CI/CD)                             │
│                                                                   │
│  🚀 Deployable to SAP BTP                                       │
│  🔗 GitHub Repository                                            │
│  💻 Open in SAP BAS                                             │
└─────────────────────────────────────────────────────────────────┘
```

### Technology Stack

**Frontend:**
- Next.js 14+ (App Router) or React 18+ with Vite
- TypeScript for type safety
- Tailwind CSS with Halloween color palette
- **Shadcn/ui** for component library (required for Halloween theme)
- D3.js for dependency graph visualization
- React Query for data fetching and caching
- Zustand or Redux for state management
- Framer Motion for spooky animations

**Backend:**
- Node.js 18+ with Express or Next.js API routes
- TypeScript
- Prisma or TypeORM for database ORM
- PostgreSQL or MongoDB for data persistence
- Pinecone for vector search
- OpenAI API for embeddings and Q&A
- Bull or BullMQ for background job processing

**MCP Integration:**
- Model Context Protocol SDK
- Custom MCP client wrappers
- Streaming support for real-time progress
- Error handling and retry logic

**External Services:**
- GitHub API (via GitHub MCP)
- Slack API (via Slack MCP)
- OpenAI API (embeddings, chat completion)
- Pinecone (vector database)

**Deployment:**
- Vercel (recommended for Next.js)
- AWS (EC2, ECS, Lambda)
- Docker containers
- Environment variables for configuration

### Halloween Theme Design System

**Design Philosophy:** The platform embraces the "resurrection" metaphor with a spooky, immersive Halloween theme built on Shadcn UI components.

#### Color Palette

```typescript
// tailwind.config.ts
const halloweenTheme = {
  colors: {
    // Primary Halloween Colors
    'spooky-purple': {
      50: '#f5f3ff',
      100: '#ede9fe',
      200: '#ddd6fe',
      300: '#c4b5fd',
      400: '#a78bfa',
      500: '#8b5cf6',
      600: '#7c3aed',
      700: '#6d28d9',
      800: '#5b21b6',
      900: '#4c1d95',
      950: '#2e1065',
    },
    'pumpkin-orange': {
      DEFAULT: '#FF6B35',
      light: '#FF8C61',
      dark: '#E85A2A',
    },
    'ghost-white': '#F7F7FF',
    'graveyard-black': '#0A0A0F',
    'haunted-red': '#DC2626',
    'mystical-green': '#10B981',
    'fog-gray': '#6B7280',
  },
  backgroundImage: {
    'spooky-gradient': 'linear-gradient(135deg, #2e1065 0%, #0A0A0F 100%)',
    'resurrection-glow': 'radial-gradient(circle, rgba(255,107,53,0.2) 0%, transparent 70%)',
  },
  boxShadow: {
    'orange-glow': '0 0 20px rgba(255, 107, 53, 0.5)',
    'purple-glow': '0 0 20px rgba(139, 92, 246, 0.5)',
    'haunted': '0 4px 20px rgba(220, 38, 38, 0.3)',
  },
}
```

#### Typography

```typescript
// fonts.ts
import { Creepster, Inter, JetBrains_Mono } from 'next/font/google';

const creepster = Creepster({ 
  weight: '400',
  subsets: ['latin'],
  variable: '--font-creepster',
});

const inter = Inter({ 
  subsets: ['latin'],
  variable: '--font-inter',
});

const jetbrainsMono = JetBrains_Mono({
  subsets: ['latin'],
  variable: '--font-mono',
});

// Usage:
// Headings: font-creepster (spooky gothic)
// Body: font-inter (clean, readable)
// Code: font-mono (technical)
```

#### Shadcn UI Component Customization

```typescript
// components/ui/button.tsx (Halloween variant)
const buttonVariants = cva(
  "base-button-classes",
  {
    variants: {
      variant: {
        default: "bg-pumpkin-orange hover:bg-pumpkin-orange-dark text-ghost-white",
        ghost: "hover:bg-spooky-purple-900/50 hover:text-pumpkin-orange",
        haunted: "bg-haunted-red hover:shadow-haunted text-ghost-white",
        spectral: "bg-spooky-purple-700 hover:shadow-purple-glow text-ghost-white",
      }
    }
  }
);

// components/ui/card.tsx (Tombstone variant)
const cardVariants = cva(
  "rounded-lg border bg-card text-card-foreground shadow-sm",
  {
    variants: {
      variant: {
        default: "border-fog-gray",
        tombstone: "border-spooky-purple-700 bg-gradient-to-b from-spooky-purple-950 to-graveyard-black hover:shadow-purple-glow transition-shadow",
        coffin: "border-pumpkin-orange bg-graveyard-black hover:shadow-orange-glow",
      }
    }
  }
);
```

#### Spooky Terminology Mapping

```typescript
// lib/theme/terminology.ts
export const SPOOKY_TERMS = {
  // Actions
  transform: 'Resurrect',
  analyze: 'Spectral Analysis',
  generate: 'Summon',
  validate: 'Exorcise Bugs',
  deploy: 'Release Spirit',
  
  // Status
  inProgress: 'Haunting',
  completed: 'Resurrected',
  failed: 'Cursed',
  archived: 'Graveyard',
  
  // UI Elements
  dashboard: 'Crypt Dashboard',
  wizard: 'Resurrection Ritual',
  upload: 'Summon Code',
  
  // Notifications
  success: '👻 Spirit Awakened',
  error: '🦇 Dark Magic Failed',
  warning: '⚠️ Haunted Warning',
};
```

#### Halloween Icons & Emojis

```typescript
// components/icons/halloween-icons.tsx
export const HalloweenIcons = {
  start: '🎃',
  inProgress: '👻',
  completed: '⚰️',
  failed: '🦇',
  warning: '⚠️',
  success: '✨',
  loading: '🕸️',
  graveyard: '🪦',
  ritual: '🔮',
  spectral: '💀',
};

// Usage in components
<Button>
  <span className="mr-2">{HalloweenIcons.start}</span>
  Resurrect Code
</Button>
```

#### Animated Components

```typescript
// components/animations/spooky-loader.tsx
export function SpookyLoader() {
  return (
    <motion.div
      className="relative w-20 h-20"
      animate={{
        rotate: 360,
      }}
      transition={{
        duration: 2,
        repeat: Infinity,
        ease: "linear",
      }}
    >
      <span className="text-4xl">👻</span>
    </motion.div>
  );
}

// components/animations/fog-effect.tsx
export function FogEffect() {
  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none">
      <motion.div
        className="absolute w-full h-full bg-gradient-to-t from-spooky-purple-900/20 to-transparent"
        animate={{
          y: [0, -20, 0],
          opacity: [0.3, 0.6, 0.3],
        }}
        transition={{
          duration: 4,
          repeat: Infinity,
          ease: "easeInOut",
        }}
      />
    </div>
  );
}

// components/animations/pulsing-pumpkin.tsx
export function PulsingPumpkin() {
  return (
    <motion.span
      className="text-6xl inline-block"
      animate={{
        scale: [1, 1.2, 1],
        filter: [
          'drop-shadow(0 0 0px #FF6B35)',
          'drop-shadow(0 0 20px #FF6B35)',
          'drop-shadow(0 0 0px #FF6B35)',
        ],
      }}
      transition={{
        duration: 2,
        repeat: Infinity,
      }}
    >
      🎃
    </motion.span>
  );
}
```

#### Themed UI Components

```typescript
// components/resurrection/tombstone-card.tsx
export function TombstoneCard({ resurrection }: { resurrection: Resurrection }) {
  return (
    <Card variant="tombstone" className="relative overflow-hidden">
      <FogEffect />
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="font-creepster text-2xl text-pumpkin-orange">
            {resurrection.name}
          </CardTitle>
          <StatusBadge status={resurrection.status} />
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-2">
          <MetricRow icon="💀" label="LOC Saved" value={resurrection.locSaved} />
          <MetricRow icon="🕸️" label="Complexity" value={resurrection.complexity} />
          <MetricRow icon="✨" label="Quality" value={`${resurrection.qualityScore}%`} />
        </div>
      </CardContent>
      <CardFooter>
        <Button variant="spectral" className="w-full">
          <span className="mr-2">👻</span>
          View Resurrection
        </Button>
      </CardFooter>
    </Card>
  );
}

// components/resurrection/ritual-progress.tsx
export function RitualProgress({ currentStep, steps }: RitualProgressProps) {
  return (
    <div className="relative">
      <div className="flex justify-between mb-8">
        {steps.map((step, index) => (
          <motion.div
            key={step.name}
            className="flex flex-col items-center"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
          >
            <div
              className={cn(
                "w-16 h-16 rounded-full flex items-center justify-center text-3xl",
                "border-2 transition-all duration-300",
                index <= currentStep
                  ? "border-pumpkin-orange bg-spooky-purple-900 shadow-orange-glow"
                  : "border-fog-gray bg-graveyard-black"
              )}
            >
              {step.icon}
            </div>
            <span className="mt-2 text-sm font-creepster text-ghost-white">
              {step.name}
            </span>
          </motion.div>
        ))}
      </div>
      <Progress value={(currentStep / steps.length) * 100} className="h-2" />
    </div>
  );
}

// components/dashboard/spider-web-graph.tsx
export function SpiderWebGraph({ dependencies }: { dependencies: Dependency[] }) {
  // D3.js visualization styled as spider web
  // Nodes: tombstones/coffins
  // Edges: ghostly connection lines with glow effect
  // Hover: show haunted tooltip with details
}
```

#### Landing Page Hero

```typescript
// app/page.tsx
export default function LandingPage() {
  return (
    <div className="min-h-screen bg-spooky-gradient relative overflow-hidden">
      <FogEffect />
      
      <div className="container mx-auto px-4 py-20">
        <motion.div
          initial={{ opacity: 0, y: 50 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center"
        >
          <PulsingPumpkin />
          
          <h1 className="font-creepster text-7xl text-pumpkin-orange mt-8 mb-4">
            Resurrect Your Legacy ABAP
          </h1>
          
          <p className="text-xl text-ghost-white mb-8 max-w-2xl mx-auto">
            Transform haunted ABAP code into modern SAP CAP applications. 
            Bring your legacy systems back from the dead! 👻
          </p>
          
          <div className="flex gap-4 justify-center">
            <Button variant="spectral" size="lg">
              <span className="mr-2">🎃</span>
              Start Resurrection
            </Button>
            <Button variant="ghost" size="lg">
              <span className="mr-2">📖</span>
              View Grimoire (Docs)
            </Button>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
```

#### Theme Toggle

```typescript
// components/theme-toggle.tsx
export function ThemeToggle() {
  const [theme, setTheme] = useState<'halloween' | 'professional'>('halloween');
  
  return (
    <Button
      variant="ghost"
      size="sm"
      onClick={() => setTheme(theme === 'halloween' ? 'professional' : 'halloween')}
    >
      {theme === 'halloween' ? '🎃 Spooky Mode' : '💼 Professional Mode'}
    </Button>
  );
}
```


## Components and Interfaces

### 1. MCP Integration Layer

The platform connects to 5 MCP servers for specialized capabilities:

#### ABAP Analyzer MCP
**Purpose:** Parse and analyze legacy ABAP code with SAP domain knowledge

**Capabilities:**
- Syntax parsing and validation
- Business logic extraction
- Dependency analysis
- SAP pattern recognition (pricing, authorization, number ranges)
- Table usage identification

**Configuration:**
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

**API Methods:**
- `analyzeCode(abapCode: string, context: object)` → Analysis result
- `extractBusinessLogic(abapCode: string)` → Business rules
- `findDependencies(abapCode: string)` → Dependency list
- `identifySAPPatterns(abapCode: string)` → Pattern matches

#### SAP CAP Generator MCP
**Purpose:** Generate modern CAP applications from ABAP business logic

**Capabilities:**
- CDS model generation from ABAP structures
- Service definition creation
- Event handler implementation
- Clean Core compliance validation

**API Methods:**
- `generateCDSModels(businessLogic: object)` → CDS files
- `generateServiceDefinitions(models: object)` → Service CDS
- `generateHandlers(services: object)` → JavaScript/TypeScript handlers
- `validateCleanCore(capProject: object)` → Validation report

#### SAP UI5 Generator MCP
**Purpose:** Generate Fiori Elements and Freestyle UI5 applications

**Capabilities:**
- Fiori Elements annotations
- UI5 component scaffolding
- Manifest.json generation
- Responsive design patterns

**API Methods:**
- `generateFioriElements(service: object, template: string)` → UI files
- `generateFreestyleUI5(requirements: object)` → UI5 components
- `generateManifest(appConfig: object)` → manifest.json

#### GitHub MCP
**Purpose:** Automate GitHub repository management

**Capabilities:**
- Repository creation with templates
- File commits and pushes
- Branch management
- Issue and PR creation
- GitHub Actions workflow setup
- Repository statistics

**API Methods:**
- `createRepository(name: string, options: object)` → Repo info
- `createOrUpdateFiles(repo: string, files: array)` → Commit info
- `createIssue(repo: string, issue: object)` → Issue info
- `createWorkflow(repo: string, workflow: object)` → Workflow file
- `addTopics(repo: string, topics: array)` → Success

**Configuration:**
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

#### Slack MCP
**Purpose:** Send team notifications and enable collaboration

**Capabilities:**
- Channel message posting
- Direct messages
- Interactive message buttons
- File uploads
- Thread conversations
- User mentions

**API Methods:**
- `postMessage(channel: string, text: string, options: object)` → Message info
- `postMessageWithAttachments(channel: string, message: object)` → Message info
- `createThread(channel: string, threadTs: string, text: string)` → Reply info
- `uploadFile(channel: string, file: buffer, filename: string)` → File info

**Configuration:**
```json
{
  "mcpServers": {
    "slack": {
      "command": "npx",
      "args": ["-y", "@modelcontextprotocol/server-slack"],
      "env": {
        "SLACK_BOT_TOKEN": "${SLACK_BOT_TOKEN}",
        "SLACK_TEAM_ID": "${SLACK_TEAM_ID}"
      }
    }
  }
}
```

### 2. Multi-Step Workflow Engine

**Purpose:** Orchestrate the 5-step resurrection workflow with LLM + MCP integration

```typescript
// lib/workflow/resurrection-workflow.ts
import { MCPOrchestrator } from '../mcp/orchestrator';
import { LLMService } from '../llm/llm-service';
import { HookManager } from '../hooks/hook-manager';

export class ResurrectionWorkflow {
  private mcpOrchestrator: MCPOrchestrator;
  private llmService: LLMService;
  private hookManager: HookManager;
  
  constructor() {
    this.mcpOrchestrator = new MCPOrchestrator();
    this.llmService = new LLMService();
    this.hookManager = new HookManager();
  }
  
  async execute(resurrectionId: string, abapCode: string): Promise<ResurrectionResult> {
    const resurrection = await prisma.resurrection.findUnique({ where: { id: resurrectionId } });
    
    try {
      // Step 1: ANALYZE
      await this.updateStatus(resurrectionId, 'ANALYZING');
      const analysis = await this.stepAnalyze(abapCode);
      await this.logStep(resurrectionId, 'ANALYZE', analysis);
      
      // Step 2: PLAN
      await this.updateStatus(resurrectionId, 'PLANNING');
      const plan = await this.stepPlan(analysis);
      await this.logStep(resurrectionId, 'PLAN', plan);
      
      // Step 3: GENERATE
      await this.updateStatus(resurrectionId, 'GENERATING');
      const capProject = await this.stepGenerate(plan);
      await this.logStep(resurrectionId, 'GENERATE', capProject);
      
      // Step 4: VALIDATE
      await this.updateStatus(resurrectionId, 'VALIDATING');
      const validation = await this.stepValidate(capProject);
      await this.logStep(resurrectionId, 'VALIDATE', validation);
      
      if (!validation.passed) {
        throw new Error(`Validation failed: ${validation.errors.join(', ')}`);
      }
      
      // Step 5: DEPLOY
      await this.updateStatus(resurrectionId, 'DEPLOYING');
      const deployment = await this.stepDeploy(resurrectionId, capProject);
      await this.logStep(resurrectionId, 'DEPLOY', deployment);
      
      // Mark complete
      await this.updateStatus(resurrectionId, 'COMPLETED');
      await this.hookManager.trigger('on-resurrection-complete', { resurrectionId });
      
      return {
        analysis,
        plan,
        capProject,
        validation,
        deployment
      };
      
    } catch (error) {
      await this.updateStatus(resurrectionId, 'FAILED');
      await this.hookManager.trigger('on-resurrection-failed', { resurrectionId, error });
      throw error;
    }
  }
  
  // Step 1: Analyze ABAP code
  private async stepAnalyze(abapCode: string): Promise<AnalysisResult> {
    // Call ABAP Analyzer MCP
    const mcpAnalysis = await this.mcpOrchestrator.analyzeABAP(abapCode, {
      extractBusinessLogic: true,
      identifyDependencies: true,
      detectPatterns: true
    });
    
    // Enhance with LLM
    const llmEnhancement = await this.llmService.enhanceAnalysis(mcpAnalysis, {
      generateDocumentation: true,
      identifyComplexity: true,
      suggestImprovements: true
    });
    
    return {
      ...mcpAnalysis,
      ...llmEnhancement,
      timestamp: new Date()
    };
  }
  
  // Step 2: Create transformation plan
  private async stepPlan(analysis: AnalysisResult): Promise<TransformationPlan> {
    // Use LLM with Kiro Specs knowledge to create plan
    const plan = await this.llmService.createTransformationPlan(analysis, {
      includeArchitecture: true,
      includeCDSModels: true,
      includeServiceDefinitions: true,
      includeUIDesign: true
    });
    
    return plan;
  }
  
  // Step 3: Generate CAP application
  private async stepGenerate(plan: TransformationPlan): Promise<CAPProject> {
    // Generate CDS models
    const cdsModels = await this.mcpOrchestrator.generateCDS(plan.cdsModels);
    
    // Generate services
    const services = await this.mcpOrchestrator.generateServices(plan.services);
    
    // Generate UI
    const ui = await this.mcpOrchestrator.generateUI(plan.uiDesign);
    
    // Generate supporting files with LLM
    const packageJson = await this.llmService.generatePackageJson(plan);
    const mtaYaml = await this.llmService.generateMTAYaml(plan);
    const readme = await this.llmService.generateReadme(plan);
    
    return {
      db: cdsModels,
      srv: services,
      app: ui,
      packageJson,
      mtaYaml,
      readme,
      xsSecurity: this.generateXSSecurity(plan),
      gitignore: this.generateGitignore()
    };
  }
  
  // Step 4: Validate generated code
  private async stepValidate(capProject: CAPProject): Promise<ValidationResult> {
    // Trigger validation hooks
    const hookResults = await this.hookManager.trigger('on-resurrection-validate', { capProject });
    
    // Run quality checks
    const syntaxValid = await this.validateCDSSyntax(capProject.db);
    const structureValid = await this.validateCAPStructure(capProject);
    const cleanCoreCompliant = await this.validateCleanCore(capProject);
    const businessLogicPreserved = await this.validateBusinessLogic(capProject);
    
    const passed = syntaxValid && structureValid && cleanCoreCompliant && businessLogicPreserved;
    
    return {
      passed,
      syntaxValid,
      structureValid,
      cleanCoreCompliant,
      businessLogicPreserved,
      errors: hookResults.errors || [],
      warnings: hookResults.warnings || []
    };
  }
  
  // Step 5: Deploy to GitHub
  private async stepDeploy(resurrectionId: string, capProject: CAPProject): Promise<DeploymentResult> {
    const resurrection = await prisma.resurrection.findUnique({ where: { id: resurrectionId } });
    
    // Create GitHub repository
    const repo = await this.mcpOrchestrator.createGitHubRepo({
      name: `resurrection-${resurrection.name}-${Date.now()}`,
      files: this.flattenCAPProject(capProject),
      description: `Resurrected from ABAP: ${resurrection.description}`
    });
    
    // Generate BAS deep link
    const basUrl = this.generateBASLink(repo.url);
    
    // Update resurrection record
    await prisma.resurrection.update({
      where: { id: resurrectionId },
      data: {
        githubUrl: repo.url,
        basUrl,
        githubMethod: 'MCP_AUTO'
      }
    });
    
    // Send Slack notification
    await this.mcpOrchestrator.notifySlack('#resurrections', resurrection, 'completed');
    
    return {
      githubUrl: repo.url,
      basUrl,
      repoName: repo.name
    };
  }
  
  private async updateStatus(resurrectionId: string, status: string): Promise<void> {
    await prisma.resurrection.update({
      where: { id: resurrectionId },
      data: { status }
    });
    
    // Emit real-time update via WebSocket
    this.emitProgress(resurrectionId, { status, timestamp: new Date() });
  }
  
  private async logStep(resurrectionId: string, step: string, data: any): Promise<void> {
    await prisma.transformationLog.create({
      data: {
        resurrectionId,
        step,
        request: data.input || {},
        response: data.output || data,
        status: 'COMPLETED',
        duration: data.duration || 0
      }
    });
  }
}
```

### 3. MCP Orchestration Service

**Purpose:** Manage MCP server lifecycle and coordinate MCP calls

```typescript
// lib/mcp/orchestrator.ts
import { MCPClient } from './mcp-client';

export class MCPOrchestrator {
  private clients: Map<string, MCPClient>;
  
  constructor(config: MCPConfig) {
    this.clients = new Map();
    this.initializeClients(config);
  }
  
  async analyzeABAP(abapCode: string, context: object): Promise<AnalysisResult> {
    const client = this.clients.get('abap-analyzer');
    return await client.call('analyzeCode', { code: abapCode, context });
  }
  
  async generateCDS(models: object): Promise<CDSFiles> {
    const client = this.clients.get('sap-cap-generator');
    return await client.call('generateCDSModels', { models });
  }
  
  async generateServices(services: object): Promise<ServiceFiles> {
    const client = this.clients.get('sap-cap-generator');
    return await client.call('generateServiceDefinitions', { services });
  }
  
  async generateUI(uiDesign: object): Promise<UIFiles> {
    const client = this.clients.get('sap-ui5-generator');
    return await client.call('generateFioriElements', { design: uiDesign });
  }
  
  async createGitHubRepo(config: RepoConfig): Promise<RepoInfo> {
    const githubClient = this.clients.get('github');
    
    // Create repository
    const repo = await githubClient.call('createRepository', {
      name: config.name,
      description: config.description,
      auto_init: true,
      private: false
    });
    
    // Commit all files
    await githubClient.call('createOrUpdateFiles', {
      repo: repo.name,
      files: config.files,
      message: '🔄 Resurrection: ABAP to CAP transformation complete'
    });
    
    // Add topics
    await githubClient.call('addTopics', {
      repo: repo.name,
      topics: ['sap-cap', 'abap-resurrection', 'clean-core', 'sap-btp']
    });
    
    // Setup CI/CD
    await githubClient.call('createWorkflow', {
      repo: repo.name,
      workflow: this.generateCIWorkflow()
    });
    
    return repo;
  }
  
  async notifySlack(channel: string, resurrection: Resurrection, event: string): Promise<void> {
    const slackClient = this.clients.get('slack');
    
    const messages = {
      'started': `🚀 Resurrection started: ${resurrection.name}`,
      'completed': `✅ Resurrection completed: ${resurrection.name}\n🔗 GitHub: ${resurrection.githubUrl}\n💻 Open in BAS: ${resurrection.basUrl}`,
      'failed': `🔴 Resurrection failed: ${resurrection.name}\n❌ Error: ${resurrection.error}`,
      'deployed': `🎉 Resurrection deployed: ${resurrection.name}\n🌐 Live URL: ${resurrection.deploymentUrl}`
    };
    
    await slackClient.call('postMessage', {
      channel,
      text: messages[event],
      attachments: [{
        color: event === 'failed' ? 'danger' : 'good',
        fields: [
          { title: 'Module', value: resurrection.module },
          { title: 'LOC Saved', value: resurrection.locSaved.toString() },
          { title: 'Quality Score', value: `${resurrection.qualityScore}%` }
        ]
      }]
    });
  }
}
```

### 3. Kiro Hooks Configuration

**Purpose:** Automate quality validation, testing, and notifications

**Hook Configuration File:** `.kiro/hooks/resurrection-hooks.json`

```json
{
  "hooks": [
    {
      "id": "on-resurrection-start",
      "name": "Notify team on resurrection start",
      "trigger": "resurrection.started",
      "enabled": true,
      "actions": [
        {
          "type": "mcp-call",
          "server": "slack",
          "method": "postMessage",
          "params": {
            "channel": "#resurrections",
            "text": "🚀 New resurrection: {{resurrection.name}}"
          }
        }
      ]
    },
    {
      "id": "on-resurrection-complete",
      "name": "Quality validation on completion",
      "trigger": "resurrection.completed",
      "enabled": true,
      "actions": [
        {
          "type": "agent-execution",
          "message": "Validate quality for resurrection {{resurrection.id}}: Check CDS syntax, CAP structure, Clean Core compliance"
        },
        {
          "type": "mcp-call",
          "server": "github",
          "method": "createIssue",
          "params": {
            "repo": "{{resurrection.githubRepo}}",
            "title": "Quality Validation Results",
            "body": "{{quality_report}}",
            "labels": ["quality", "automated"]
          }
        }
      ]
    },
    {
      "id": "on-quality-failure",
      "name": "Alert on quality validation failure",
      "trigger": "quality.validation.failed",
      "enabled": true,
      "actions": [
        {
          "type": "mcp-call",
          "server": "slack",
          "method": "postMessage",
          "params": {
            "channel": "#resurrections",
            "text": "⚠️ Quality validation failed for {{resurrection.name}}",
            "attachments": [{
              "color": "danger",
              "title": "Validation Errors",
              "text": "{{validation_errors}}",
              "actions": [{
                "type": "button",
                "text": "View in GitHub",
                "url": "{{resurrection.githubUrl}}"
              }]
            }]
          }
        },
        {
          "type": "mcp-call",
          "server": "github",
          "method": "createIssue",
          "params": {
            "repo": "{{resurrection.githubRepo}}",
            "title": "🔴 Quality Validation Failed",
            "body": "{{validation_errors}}",
            "labels": ["bug", "quality-failure"],
            "assignees": ["{{resurrection.owner}}"]
          }
        }
      ]
    },
    {
      "id": "on-deployment-success",
      "name": "Celebrate deployment success",
      "trigger": "deployment.succeeded",
      "enabled": true,
      "actions": [
        {
          "type": "mcp-call",
          "server": "slack",
          "method": "postMessage",
          "params": {
            "channel": "#resurrections",
            "text": "🎉 Resurrection deployed successfully!",
            "attachments": [{
              "color": "good",
              "title": "{{resurrection.name}}",
              "fields": [
                { "title": "Application URL", "value": "{{deployment.url}}" },
                { "title": "GitHub Repo", "value": "{{resurrection.githubUrl}}" },
                { "title": "Lines of Code Saved", "value": "{{metrics.locSaved}}" }
              ]
            }]
          }
        },
        {
          "type": "mcp-call",
          "server": "github",
          "method": "createRelease",
          "params": {
            "repo": "{{resurrection.githubRepo}}",
            "tag_name": "v1.0.0",
            "name": "Production Release",
            "body": "Deployed to SAP BTP: {{deployment.url}}"
          }
        }
      ]
    },
    {
      "id": "setup-ci-cd",
      "name": "Configure GitHub Actions CI/CD",
      "trigger": "github.repository.created",
      "enabled": true,
      "actions": [
        {
          "type": "mcp-call",
          "server": "github",
          "method": "createOrUpdateFile",
          "params": {
            "repo": "{{resurrection.githubRepo}}",
            "path": ".github/workflows/ci.yml",
            "content": "{{ci_workflow_template}}"
          }
        }
      ]
    }
  ]
}
```

### 4. Resurrection CAP App Structure

**Complete CAP Project Generated for Each Resurrection:**

```
resurrection-sd-pricing-20241123/
├── db/
│   ├── schema.cds                 # CDS data models
│   ├── data/                      # Sample data (CSV files)
│   │   ├── SalesOrders.csv
│   │   └── Customers.csv
│   └── src/                       # Database procedures (optional)
├── srv/
│   ├── service.cds                # Service definitions
│   ├── service.js                 # Service implementation
│   └── handlers/                  # Business logic handlers
│       ├── pricing.js
│       └── validation.js
├── app/
│   ├── orders/                    # Fiori UI app
│   │   ├── webapp/
│   │   │   ├── manifest.json
│   │   │   ├── Component.js
│   │   │   └── annotations.cds    # Fiori Elements annotations
│   │   └── package.json
│   └── index.html                 # Launchpad
├── .github/
│   └── workflows/
│       └── ci.yml                 # GitHub Actions CI/CD
├── mta.yaml                       # BTP deployment descriptor
├── package.json                   # Dependencies and scripts
├── xs-security.json               # XSUAA configuration
├── .gitignore
├── README.md                      # Setup and deployment guide
└── RESURRECTION.md                # Original ABAP context
```

**Key Files Generated:**

**package.json:**
```json
{
  "name": "resurrection-sd-pricing",
  "version": "1.0.0",
  "description": "Resurrected from ABAP: SD Pricing Logic",
  "scripts": {
    "start": "cds watch",
    "build": "cds build",
    "deploy": "cds deploy",
    "test": "jest"
  },
  "dependencies": {
    "@sap/cds": "^7.0.0",
    "@sap/xssec": "^3.0.0",
    "express": "^4.18.0"
  },
  "devDependencies": {
    "@sap/cds-dk": "^7.0.0",
    "jest": "^29.0.0"
  },
  "cds": {
    "requires": {
      "db": {
        "kind": "hana"
      },
      "auth": {
        "kind": "xsuaa"
      }
    }
  }
}
```

**mta.yaml:**
```yaml
_schema-version: '3.1'
ID: resurrection-sd-pricing
version: 1.0.0
description: Resurrected CAP application from ABAP

modules:
  - name: resurrection-sd-pricing-srv
    type: nodejs
    path: gen/srv
    requires:
      - name: resurrection-sd-pricing-db
      - name: resurrection-sd-pricing-xsuaa
    provides:
      - name: srv-api
        properties:
          srv-url: ${default-url}

  - name: resurrection-sd-pricing-db-deployer
    type: hdb
    path: gen/db
    requires:
      - name: resurrection-sd-pricing-db

  - name: resurrection-sd-pricing-app
    type: approuter.nodejs
    path: app
    requires:
      - name: srv-api
      - name: resurrection-sd-pricing-xsuaa

resources:
  - name: resurrection-sd-pricing-db
    type: com.sap.xs.hdi-container
    parameters:
      service: hana
      service-plan: hdi-shared

  - name: resurrection-sd-pricing-xsuaa
    type: org.cloudfoundry.managed-service
    parameters:
      service: xsuaa
      service-plan: application
      path: ./xs-security.json
```

**xs-security.json:**
```json
{
  "xsappname": "resurrection-sd-pricing",
  "tenant-mode": "dedicated",
  "scopes": [
    {
      "name": "$XSAPPNAME.Admin",
      "description": "Administrator"
    },
    {
      "name": "$XSAPPNAME.User",
      "description": "User"
    }
  ],
  "role-templates": [
    {
      "name": "Admin",
      "description": "Administrator",
      "scope-references": ["$XSAPPNAME.Admin"]
    },
    {
      "name": "User",
      "description": "User",
      "scope-references": ["$XSAPPNAME.User"]
    }
  ]
}
```

**README.md (Generated):**
```markdown
# Resurrection: SD Pricing Logic

🔄 This CAP application was resurrected from legacy ABAP code.

## Original ABAP Context
- **Module:** SD (Sales & Distribution)
- **Functions:** Z_CALCULATE_DISCOUNT, Z_PRICING_PROCEDURE
- **Tables Used:** VBAK, VBAP, KONV
- **Transformation Date:** 2024-11-23

## Local Development

### Prerequisites
- Node.js 18+
- @sap/cds-dk

### Setup
\`\`\`bash
npm install
cds watch
\`\`\`

Access at: http://localhost:4004

## Deploy to SAP BTP

### Prerequisites
- Cloud Foundry CLI
- MTA Build Tool
- SAP BTP account

### Deployment
\`\`\`bash
# Login to Cloud Foundry
cf login -a https://api.cf.{region}.hana.ondemand.com

# Build MTA
mbt build

# Deploy
cf deploy mta_archives/resurrection-sd-pricing_1.0.0.mtar
\`\`\`

## Open in SAP Business Application Studio

[Open in BAS](https://bas.{region}.hana.ondemand.com/?gitClone=https://github.com/{org}/resurrection-sd-pricing-20241123)

## Architecture

- **Database:** SAP HANA Cloud (HDI Container)
- **Backend:** SAP CAP (Node.js)
- **Frontend:** SAP Fiori Elements
- **Authentication:** XSUAA

## Business Logic Preserved

All ABAP business logic has been preserved:
- Pricing calculations
- Discount rules
- Validation logic
- Authorization checks

See RESURRECTION.md for detailed transformation notes.
```


## Data Models

### Database Schema (PostgreSQL/MongoDB)

```typescript
// prisma/schema.prisma (if using Prisma)

model User {
  id            String   @id @default(uuid())
  email         String   @unique
  name          String
  githubUsername String?
  slackUserId   String?
  createdAt     DateTime @default(now())
  updatedAt     DateTime @updatedAt
  
  resurrections Resurrection[]
}

model ABAPObject {
  id              String   @id @default(uuid())
  name            String
  type            String   // FUNCTION, REPORT, CLASS, etc.
  module          String   // SD, MM, FI, etc.
  content         String   @db.Text
  linesOfCode     Int
  complexity      Int?
  
  // Analysis results
  documentation   String?  @db.Text
  businessLogic   Json?
  dependencies    Json?
  tables          Json?
  
  // Vector embedding for semantic search
  embeddingId     String?  // Reference to Pinecone vector
  
  // Relationships
  resurrectionId  String?
  resurrection    Resurrection? @relation(fields: [resurrectionId], references: [id])
  
  createdAt       DateTime @default(now())
  updatedAt       DateTime @updatedAt
  
  @@index([module])
  @@index([type])
}

model Resurrection {
  id                String   @id @default(uuid())
  name              String
  description       String?
  status            String   // UPLOADED, ANALYZING, ANALYZED, TRANSFORMING, TRANSFORMED, DEPLOYED, FAILED
  module            String
  
  // GitHub integration
  githubRepo        String?
  githubUrl         String?
  githubMethod      String?  // MCP_AUTO, MANUAL_PUSH, USER_PROVIDED
  basUrl            String?
  
  // Deployment
  deploymentUrl     String?
  deploymentStatus  String?
  
  // Metrics
  originalLOC       Int?
  transformedLOC    Int?
  locSaved          Int?
  complexityScore   Float?
  qualityScore      Float?
  
  // Relationships
  userId            String
  user              User     @relation(fields: [userId], references: [id])
  abapObjects       ABAPObject[]
  transformationLogs TransformationLog[]
  qualityReports    QualityReport[]
  hookExecutions    HookExecution[]
  slackNotifications SlackNotification[]
  githubActivities  GitHubActivity[]
  
  createdAt         DateTime @default(now())
  updatedAt         DateTime @updatedAt
  
  @@index([status])
  @@index([userId])
  @@index([module])
}

model TransformationLog {
  id              String   @id @default(uuid())
  resurrectionId  String
  resurrection    Resurrection @relation(fields: [resurrectionId], references: [id])
  
  step            String   // PARSE_ABAP, GENERATE_CDS, GENERATE_UI, etc.
  mcpServer       String?
  request         Json?
  response        Json?
  duration        Int?     // milliseconds
  status          String   // STARTED, IN_PROGRESS, COMPLETED, FAILED
  errorMessage    String?
  
  createdAt       DateTime @default(now())
  
  @@index([resurrectionId])
}

model QualityReport {
  id                      String   @id @default(uuid())
  resurrectionId          String
  resurrection            Resurrection @relation(fields: [resurrectionId], references: [id])
  
  overallScore            Float
  syntaxValid             Boolean
  cleanCoreCompliant      Boolean
  businessLogicPreserved  Boolean
  testCoverage            Float?
  issues                  Json?
  recommendations         Json?
  
  createdAt               DateTime @default(now())
  
  @@index([resurrectionId])
}

model HookExecution {
  id              String   @id @default(uuid())
  resurrectionId  String?
  resurrection    Resurrection? @relation(fields: [resurrectionId], references: [id])
  
  hookId          String
  hookName        String
  trigger         String
  status          String   // TRIGGERED, RUNNING, COMPLETED, FAILED
  executionLog    Json?
  duration        Int?
  
  createdAt       DateTime @default(now())
  
  @@index([resurrectionId])
  @@index([hookId])
}

model SlackNotification {
  id              String   @id @default(uuid())
  resurrectionId  String?
  resurrection    Resurrection? @relation(fields: [resurrectionId], references: [id])
  
  channel         String
  message         String   @db.Text
  messageTs       String?  // Slack message timestamp
  threadTs        String?  // For threaded replies
  status          String
  
  createdAt       DateTime @default(now())
  
  @@index([resurrectionId])
}

model GitHubActivity {
  id              String   @id @default(uuid())
  resurrectionId  String?
  resurrection    Resurrection? @relation(fields: [resurrectionId], references: [id])
  
  activity        String   // REPO_CREATED, COMMIT_PUSHED, ISSUE_CREATED, etc.
  details         Json?
  githubUrl       String?
  
  createdAt       DateTime @default(now())
  
  @@index([resurrectionId])
}

model Redundancy {
  id                  String   @id @default(uuid())
  object1Id           String
  object2Id           String
  similarity          Float
  recommendation      String?
  potentialSavings    Int?
  status              String   // DETECTED, REVIEWED, CONSOLIDATED, IGNORED
  
  createdAt           DateTime @default(now())
  
  @@index([object1Id])
  @@index([object2Id])
}

model FitToStandardRecommendation {
  id                    String   @id @default(uuid())
  abapObjectId          String
  standardAlternative   String   // BAPI name, transaction code
  confidence            Float
  description           String   @db.Text
  implementationGuide   String?  @db.Text
  potentialSavings      Int?
  status                String   // RECOMMENDED, ACCEPTED, REJECTED, IMPLEMENTED
  
  createdAt             DateTime @default(now())
  
  @@index([abapObjectId])
}
```

### API Endpoints

**REST API Structure:**

```typescript
// API Routes

// Authentication
POST   /api/auth/login
POST   /api/auth/logout
GET    /api/auth/me

// ABAP Upload & Analysis
POST   /api/abap/upload              // Upload ABAP files
POST   /api/abap/analyze             // Trigger analysis
GET    /api/abap/objects             // List ABAP objects
GET    /api/abap/objects/:id         // Get object details
POST   /api/abap/search              // Semantic search

// Intelligence Dashboard
GET    /api/dashboard/metrics        // Get dashboard metrics
GET    /api/dashboard/dependencies   // Get dependency graph
GET    /api/dashboard/redundancies   // Get redundancy analysis
GET    /api/dashboard/fit-to-standard // Get fit-to-standard recommendations

// Q&A
POST   /api/qa/ask                   // Ask question
GET    /api/qa/suggestions           // Get suggested questions
GET    /api/qa/history               // Get Q&A history

// Resurrections
POST   /api/resurrections            // Create resurrection
GET    /api/resurrections            // List resurrections
GET    /api/resurrections/:id        // Get resurrection details
POST   /api/resurrections/:id/start  // Start transformation
POST   /api/resurrections/:id/github // Create GitHub repo
POST   /api/resurrections/:id/export // Export for manual push
GET    /api/resurrections/:id/status // Get transformation status

// MCP Management
GET    /api/mcp/servers              // List MCP servers
GET    /api/mcp/servers/:id/health   // Check MCP server health
POST   /api/mcp/servers/:id/test     // Test MCP server

// Hooks
GET    /api/hooks                    // List hooks
POST   /api/hooks/:id/trigger        // Manually trigger hook
GET    /api/hooks/executions         // Get hook execution history

// Admin
GET    /api/admin/stats              // Platform statistics
GET    /api/admin/users              // List users
POST   /api/admin/config             // Update configuration
```


## Correctness Properties

*A property is a characteristic or behavior that should hold true across all valid executions of a system-essentially, a formal statement about what the system should do. Properties serve as the bridge between human-readable specifications and machine-verifiable correctness guarantees.*

### Property 1: Workflow Step Sequence
*For any* resurrection execution, all 5 workflow steps must execute in order: ANALYZE → PLAN → GENERATE → VALIDATE → DEPLOY, with no steps skipped unless explicitly failed.
**Validates: Requirements 3.1**

### Property 2: Workflow Step Logging
*For any* completed workflow step, a TransformationLog entry must be created with fields: resurrectionId, step, status, duration, and timestamp.
**Validates: Requirements 3.7**

### Property 3: MCP Invocation for ABAP Parsing
*For any* ABAP code upload, the ABAP Analyzer MCP server must be invoked and return a parseable response or clear error.
**Validates: Requirements 5.3**

### Property 4: Workflow Failure Handling
*For any* workflow step that fails, the resurrection status must be set to 'FAILED', error details must be logged, and the "on-resurrection-failed" hook must be triggered.
**Validates: Requirements 3.8**

### Property 5: Real-Time Progress Updates
*For any* workflow step transition, a real-time progress update must be emitted with current step name, status, and timestamp.
**Validates: Requirements 3.7**

### Property 6: Documentation and Embedding Generation
*For any* successfully parsed ABAP object, the system must generate both AI documentation (non-empty string) and vector embedding (1536 dimensions).
**Validates: Requirements 5.4**

### Property 7: Semantic Search Ranking
*For any* search query, results must be ranked by relevance score in descending order (highest relevance first).
**Validates: Requirements 6.5**

### Property 8: Q&A Response Structure
*For any* Q&A answer, the response must include a confidence level field (high/medium/low) and a sources array with at least one element when confidence is not low.
**Validates: Requirements 7.3**

### Property 9: CAP Package.json Completeness
*For any* generated CAP project, the package.json must include all required dependencies: @sap/cds, @sap/xssec, and express.
**Validates: Requirements 9.5**

### Property 10: Transformation Output Validation
*For any* completed transformation, validation must run and return a report with fields: syntaxValid, cleanCoreCompliant, businessLogicPreserved.
**Validates: Requirements 9.9**

### Property 11: GitHub Repository File Completeness
*For any* GitHub repository created via MCP, the repo must contain all required files: README.md, .gitignore, LICENSE, package.json, mta.yaml, and at least one CDS file.
**Validates: Requirements 10.2**

### Property 12: Git Commit Message Consistency
*For any* initial commit to a resurrection repository, the commit message must exactly match: "🔄 Resurrection: ABAP to CAP transformation complete".
**Validates: Requirements 10.4**

### Property 13: Hook Execution Guarantee
*For any* resurrection that reaches "COMPLETED" status, the "on-resurrection-complete" hook must be triggered and logged in HookExecutions table.
**Validates: Requirements 11.2**

### Property 14: CAP Folder Structure Completeness
*For any* generated resurrection CAP application, the folder structure must include: db/, srv/, app/, and files: mta.yaml, package.json, xs-security.json.
**Validates: Requirements 12.1**

### Property 15: CAP Build Validation
*For any* generated CAP application, running `npm install && cds build` must complete without errors (exit code 0).
**Validates: Requirements 12.10**

### Property 16: BAS Deep Link Format
*For any* resurrection with a GitHub repository, the generated BAS deep link must follow the format: `https://bas.{region}.hana.ondemand.com/?gitClone={repo_url}` and be a valid URL.
**Validates: Requirements 13.1**

### Property 17: Dashboard Data Completeness
*For any* dashboard load request, the response must include all resurrections for the authenticated user with fields: id, name, status, githubUrl, createdAt.
**Validates: Requirements 14.1**

### Property 18: Shadcn UI Component Usage
*For any* UI component rendered, it must use Shadcn UI base components (Button, Card, Dialog, Form, etc.) with Halloween theme variants.
**Validates: Requirements 17.1**

### Property 19: Halloween Color Palette Consistency
*For any* page or component, colors must use the defined Halloween palette: spooky-purple backgrounds, pumpkin-orange accents, ghost-white text.
**Validates: Requirements 17.2**

### Property 20: Spooky Terminology Consistency
*For any* user-facing text, resurrection-related actions must use spooky terminology: "Resurrect" (not "transform"), "Graveyard" (not "archived"), "Haunted" (not "error").
**Validates: Requirements 17.3**

### Property 21: Halloween Icon Presence
*For any* resurrection status display, the appropriate Halloween icon must be shown: 🎃 (start), 👻 (in-progress), ⚰️ (completed), 🦇 (failed).
**Validates: Requirements 17.4**

## Error Handling

### Error Categories and Strategies

**1. MCP Server Errors**
- Connection failures
- Timeout errors
- Invalid responses
- Rate limiting

**Strategy:**
```typescript
async function callMCPWithRetry(server: string, method: string, params: any, maxRetries = 3) {
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      return await mcpClient.call(server, method, params);
    } catch (error) {
      if (error.code === 'ECONNREFUSED') {
        await notifySlack('#platform-alerts', `🔴 ${server} MCP is offline`);
        throw new Error(`${server} service temporarily unavailable`);
      } else if (error.code === 'TIMEOUT' && attempt < maxRetries) {
        await sleep(1000 * attempt); // Exponential backoff
        continue;
      }
      throw error;
    }
  }
}
```

**2. GitHub API Errors**
- Authentication failures
- Repository name conflicts
- Rate limiting
- Permission errors

**Strategy:**
```typescript
async function createGitHubRepoWithFallback(name: string) {
  try {
    return await githubMCP.createRepository({ name });
  } catch (error) {
    if (error.status === 422 && error.message.includes('already exists')) {
      const uniqueName = `${name}-${Date.now()}`;
      return await githubMCP.createRepository({ name: uniqueName });
    } else if (error.status === 403) {
      // Rate limit - wait and retry
      const resetTime = error.headers['x-ratelimit-reset'];
      await sleep(resetTime - Date.now());
      return await githubMCP.createRepository({ name });
    }
    throw error;
  }
}
```

**3. Database Errors**
- Connection failures
- Unique constraint violations
- Transaction conflicts

**Strategy:**
```typescript
async function saveResurrectionWithRetry(data: ResurrectionData) {
  try {
    return await prisma.resurrection.create({ data });
  } catch (error) {
    if (error.code === 'P2002') { // Unique constraint
      data.name = `${data.name}-${Date.now()}`;
      return await prisma.resurrection.create({ data });
    } else if (error.code === 'P1001') { // Connection error
      await prisma.$disconnect();
      await prisma.$connect();
      return await prisma.resurrection.create({ data });
    }
    throw error;
  }
}
```

**4. Hook Execution Errors**
- Hook not found
- Hook timeout
- Action failures

**Strategy:**
```typescript
async function executeHookSafely(hookId: string, context: any) {
  const execution = await prisma.hookExecution.create({
    data: { hookId, status: 'TRIGGERED', executionLog: context }
  });
  
  try {
    const hook = await getHook(hookId);
    if (!hook) throw new Error(`Hook ${hookId} not found`);
    
    const result = await Promise.race([
      executeHookActions(hook.actions, context),
      timeout(30000) // 30 second timeout
    ]);
    
    await prisma.hookExecution.update({
      where: { id: execution.id },
      data: { status: 'COMPLETED', executionLog: { ...context, result } }
    });
  } catch (error) {
    await prisma.hookExecution.update({
      where: { id: execution.id },
      data: { status: 'FAILED', executionLog: { ...context, error: error.message } }
    });
    // Don't throw - log and continue
    console.error(`Hook ${hookId} failed:`, error);
  }
}
```

## Testing Strategy

### Unit Testing
**Framework:** Jest with TypeScript

**Coverage:**
- MCP client wrappers
- Resurrection engine logic
- Hook execution
- Data validation
- API endpoints

**Example:**
```typescript
describe('MCPOrchestrator', () => {
  it('should call ABAP Analyzer MCP for code analysis', async () => {
    const orchestrator = new MCPOrchestrator(mockConfig);
    const result = await orchestrator.analyzeABAP(sampleABAPCode, {});
    
    expect(result).toHaveProperty('businessLogic');
    expect(result).toHaveProperty('dependencies');
    expect(mockMCPClient.call).toHaveBeenCalledWith('analyzeCode', expect.any(Object));
  });
});
```

### Integration Testing
**Scenarios:**
- End-to-end resurrection flow
- MCP server integration
- GitHub repo creation
- Slack notifications
- Hook execution

**Example:**
```typescript
describe('Resurrection Flow', () => {
  it('should complete full resurrection lifecycle', async () => {
    // Upload ABAP
    const upload = await request(app).post('/api/abap/upload').attach('file', abapFile);
    expect(upload.status).toBe(200);
    
    // Start resurrection
    const resurrection = await request(app).post('/api/resurrections').send({
      name: 'test-resurrection',
      abapObjectIds: [upload.body.objectId]
    });
    
    // Wait for completion
    await waitFor(() => resurrection.status === 'TRANSFORMED');
    
    // Verify GitHub repo created
    expect(resurrection.githubUrl).toMatch(/github.com/);
    
    // Verify Slack notification sent
    const notifications = await prisma.slackNotification.findMany({
      where: { resurrectionId: resurrection.id }
    });
    expect(notifications.length).toBeGreaterThan(0);
  });
});
```

### Property-Based Testing
**Framework:** fast-check

**Properties to Test:**
- Dashboard metrics accuracy (Property 13)
- Search result ranking (Property 3)
- Q&A response structure (Property 4)
- CAP file completeness (Properties 7, 10)
- BAS link format (Property 12)

**Example:**
```typescript
import fc from 'fast-check';

describe('Property: CAP Package.json Completeness', () => {
  it('should include all required dependencies for any CAP project', () => {
    fc.assert(
      fc.property(
        fc.record({
          name: fc.string(),
          businessLogic: fc.object()
        }),
        async (resurrectionData) => {
          const capProject = await generateCAPProject(resurrectionData);
          const packageJson = JSON.parse(capProject.files['package.json']);
          
          expect(packageJson.dependencies).toHaveProperty('@sap/cds');
          expect(packageJson.dependencies).toHaveProperty('@sap/xssec');
          expect(packageJson.dependencies).toHaveProperty('express');
        }
      ),
      { numRuns: 100 }
    );
  });
});
```

### End-to-End Testing
**Framework:** Playwright

**Scenarios:**
- User onboarding flow
- ABAP upload and analysis
- Resurrection wizard
- GitHub repo creation
- Dashboard interactions

**Example:**
```typescript
test('complete resurrection wizard', async ({ page }) => {
  await page.goto('http://localhost:3000');
  
  // Upload ABAP
  await page.click('text=Upload ABAP');
  await page.setInputFiles('input[type="file"]', 'test-data/Z_PRICING.abap');
  await page.click('text=Analyze');
  
  // Wait for analysis
  await page.waitForSelector('text=Analysis Complete');
  
  // Start resurrection
  await page.click('text=Start Resurrection');
  await page.check('input[value="Z_PRICING"]');
  await page.click('text=Next');
  await page.fill('input[name="projectName"]', 'sd-pricing-logic');
  await page.click('text=Create Resurrection');
  
  // Wait for completion
  await page.waitForSelector('text=Resurrection Complete', { timeout: 60000 });
  
  // Verify GitHub link
  const githubLink = await page.locator('a[href*="github.com"]').getAttribute('href');
  expect(githubLink).toContain('resurrection-sd-pricing-logic');
});
```

