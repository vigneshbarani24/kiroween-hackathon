#!/bin/bash

# Kiro Pre-Commit Hook: Ensure quality before committing
# This demonstrates Kiro's role as the quality guardian

set -e

echo "🛡️  Kiro Quality Guardian: Pre-commit validation..."

# Ensure .kiro directory is NOT in .gitignore (required for hackathon)
if [[ -f ".gitignore" ]] && grep -q "^\.kiro" .gitignore; then
    echo "❌ ERROR: .kiro directory is in .gitignore!"
    echo "   This will disqualify the submission per hackathon rules."
    echo "   Remove .kiro from .gitignore"
    exit 1
fi

# Ensure we have all required Kiro directories
REQUIRED_DIRS=(".kiro/specs" ".kiro/hooks" ".kiro/steering")
for dir in "${REQUIRED_DIRS[@]}"; do
    if [[ ! -d "$dir" ]]; then
        echo "❌ ERROR: Missing required directory: $dir"
        exit 1
    fi
done

echo "✓ Kiro directory structure verified"

# Check for sensitive data
echo "🔒 Checking for sensitive data..."
SENSITIVE_PATTERNS=(
    "password.*=.*['\"]"
    "api[_-]?key.*=.*['\"]"
    "secret.*=.*['\"]"
    "token.*=.*['\"]"
)

for pattern in "${SENSITIVE_PATTERNS[@]}"; do
    if git diff --cached | grep -iE "$pattern"; then
        echo "⚠️  WARNING: Potential sensitive data detected!"
        echo "   Pattern: $pattern"
        echo "   Please review before committing"
    fi
done

# Validate JSON/YAML files
echo "🔍 Validating config files..."
for file in $(git diff --cached --name-only | grep -E '\.(json|yaml|yml)$'); do
    if [[ -f "$file" ]]; then
        if [[ "$file" == *.json ]]; then
            python3 -m json.tool "$file" > /dev/null 2>&1 || {
                echo "❌ Invalid JSON: $file"
                exit 1
            }
            echo "  ✓ $file is valid JSON"
        fi
    fi
done

# Check for large files
echo "📦 Checking file sizes..."
for file in $(git diff --cached --name-only); do
    if [[ -f "$file" ]]; then
        size=$(stat -f%z "$file" 2>/dev/null || stat -c%s "$file" 2>/dev/null || echo 0)
        if [[ $size -gt 5242880 ]]; then  # 5MB
            echo "⚠️  WARNING: Large file detected: $file ($(($size / 1024 / 1024))MB)"
            echo "   Consider using Git LFS for large files"
        fi
    fi
done

echo "✅ Pre-commit checks passed!"
echo "   Kiro has validated your changes ✓"
