#!/usr/bin/env python3
"""
ABAP Analyzer MCP Server
Extends Kiro's capabilities with ABAP-specific syntax analysis

This MCP server enables Kiro to:
1. Parse and understand ABAP syntax
2. Detect SAP-specific patterns
3. Extract business logic
4. Generate modern code equivalents
"""

import json
import re
import sys
from typing import Dict, List, Any


class ABAPAnalyzer:
    """ABAP code analysis engine for Kiro"""

    # Standard SAP table patterns
    SAP_TABLES = {
        'VBAK': 'Sales Document Header',
        'VBAP': 'Sales Document Items',
        'KNA1': 'Customer Master',
        'MARA': 'Material Master',
        'BKPF': 'Accounting Document Header',
        'BSEG': 'Accounting Document Line Items',
        'LFA1': 'Vendor Master',
        'EKKO': 'Purchase Order Header',
    }

    # BAPI pattern detection
    BAPI_PATTERNS = {
        r'BAPI_SALESORDER': 'Sales Order Management',
        r'BAPI_CUSTOMER': 'Customer Master Management',
        r'BAPI_MATERIAL': 'Material Master Management',
        r'BAPI_PO': 'Purchase Order Management',
    }

    def parse_abap(self, code: str, extraction_type: str = 'all') -> Dict[str, Any]:
        """Parse ABAP code and extract patterns"""
        result = {
            'status': 'success',
            'patterns': {}
        }

        if extraction_type in ['all', 'database']:
            result['patterns']['database'] = self._extract_database_operations(code)

        if extraction_type in ['all', 'variables']:
            result['patterns']['variables'] = self._extract_variables(code)

        if extraction_type in ['all', 'functions']:
            result['patterns']['functions'] = self._extract_functions(code)

        if extraction_type in ['all', 'business_logic']:
            result['patterns']['business_logic'] = self._extract_business_logic(code)

        return result

    def _extract_database_operations(self, code: str) -> List[Dict]:
        """Extract SELECT, INSERT, UPDATE, DELETE statements"""
        operations = []

        # SELECT patterns
        select_pattern = r'SELECT\s+(?P<fields>.*?)\s+FROM\s+(?P<table>\w+)'
        for match in re.finditer(select_pattern, code, re.IGNORECASE | re.DOTALL):
            table = match.group('table')
            operations.append({
                'type': 'SELECT',
                'table': table,
                'sap_table_description': self.SAP_TABLES.get(table.upper(), 'Unknown'),
                'fields': match.group('fields').strip()
            })

        # INSERT/UPDATE patterns
        for op_type in ['INSERT', 'UPDATE', 'MODIFY']:
            pattern = rf'{op_type}\s+(?P<table>\w+)'
            for match in re.finditer(pattern, code, re.IGNORECASE):
                table = match.group('table')
                operations.append({
                    'type': op_type,
                    'table': table,
                    'sap_table_description': self.SAP_TABLES.get(table.upper(), 'Unknown')
                })

        return operations

    def _extract_variables(self, code: str) -> List[Dict]:
        """Extract DATA declarations"""
        variables = []

        # DATA: lv_name TYPE type
        data_pattern = r'DATA:\s*(?P<name>\w+)\s+TYPE\s+(?P<type>[\w\(\)]+)'
        for match in re.finditer(data_pattern, code, re.IGNORECASE):
            variables.append({
                'name': match.group('name'),
                'abap_type': match.group('type'),
                'modern_type': self._convert_abap_type(match.group('type'))
            })

        return variables

    def _extract_functions(self, code: str) -> List[Dict]:
        """Extract FUNCTION or CALL FUNCTION statements"""
        functions = []

        # CALL FUNCTION 'NAME'
        call_pattern = r"CALL\s+FUNCTION\s+'(?P<name>[\w_]+)'"
        for match in re.finditer(call_pattern, code, re.IGNORECASE):
            func_name = match.group('name')
            functions.append({
                'name': func_name,
                'type': 'call',
                'is_bapi': func_name.startswith('BAPI_'),
                'description': self._describe_function(func_name)
            })

        # FUNCTION definition
        def_pattern = r'FUNCTION\s+(?P<name>[\w_]+)'
        for match in re.finditer(def_pattern, code, re.IGNORECASE):
            if not match.group(0).startswith('CALL'):
                functions.append({
                    'name': match.group('name'),
                    'type': 'definition'
                })

        return functions

    def _extract_business_logic(self, code: str) -> List[Dict]:
        """Extract business rules, validations, calculations"""
        logic = []

        # IF conditions (business rules)
        if_pattern = r'IF\s+(?P<condition>[^.]+)\.'
        for match in re.finditer(if_pattern, code, re.IGNORECASE):
            condition = match.group('condition').strip()
            logic.append({
                'type': 'validation',
                'pattern': 'IF condition',
                'condition': condition
            })

        # CASE statements (business logic branching)
        case_pattern = r'CASE\s+(?P<variable>\w+)'
        for match in re.finditer(case_pattern, code, re.IGNORECASE):
            logic.append({
                'type': 'branching',
                'pattern': 'CASE',
                'variable': match.group('variable')
            })

        # LOOP processing
        loop_pattern = r'LOOP\s+AT\s+(?P<table>\w+)'
        for match in re.finditer(loop_pattern, code, re.IGNORECASE):
            logic.append({
                'type': 'iteration',
                'pattern': 'LOOP',
                'table': match.group('table')
            })

        return logic

    def detect_sap_patterns(self, code: str) -> Dict[str, Any]:
        """Identify standard SAP patterns"""
        patterns = {
            'bapis': [],
            'tables': [],
            'modules': set(),
            'pricing_logic': False,
            'authorization_checks': False
        }

        # Detect BAPIs
        for bapi_pattern, description in self.BAPI_PATTERNS.items():
            if re.search(bapi_pattern, code, re.IGNORECASE):
                patterns['bapis'].append({
                    'pattern': bapi_pattern,
                    'description': description
                })

        # Detect SAP tables
        for table, description in self.SAP_TABLES.items():
            if re.search(rf'\b{table}\b', code, re.IGNORECASE):
                patterns['tables'].append({
                    'table': table,
                    'description': description
                })
                # Determine module based on table
                module = self._get_module_from_table(table)
                if module:
                    patterns['modules'].add(module)

        # Detect pricing logic
        if re.search(r'condition|pricing|discount|kbetr', code, re.IGNORECASE):
            patterns['pricing_logic'] = True

        # Detect authorization checks
        if re.search(r'AUTHORITY-CHECK', code, re.IGNORECASE):
            patterns['authorization_checks'] = True

        patterns['modules'] = list(patterns['modules'])
        return patterns

    def generate_modern_equivalent(self, abap_code: str, target_language: str, preserve_comments: bool = True) -> str:
        """Generate modern code from ABAP"""
        if target_language == 'typescript':
            return self._generate_typescript(abap_code, preserve_comments)
        elif target_language == 'python':
            return self._generate_python(abap_code, preserve_comments)
        else:
            return "// Unsupported target language"

    def _generate_typescript(self, abap_code: str, preserve_comments: bool) -> str:
        """Generate TypeScript equivalent"""
        output = []

        if preserve_comments:
            output.append("// Transformed from ABAP by Kiro")
            output.append("")

        # Extract and transform variables
        variables = self._extract_variables(abap_code)
        if variables:
            output.append("// Variable declarations")
            for var in variables:
                output.append(f"let {var['name']}: {var['modern_type']};")
            output.append("")

        # Extract database operations
        db_ops = self._extract_database_operations(abap_code)
        if db_ops:
            output.append("// Database operations")
            for op in db_ops:
                if op['type'] == 'SELECT':
                    output.append(f"const data = await db.{op['table'].lower()}.findMany();")
                elif op['type'] == 'INSERT':
                    output.append(f"await db.{op['table'].lower()}.create({{ data: {{}} }});")
            output.append("")

        return "\n".join(output)

    def _generate_python(self, abap_code: str, preserve_comments: bool) -> str:
        """Generate Python equivalent"""
        output = []

        if preserve_comments:
            output.append("# Transformed from ABAP by Kiro")
            output.append("")

        # Basic transformation (placeholder)
        output.append("# Python transformation coming soon")

        return "\n".join(output)

    def validate_business_logic(self, original_abap: str, modern_code: str) -> Dict[str, Any]:
        """Validate that business logic is preserved"""
        abap_logic = self._extract_business_logic(original_abap)

        validation = {
            'status': 'validated',
            'checks': [],
            'warnings': [],
            'preserved_logic_count': len(abap_logic)
        }

        # Check for IF conditions
        abap_ifs = len([l for l in abap_logic if l['type'] == 'validation'])
        modern_ifs = len(re.findall(r'\bif\b', modern_code, re.IGNORECASE))

        validation['checks'].append({
            'type': 'validations',
            'abap_count': abap_ifs,
            'modern_count': modern_ifs,
            'status': 'ok' if modern_ifs >= abap_ifs else 'warning'
        })

        if modern_ifs < abap_ifs:
            validation['warnings'].append("Some ABAP validations may not be preserved")

        return validation

    def extract_data_model(self, code: str, output_format: str = 'typescript') -> str:
        """Extract database schema from ABAP"""
        db_ops = self._extract_database_operations(code)
        tables = set(op['table'] for op in db_ops)

        if output_format == 'typescript':
            output = ["// Data Models\n"]
            for table in tables:
                output.append(f"interface {table.capitalize()} {{")
                output.append(f"  // TODO: Define fields from {self.SAP_TABLES.get(table.upper(), 'SAP table')}")
                output.append("}\n")
            return "\n".join(output)

        return "// Unsupported format"

    # Helper methods

    def _convert_abap_type(self, abap_type: str) -> str:
        """Convert ABAP type to TypeScript type"""
        type_map = {
            'i': 'number',
            'string': 'string',
            'char': 'string',
            'p': 'number',  # Packed decimal
            'f': 'number',
            'kunnr': 'string',  # Customer number
            'vbeln': 'string',  # Sales document
        }

        for abap, ts in type_map.items():
            if abap in abap_type.lower():
                return ts

        return 'any'

    def _describe_function(self, func_name: str) -> str:
        """Describe what a function does"""
        if func_name.startswith('BAPI_SALESORDER'):
            return 'Sales Order Management BAPI'
        elif func_name.startswith('BAPI_'):
            return 'Standard SAP Business API'
        return 'Custom Function Module'

    def _get_module_from_table(self, table: str) -> str:
        """Determine SAP module from table name"""
        module_map = {
            'VB': 'SD',  # Sales & Distribution
            'KN': 'SD',  # Customer Master
            'MA': 'MM',  # Materials Management
            'EK': 'MM',  # Purchasing
            'BK': 'FI',  # Financial Accounting
            'BS': 'FI',
            'LF': 'MM',  # Vendor
        }

        prefix = table[:2].upper()
        return module_map.get(prefix, '')


