#!/bin/bash

echo "🔍 Validating netlify.toml syntax..."

# Check if netlify.toml exists
if [ ! -f "netlify.toml" ]; then
    echo "❌ Error: netlify.toml not found"
    exit 1
fi

# Basic TOML syntax checks
echo "📋 Checking for common TOML syntax issues..."

# Check for duplicate section headers (excluding array of tables)
DUPLICATE_SECTIONS=$(grep -E "^\[[^[]*\]" netlify.toml | sort | uniq -d)
if [ ! -z "$DUPLICATE_SECTIONS" ]; then
    echo "❌ Error: Duplicate section headers found:"
    echo "$DUPLICATE_SECTIONS"
    exit 1
fi

# Check for missing closing brackets
OPEN_BRACKETS=$(grep -o "\[" netlify.toml | wc -l)
CLOSE_BRACKETS=$(grep -o "\]" netlify.toml | wc -l)
if [ "$OPEN_BRACKETS" != "$CLOSE_BRACKETS" ]; then
    echo "❌ Error: Mismatched brackets - Open: $OPEN_BRACKETS, Close: $CLOSE_BRACKETS"
    exit 1
fi

# Check for valid key-value pairs
INVALID_PAIRS=$(grep -E "^[^#]*=.*$" netlify.toml | grep -v "=.*\".*\"" | grep -v "=.*[0-9]*" | grep -v "=.*true" | grep -v "=.*false" | grep -v "=.*\[" | grep -v "=.*\]" | grep -v "^#" | grep -v "^$" || true)
if [ ! -z "$INVALID_PAIRS" ]; then
    echo "⚠️  Warning: Potentially invalid key-value pairs:"
    echo "$INVALID_PAIRS"
fi

echo "✅ TOML syntax validation passed!"
echo "📁 netlify.toml is ready for deployment"
