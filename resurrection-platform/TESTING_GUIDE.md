# Testing Guide - Resurrection Platform

## Quick Test: Upload ABAP File

### Option 1: Use Sample File
1. Download the test ABAP file: `/public/test-abap-sample.abap`
2. Navigate to `/resurrections/new`
3. Upload the file
4. Follow the wizard steps

### Option 2: Create Your Own Test File
Create a file named `test.abap` with this content:

```abap
REPORT z_test.

DATA: lv_value TYPE i.

lv_value = 100.

WRITE: / 'Test value:', lv_value.
```

## Debugging the "abapCode is required" Error

If you see this error, check the browser console for these logs:

```
[Wizard] Reading ABAP code from X files
[Wizard] Reading file: filename.abap Size: XXXX
[Wizard] Read XXXX characters from filename.abap
[Wizard] Total ABAP code length: XXXX characters
[Wizard] Creating resurrection with payload: {...}
```

### Common Issues:

1. **Empty Files**
   - Error: "No ABAP code content found"
   - Solution: Make sure your .abap file has actual content

2. **File Not Readable**
   - Error: "Failed to read file"
   - Solution: Check file permissions, try re-uploading

3. **Invalid File Format**
   - Error: "Invalid format"
   - Solution: Use .abap or .txt extension

4. **File Too Large**
   - Error: "File too large"
   - Solution: Files must be under 10MB

## Testing Workflow

### Step 1: Upload (Should see sidebar/header)
- ✅ Sidebar visible on left
- ✅ Header visible on top
- ✅ Upload zone accepts .abap and .txt files
- ✅ Files show as "valid" with green checkmark

### Step 2: Review Analysis
- ✅ Shows business logic, tables, patterns
- ✅ Displays complexity score
- ✅ Shows module (SD, MM, FI, CUSTOM)

### Step 3: Configure
- ✅ Project name auto-generated
- ✅ Can choose template (Fiori List, Object Page, API-only)
- ✅ Name validation (lowercase, numbers, hyphens only)

### Step 4: Confirm & Start
- ✅ Shows summary of configuration
- ✅ "Start Resurrection" button works
- ✅ Navigates to resurrection detail page
- ✅ Workflow starts automatically

## Browser Console Logs

### Expected Logs (Success):
```
[Wizard] Reading ABAP code from 1 files
[Wizard] Reading file: test.abap Size: 234
[Wizard] Read 234 characters from test.abap
[Wizard] Total ABAP code length: 250 characters
[Wizard] Creating resurrection with payload: { name: "...", abapCode: "250 characters" }
```

### Error Logs (Failure):
```
[Wizard] Failed to read test.abap: [error details]
```

## API Testing

### Test API Directly:
```bash
curl -X POST http://localhost:3000/api/resurrections \
  -H "Content-Type: application/json" \
  -d '{
    "name": "test-resurrection",
    "description": "Test",
    "module": "CUSTOM",
    "abapCode": "REPORT z_test.\nWRITE: / '\''Hello World'\''."
  }'
```

Expected response:
```json
{
  "success": true,
  "resurrectionId": "...",
  "resurrection": { ... }
}
```

## Troubleshooting

### Issue: "abapCode is required" even with valid file

**Check:**
1. Open browser DevTools (F12)
2. Go to Console tab
3. Look for `[Wizard]` logs
4. Check if file content was read successfully

**If no logs appear:**
- File might not be selected properly
- Try clicking "Browse Files" instead of drag-and-drop
- Refresh page and try again

**If logs show "0 characters":**
- File is empty
- File encoding issue (try saving as UTF-8)
- File permissions issue

### Issue: Sidebar/Header not showing

**Check:**
1. Are you at `/resurrections/new`? (correct)
2. Or at `/upload`? (wrong - old route)

**Solution:**
- Always use `/resurrections/new` for the wizard
- Update any bookmarks to new route

### Issue: Files not uploading

**Check:**
1. File extension (.abap or .txt)
2. File size (< 10MB)
3. File not empty
4. Browser console for errors

## Success Criteria

✅ Upload page shows sidebar and header
✅ Can upload .abap files
✅ Files show as "valid"
✅ Can proceed through all wizard steps
✅ No "abapCode is required" error
✅ Resurrection is created successfully
✅ Redirects to resurrection detail page

## Need Help?

Check the browser console logs and look for:
- `[Wizard]` prefix for wizard-related logs
- `[ResurrectionEngine]` for workflow logs
- `[MCPClient]` for MCP server logs

All logs include detailed information about what's happening at each step.
