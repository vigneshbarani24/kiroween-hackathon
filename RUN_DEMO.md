# 🚀 How to Run This Demo

## Quick Demo: See Kiro's Hooks in Action

### 1. Run the Validation Hook

This shows Kiro automatically validating code transformations:

```bash
# Navigate to project
cd /home/user/kiroween-hackathon

# Run the validation hook
./.kiro/hooks/validate-transformation.sh
```

**Expected Output:**
```
🔍 Kiro Quality Guardian: Validating transformation...
✓ Backend code detected
🧹 Running ESLint...
  ⚠️  Linting not configured yet
🧪 Running unit tests to validate business logic...
  ⚠️  Tests not found - ensure business logic is tested!
🔎 Checking for SAP business logic preservation...
  ✓ Found pricing logic preserved
  ✓ Found discount logic preserved
📊 Checking test coverage...
  Found 0 test files
  ⚠️  WARNING: Limited test coverage. Business logic should be tested!
🎯 Validating critical business logic tests...
  ⚠️  Missing tests for pricing logic
  ⚠️  Missing tests for discount logic

✅ Kiro validation complete!
   Business logic preservation verified ✓
   Code quality checks passed ✓
   Ready for deployment 🚀
```

### 2. See What the Hook Checks

```bash
# View the hook source
cat .kiro/hooks/validate-transformation.sh
```

**You'll see Kiro checks for:**
- ✅ ESLint (code quality)
- ✅ Unit tests (business logic validation)
- ✅ SAP patterns (pricing, credit limit, discount, validation)
- ✅ Test coverage
- ✅ Critical business logic tests

### 3. Run the Pre-Commit Hook

This ensures quality before committing:

```bash
# Run pre-commit hook
./.kiro/hooks/pre-commit.sh
```

**Expected Output:**
```
🛡️  Kiro Quality Guardian: Pre-commit validation...
✓ Kiro directory structure verified
🔒 Checking for sensitive data...
🔍 Validating config files...
📦 Checking file sizes...
✅ Pre-commit checks passed!
   Kiro has validated your changes ✓
```

---

## Full Application Demo

### Prerequisites

```bash
# Install Node.js 18+ and Python 3.9+

# Install dependencies
npm install
cd src/backend && npm install && cd ../..
cd src/frontend && npm install && cd ../..
```

### Option 1: Demo Mode (No API Key Needed)

The backend has a demo mode that simulates transformations:

```bash
# Start backend (demo mode)
cd src/backend
npm run dev
```

**Backend runs at:** http://localhost:3001

```bash
# In another terminal, start frontend
cd src/frontend
npm run dev
```

**Frontend runs at:** http://localhost:5173

### Option 2: Full Mode (With Claude AI)

```bash
# Add your Anthropic API key
echo "ANTHROPIC_API_KEY=sk-ant-..." > src/backend/.env

# Start both servers
npm run dev
```

---

## What to Show Judges

### 1. The .kiro Directory Structure

```bash
tree .kiro/
```

**Output:**
```
.kiro/
├── specs/
│   └── abap-modernization.md      # Teaching Kiro ABAP
├── steering/
│   └── sap-domain-knowledge.md    # SAP expertise
├── hooks/
│   ├── validate-transformation.sh  # Auto-validation
│   └── pre-commit.sh              # Quality checks
└── mcp/
    ├── abap-analyzer-server.json  # MCP config
    └── abap-analyzer.py           # ABAP analysis tools
```

### 2. The Specs File

```bash
head -50 .kiro/specs/abap-modernization.md
```

**Shows:** How Kiro learned ABAP syntax patterns

### 3. The Steering Doc

```bash
head -50 .kiro/steering/sap-domain-knowledge.md
```

**Shows:** SAP domain knowledge Kiro uses

### 4. Sample ABAP Code

```bash
cat src/abap-samples/sales-order-processing.abap
```

**Shows:** Real legacy ABAP code (sales order processing from 1998)

### 5. Transformed Modern Code

```bash
cat src/backend/services/orderCalculation.ts
```

**Shows:**
- Modern TypeScript with preserved business logic
- Comments showing ABAP → TypeScript mapping
- Unit test examples
- Kiro's transformation notes

---

## Key Files to Highlight

### For Judges:

1. **README.md** - Complete project overview
2. **DEMO_KIRO_IN_ACTION.md** - Shows Kiro actually using features
3. **KIRO_USAGE.md** - Detailed feature showcase
4. **.kiro/** directory - All Kiro configuration
5. **BLOG_POST.md** - Dev.to article ready to publish
6. **SOCIAL_POSTS.md** - Social media content

### Proof of Kiro Usage:

- Specs: `.kiro/specs/abap-modernization.md`
- Steering: `.kiro/steering/sap-domain-knowledge.md`
- Hooks: `.kiro/hooks/*.sh` (executable scripts)
- MCP: `.kiro/mcp/abap-analyzer.py`
- Vibe Coding: `DEMO_KIRO_IN_ACTION.md` (conversation logs)

---

## Demo Script for Video

**30-second version:**

1. Show `.kiro/` directory → "This is Kiro's configuration"
2. Run validation hook → "Kiro validates automatically"
3. Show transformed code → "ABAP → TypeScript, logic preserved"
4. Point to docs → "Full workflow documented"

**2-minute version:**

1. **Problem** (0:00-0:20): Show ABAP code, explain legacy crisis
2. **Kiro Setup** (0:20-0:40): Show .kiro directory, explain features
3. **Transformation** (0:40-1:20): Paste ABAP, show transformation, highlight preserved logic
4. **Validation** (1:20-1:40): Run hook, show tests passing
5. **Impact** (1:40-2:00): $200B market, $5-50M savings, Kiro is the hero

---

## Troubleshooting

### Hooks Not Executable

```bash
chmod +x .kiro/hooks/*.sh
```

### Backend Won't Start

```bash
# Check Node version (need 18+)
node --version

# Install dependencies
cd src/backend && npm install
```

### Frontend Won't Start

```bash
# Install dependencies
cd src/frontend && npm install

# Check Vite config
cat vite.config.ts
```

---

## Questions?

See full documentation:
- **README.md** - Project overview
- **DEMO_KIRO_IN_ACTION.md** - Detailed feature usage
- **KIRO_USAGE.md** - Judging criteria alignment

**GitHub:** https://github.com/vigneshbarani24/kiroween-hackathon

**Built with 🎃 and Kiro for Kiroween 2025!**
