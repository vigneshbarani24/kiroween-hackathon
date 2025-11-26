#!/usr/bin/env python3
"""Test ABAP Analyzer MCP Server"""

import json
import subprocess

# Sample ABAP code for testing
sample_abap = """
REPORT z_pricing_logic.

DATA: lv_price TYPE p DECIMALS 2,
      lv_discount TYPE p DECIMALS 2,
      lv_tax TYPE p DECIMALS 2.

* Get base price from KONV table
SELECT SINGLE kbetr FROM konv
  INTO lv_price
  WHERE kschl = 'PR00'
    AND knumv = '0000000001'.

* Calculate discount
lv_discount = lv_price * 10 / 100.
lv_price = lv_price - lv_discount.

* Add tax
lv_tax = lv_price * 19 / 100.
lv_price = lv_price + lv_tax.

* Check credit limit
SELECT SINGLE klimk FROM kna1
  INTO @DATA(lv_credit_limit)
  WHERE kunnr = '0000100000'.

IF lv_price > lv_credit_limit.
  MESSAGE 'Credit limit exceeded' TYPE 'E'.
ENDIF.

* Authority check
AUTHORITY-CHECK OBJECT 'V_VBAK_VKO'
  ID 'VKORG' FIELD '1000'
  ID 'ACTVT' FIELD '02'.

WRITE: / 'Final price:', lv_price.
"""

# Create JSON-RPC request
request = {
    "jsonrpc": "2.0",
    "id": 1,
    "method": "analyzeCode",
    "params": {
        "code": sample_abap
    }
}

print("Testing ABAP Analyzer MCP Server...")
print("=" * 60)

try:
    # Start the MCP server process
    process = subprocess.Popen(
        ['python', '.kiro/mcp/abap-analyzer.py'],
        stdin=subprocess.PIPE,
        stdout=subprocess.PIPE,
        stderr=subprocess.PIPE,
        text=True
    )
    
    # Send request
    stdout, stderr = process.communicate(input=json.dumps(request) + '\n', timeout=5)
    
    # Print stderr (server logs)
    if stderr:
        print("Server logs:")
        print(stderr)
        print()
    
    # Parse response
    if stdout:
        response = json.loads(stdout.strip())
        
        if 'result' in response:
            result = response['result']['data']
            
            print("✅ ABAP Analyzer MCP Server is working!")
            print()
            print("Analysis Results:")
            print("-" * 60)
            print(f"Module: {result['metadata']['module']}")
            print(f"Complexity: {result['metadata']['complexity']}/10")
            print(f"Lines of Code: {result['metadata']['linesOfCode']}")
            print()
            print(f"Business Logic: {', '.join(result['businessLogic'])}")
            print(f"Tables: {', '.join(result['tables'])}")
            print(f"Patterns: {', '.join(result['patterns'])}")
            print()
            print("Documentation:")
            print(result['documentation'])
        else:
            print("❌ Error:", response.get('error', {}).get('message'))
    else:
        print("❌ No response from server")
        
except subprocess.TimeoutExpired:
    print("❌ Server timeout")
    process.kill()
except Exception as e:
    print(f"❌ Error: {e}")