def handle_mcp_request(request: Dict[str, Any]) -> Dict[str, Any]:
    """Handle incoming MCP tool requests"""
    analyzer = ABAPAnalyzer()

    tool_name = request.get('method')
    params = request.get('params', {})

    try:
        if tool_name == 'parse_abap':
            result = analyzer.parse_abap(
                params.get('code', ''),
                params.get('extractionType', 'all')
            )
        elif tool_name == 'detect_sap_patterns':
            result = analyzer.detect_sap_patterns(params.get('code', ''))
        elif tool_name == 'generate_modern_equivalent':
            result = analyzer.generate_modern_equivalent(
                params.get('abapCode', ''),
                params.get('targetLanguage', 'typescript'),
                params.get('preserveComments', True)
            )
        elif tool_name == 'validate_business_logic':
            result = analyzer.validate_business_logic(
                params.get('originalAbap', ''),
                params.get('modernCode', '')
            )
        elif tool_name == 'extract_data_model':
            result = analyzer.extract_data_model(
                params.get('code', ''),
                params.get('outputFormat', 'typescript')
            )
        else:
            return {'error': f'Unknown tool: {tool_name}'}

        return {'result': result}

    except Exception as e:
        return {'error': str(e)}


if __name__ == '__main__':
    # MCP stdio server loop
    print("ABAP Analyzer MCP Server started", file=sys.stderr)
    print("Extending Kiro with ABAP analysis superpowers...", file=sys.stderr)

    while True:
        try:
            line = input()
            if not line:
                break

            request = json.loads(line)
            response = handle_mcp_request(request)
            print(json.dumps(response))
            sys.stdout.flush()

        except EOFError:
            break
        except Exception as e:
            error_response = {'error': str(e)}
            print(json.dumps(error_response))
            sys.stdout.flush()
