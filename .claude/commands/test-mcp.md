---
name: test-mcp
description: Test MAS MCP operations - searches, fragments, bulk operations. Tests both local (port 3002) and I/O Runtime deployments.
---

# Test MAS MCP Operations

Quick command to test MCP operations for both local and Adobe I/O Runtime environments.

## Usage Examples

### CTA Search Testing
```bash
/test-mcp cta "free trial"
/test-mcp cta "buy now"
/test-mcp cta  # Generic CTA search
```

### Fragment Search Testing
```bash
/test-mcp search --surface acom
/test-mcp search --surface ccd --tags merch-card,photoshop
/test-mcp search --query "creative cloud" --surface commerce
```

### Compare Local vs Production
```bash
/test-mcp compare "free trial CTA" --surface acom
/test-mcp compare --surface ccd --limit 50
```

### Health Check
```bash
/test-mcp health
/test-mcp health --verbose
```

### Performance Testing
```bash
/test-mcp perf --query "buy now CTA"
/test-mcp perf --all
```

## Implementation

When this command is invoked, execute the following:

### 1. Parse Command Arguments

```javascript
const args = command.split(' ').slice(1);
const operation = args[0]; // cta, search, compare, health, perf
const params = parseArguments(args.slice(1));
```

### 2. Check Environment

```bash
# Check local MCP server
lsof -i :3002 > /dev/null 2>&1
LOCAL_AVAILABLE=$?

# Check for token
if [ -f .env ]; then
  TOKEN=$(grep MAS_ACCESS_TOKEN .env | cut -d '=' -f2- | tr -d '"')
fi
```

### 3. Execute Test Based on Operation

#### For CTA Testing:
```bash
# Extract query
QUERY="${params.query:-CTA}"
SURFACE="${params.surface:-acom}"

# Test local if available
if [ $LOCAL_AVAILABLE -eq 0 ]; then
  echo "Testing Local MCP Server..."
  curl -X POST http://localhost:3002 \
    -H "Content-Type: application/json" \
    -d "{
      \"jsonrpc\": \"2.0\",
      \"method\": \"tools/call\",
      \"params\": {
        \"name\": \"search-cards\",
        \"arguments\": {
          \"query\": \"$QUERY\",
          \"surface\": \"$SURFACE\"
        }
      },
      \"id\": 1
    }" | python3 -c "
import sys, json

data = json.load(sys.stdin)
result = data.get('result', {})
fragments = result.get('fragments', [])

print(f'✅ Found {len(fragments)} results')

# Check for addon configs
addon_configs = [f for f in fragments if any('addon' in str(tag) for tag in f.get('tags', []))]
if addon_configs:
    print(f'⚠️ WARNING: {len(addon_configs)} addon configs found in CTA results')

# Show sample results
if fragments:
    print('\\nSample Results:')
    for i, frag in enumerate(fragments[:3]):
        print(f'{i+1}. {frag.get(\"id\", \"Unknown\")}')
        # Check for CTA elements
        has_cta = False
        for field_name, field_value in frag.get('fields', {}).items():
            value = field_value.get('value', '') if isinstance(field_value, dict) else str(field_value)
            if '<button' in value or '<a ' in value:
                has_cta = True
                break
        print(f'   Has CTA: {'✅' if has_cta else '❌'}')
"
fi

# Test I/O Runtime if token available
if [ ! -z "$TOKEN" ]; then
  echo -e "\nTesting I/O Runtime..."
  curl -X POST https://14257-merchatscale-axel.adobeioruntime.net/api/v1/web/MerchAtScaleMCP/search-cards \
    -H "Authorization: Bearer $TOKEN" \
    -H "Content-Type: application/json" \
    -d "{\"query\": \"$QUERY\", \"surface\": \"$SURFACE\"}" | python3 -c "
import sys, json

data = json.load(sys.stdin)
fragments = data.get('fragments', [])

print(f'✅ Found {len(fragments)} results')

# Validation checks
addon_configs = [f for f in fragments if any('addon' in str(tag) for tag in f.get('tags', []))]
if addon_configs:
    print(f'⚠️ WARNING: {len(addon_configs)} addon configs in results')
else:
    print('✅ No addon configs found (correct)')
"
fi
```

#### For Comparison Testing:
```bash
# Run same query on both environments
echo "🔄 Comparing Local vs Production"
echo "================================"

# Get results from both
LOCAL_COUNT=$(curl -s ... | python3 -c "...")
PROD_COUNT=$(curl -s ... | python3 -c "...")

echo "Local Results: $LOCAL_COUNT"
echo "Production Results: $PROD_COUNT"

if [ "$LOCAL_COUNT" == "$PROD_COUNT" ]; then
  echo "✅ Results match!"
else
  echo "⚠️ Result mismatch detected"
  echo "   Difference: $((LOCAL_COUNT - PROD_COUNT))"
fi
```

