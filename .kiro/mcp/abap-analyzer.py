#!/usr/bin/env python3
"""
ABAP Analyzer MCP Server

Analyzes ABAP code and extracts:
- Business logic patterns
- Database tables used
- Dependencies
- SAP patterns (pricing, authorization, etc.)
- Module classification
"""

import json
import sys
import re
from typing import Dict, List, Any

def analyze_abap_code(code: str) -> Dict[str, Any]:
    """Analyze ABAP code and extract metadata"""
    
    # Extract business logic patterns
    business_logic = []
    if 'CALCULATE' in code.upper():
        business_logic.append('Calculation logic')
    if 'PRICING' in code.upper() or 'KONV' in code.upper():
        business_logic.append('Pricing procedure')
    if 'CREDIT' in code.upper() and 'LIMIT' in code.upper():
        business_logic.append('Credit limit validation')
    if 'DISCOUNT' in code.upper():
        business_logic.append('Discount calculation')
    if 'TAX' in code.upper() or 'MWST' in code.upper():
        business_logic.append('Tax calculation')
    if 'AUTHORITY-CHECK' in code.upper():
        business_logic.append('Authorization checks')
    
    # Extract database tables
    tables = []
    table_patterns = [
        r'FROM\s+(\w+)',
        r'INTO\s+TABLE\s+(\w+)',
        r'SELECT.*FROM\s+(\w+)'
    ]
    for pattern in table_patterns:
        matches = re.findall(pattern, code, re.IGNORECASE)
        tables.extend(matches)
    
    # Common SAP tables
    sap_tables = ['VBAK', 'VBAP', 'KNA1', 'KONV', 'MARA', 'EKKO', 'EKPO', 'BKPF', 'BSEG']
    for table in sap_tables:
        if table in code.upper():
            tables.append(table)
    
    tables = list(set(tables))  # Remove duplicates
    
    # Extract dependencies
    dependencies = []
    if 'BAPI' in code.upper():
        bapi_matches = re.findall(r'BAPI_\w+', code, re.IGNORECASE)
        dependencies.extend(bapi_matches)
    if 'FUNCTION' in code.upper():
        func_matches = re.findall(r"FUNCTION\s+'?(\w+)'?", code, re.IGNORECASE)
        dependencies.extend(func_matches)
    
    dependencies = list(set(dependencies))
    
    # Detect SAP patterns
    patterns = []
    if 'KONV' in code.upper() or 'KSCHL' in code.upper():
        patterns.append('SAP Pricing Procedure')
    if 'AUTHORITY-CHECK' in code.upper():
        patterns.append('SAP Authorization Object')
    if 'NUMBER_GET_NEXT' in code.upper():
        patterns.append('SAP Number Range')
    if 'LOOP AT' in code.upper() and 'BATCH' in code.upper():
        patterns.append('SAP Batch Processing')
    
    # Determine module
    module = 'CUSTOM'
    if any(t in tables for t in ['VBAK', 'VBAP']):
        module = 'SD'  # Sales & Distribution
    elif any(t in tables for t in ['EKKO', 'EKPO']):
        module = 'MM'  # Materials Management
    elif any(t in tables for t in ['BKPF', 'BSEG']):
        module = 'FI'  # Financial Accounting
    
    # Calculate complexity (1-10)
    lines = code.split('\n')
    loc = len([l for l in lines if l.strip() and not l.strip().startswith('*')])
    complexity = min(10, max(1, loc // 20))  # 1 point per 20 LOC
    
    # Generate documentation
    documentation = f"""
## ABAP Code Analysis

**Module:** {module}
**Complexity:** {complexity}/10
**Lines of Code:** {loc}

### Business Logic
{chr(10).join(f'- {logic}' for logic in business_logic)}

### Database Tables
{chr(10).join(f'- {table}' for table in tables)}

### Dependencies
{chr(10).join(f'- {dep}' for dep in dependencies)}

### SAP Patterns Detected
{chr(10).join(f'- {pattern}' for pattern in patterns)}
"""
    
    return {
        'businessLogic': business_logic,
        'dependencies': dependencies,
        'tables': tables,
        'patterns': patterns,
        'metadata': {
            'module': module,
            'complexity': complexity,
            'linesOfCode': loc,
            'tables': tables,
            'patterns': patterns
        },
        'documentation': documentation.strip()
    }

def main():
    """MCP Server main loop"""
    print("ABAP Analyzer MCP Server started", file=sys.stderr)
    
    while True:
        try:
            # Read JSON-RPC request from stdin
            line = sys.stdin.readline()
            if not line:
                break
            
            request = json.loads(line)
            method = request.get('method')
            params = request.get('params', {})
            request_id = request.get('id')
            
            if method == 'analyzeCode':
                code = params.get('code', '')
                result = analyze_abap_code(code)
                
                response = {
                    'jsonrpc': '2.0',
                    'id': request_id,
                    'result': {
                        'success': True,
                        'data': result
                    }
                }
            else:
                response = {
                    'jsonrpc': '2.0',
                    'id': request_id,
                    'error': {
                        'code': -32601,
                        'message': f'Method not found: {method}'
                    }
                }
            
            # Write JSON-RPC response to stdout
            print(json.dumps(response), flush=True)
            
        except Exception as e:
            error_response = {
                'jsonrpc': '2.0',
                'id': request.get('id') if 'request' in locals() else None,
                'error': {
                    'code': -32603,
                    'message': str(e)
                }
            }
            print(json.dumps(error_response), flush=True)

if __name__ == '__main__':
    main()
