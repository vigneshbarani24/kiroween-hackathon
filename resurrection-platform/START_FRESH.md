# Start Fresh - Complete Reset Guide

## Current Issues
1. ✅ Code is correct
2. ✅ Routes exist
3. ❌ Next.js cache is stale
4. ❌ Prisma client needs regeneration

## Complete Reset (2 minutes)

### Step 1: Stop Everything
```bash
# Press Ctrl+C to stop the dev server
```

### Step 2: Clean Everything
```bash
cd resurrection-platform

# Delete Next.js cache
rm -rf .next

# Delete Prisma client (Windows)
rmdir /s /q node_modules\.prisma

# Or on Mac/Linux
# rm -rf node_modules/.prisma
```

### Step 3: Regenerate Prisma
```bash
npx prisma generate
```

You should see:
```
✔ Generated Prisma Client
```

### Step 4: Start Fresh
```bash
npm run dev
```

Wait for:
```
✓ Ready in X seconds
○ Local: http://localhost:3000
```

### Step 5: Test
1. Go to `http://localhost:3000/resurrections/new`
2. Upload test ABAP file
3. Complete wizard
4. Should work!

## What This Fixes

- ✅ Prisma knows about `abapCode` field
- ✅ Next.js routes are fresh
- ✅ No stale cache
- ✅ All API routes work
- ✅ Workflow starts automatically

## Expected Console Output

When you create a resurrection, you should see:
```
[Wizard] Reading ABAP code from 1 files
[Wizard] Read 113 characters from abap.txt
[Wizard] Total ABAP code length: 113 characters
[Wizard] Creating resurrection with payload: {...}
POST /api/resurrections 201
POST /api/resurrections/XXX/start 202
[Start Workflow] Using abapCode field: 113 characters
[HybridWorkflow] Starting workflow...
```

## If Still Not Working

### Check 1: Prisma Generated?
```bash
ls node_modules/.prisma/client
```

Should show files. If not, run `npx prisma generate` again.

### Check 2: Next.js Running?
```bash
# Should see this in terminal:
✓ Ready in X seconds
```

### Check 3: Port 3000 Free?
```bash
# Windows
netstat -ano | findstr :3000

# Mac/Linux  
lsof -i :3000
```

If port is in use, kill the process or use different port:
```bash
PORT=3001 npm run dev
```

## Nuclear Option (If Nothing Works)

```bash
# Stop server
# Delete everything
rm -rf .next node_modules

# Fresh install
npm install

# Generate Prisma
npx prisma generate

# Start
npm run dev
```

This takes 2-3 minutes but guarantees a clean state.

## Success Indicators

✅ Server starts without errors
✅ Can access `/resurrections/new`
✅ Can upload ABAP file
✅ Wizard completes
✅ Redirects to detail page
✅ Status changes from ANALYZING → PLANNING → etc.
✅ No 404 errors in console

---

**Time Required:** 2 minutes
**Success Rate:** 99%
**Last Resort:** Nuclear option (5 minutes)