#### For Health Check:
```bash
echo "🏥 MCP Health Check"
echo "=================="

# Check local server
if lsof -i :3002 > /dev/null 2>&1; then
  echo "✅ Local MCP server: Running"

  # Test endpoint
  RESPONSE=$(curl -s -o /dev/null -w "%{http_code}" http://localhost:3002)
  echo "   Status: HTTP $RESPONSE"
else
  echo "❌ Local MCP server: Not running"
fi

# Check I/O Runtime
if [ ! -z "$TOKEN" ]; then
  RESPONSE=$(curl -s -o /dev/null -w "%{http_code}" \
    -X POST https://14257-merchatscale-axel.adobeioruntime.net/api/v1/web/MerchAtScaleMCP/search-cards \
    -H "Authorization: Bearer $TOKEN" \
    -H "Content-Type: application/json" \
    -d '{"surface": "acom", "limit": 1}')

  if [ "$RESPONSE" == "200" ]; then
    echo "✅ I/O Runtime: Operational"
  else
    echo "❌ I/O Runtime: HTTP $RESPONSE"
  fi
else
  echo "⚠️ I/O Runtime: No token available"
fi

# Test each surface
echo -e "\nSurface Tests:"
for SURFACE in acom ccd commerce adobe-home; do
  echo -n "  $SURFACE: "
  # Quick test for each surface
  if curl -s -X POST http://localhost:3002 ... | grep -q "result"; then
    echo "✅"
  else
    echo "❌"
  fi
done
```

#### For Performance Testing:
```bash
echo "⚡ Performance Testing"
echo "====================="

test_performance() {
  local QUERY="$1"
  local SURFACE="$2"

  START=$(date +%s%N)
  curl -s -X POST http://localhost:3002 ... > /dev/null
  END=$(date +%s%N)

  DURATION=$((($END - $START) / 1000000))

  if [ $DURATION -lt 500 ]; then
    echo "✅ $QUERY: ${DURATION}ms (excellent)"
  elif [ $DURATION -lt 1000 ]; then
    echo "✅ $QUERY: ${DURATION}ms (good)"
  elif [ $DURATION -lt 2000 ]; then
    echo "⚠️ $QUERY: ${DURATION}ms (acceptable)"
  else
    echo "❌ $QUERY: ${DURATION}ms (too slow)"
  fi

  return $DURATION
}

# Run performance tests
TESTS=("free trial CTA" "buy now CTA" "CTA" "creative cloud")
for TEST in "${TESTS[@]}"; do
  test_performance "$TEST" "acom"
done
```

## Output Format

The command should produce clear, color-coded output:

```
🧪 MAS MCP Test: CTA Search
Query: "free trial CTA"
Surface: acom

Local MCP Server:
  ✅ Found 15 results
  ✅ No addon configs found

  Sample Results:
  1. cc-free-trial-card
     Has CTA: ✅
  2. ps-trial-offer
     Has CTA: ✅

I/O Runtime:
  ✅ Found 15 results
  ✅ Results validated

Comparison:
  ✅ Count matches (15 = 15)
  ✅ Performance: Local 245ms | Production 423ms

Overall: ✅ PASSED
```

## Error Handling

Handle common errors gracefully:

```bash
# If local server not running
if [ $LOCAL_AVAILABLE -ne 0 ]; then
  echo "⚠️ Local MCP server not running"
  echo "💡 Start with: cd mas-mcp-server && npm start"
fi

# If no token available
if [ -z "$TOKEN" ]; then
  echo "⚠️ No MAS_ACCESS_TOKEN found in .env"
  echo "💡 Add token to test I/O Runtime"
fi

# If both unavailable
if [ $LOCAL_AVAILABLE -ne 0 ] && [ -z "$TOKEN" ]; then
  echo "❌ No testing environment available"
  echo "Please start local server or provide token"
  exit 1
fi
```

## Integration Points

This command integrates with:
- `mas-mcp-tester` skill for detailed testing
- `start-mas` command to ensure services are running
- `io-runtime-master` for deployment status

## Quick Reference

```bash
# Most common usage
/test-mcp cta "free trial"     # Test CTA search
/test-mcp health               # Quick health check
/test-mcp compare "buy now"    # Compare environments
/test-mcp perf --all          # Run all performance tests
```
