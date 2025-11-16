# SAP Domain Knowledge Steering Document

## Purpose
This steering document equips Kiro with 40 years of SAP enterprise software expertise to ensure accurate modernization of legacy ABAP code.

## SAP System Architecture

### Core Modules
Kiro should recognize these standard SAP modules:
- **SD (Sales & Distribution):** Order management, pricing, shipping
- **MM (Materials Management):** Procurement, inventory, warehouse
- **FI (Financial Accounting):** GL, AP, AR, asset accounting
- **CO (Controlling):** Cost centers, profit centers, internal orders
- **HR (Human Resources):** Payroll, personnel, org management
- **PP (Production Planning):** MRP, capacity planning, shop floor

### Critical SAP Tables (Kiro should recognize these)
```
VBAK - Sales Document Header
VBAP - Sales Document Items
KNA1 - Customer Master (General)
MARA - Material Master
BKPF - Accounting Document Header
BSEG - Accounting Document Line Items
LFA1 - Vendor Master
EKKO - Purchase Order Header
```

## Business Logic Patterns

### 1. SAP Pricing Procedure
SAP uses complex condition-based pricing that MUST be preserved:

```abap
* Standard pricing logic - preserve exactly
LOOP AT pricing_conditions INTO condition.
  CASE condition-type.
    WHEN 'PR00'.  "Base price
      price = condition-amount.
    WHEN 'K004'.  "Material discount
      price = price - ( price * condition-percentage / 100 ).
    WHEN 'K005'.  "Customer discount
      price = price - ( price * condition-percentage / 100 ).
    WHEN 'MWST'.  "Tax
      price = price + ( price * condition-percentage / 100 ).
  ENDCASE.
ENDLOOP.
```

**Kiro Instruction:** When transforming pricing logic, create a flexible condition engine, NOT hardcoded calculations. The sequence matters.

### 2. SAP Authorization Objects
Preserve security checks:

```abap
AUTHORITY-CHECK OBJECT 'V_VBAK_VKO'
  ID 'VKORG' FIELD sales_org
  ID 'VTWEG' FIELD distribution_channel
  ID 'SPART' FIELD division
  ID 'ACTVT' FIELD '02'.  "Change authority
```

**Modern Equivalent:**
```typescript
await authService.checkPermission({
  object: 'sales_order',
  salesOrg: order.salesOrg,
  channel: order.distributionChannel,
  division: order.division,
  action: 'update'
});
```

### 3. SAP Number Ranges
SAP uses configurable number range objects:

```abap
CALL FUNCTION 'NUMBER_GET_NEXT'
  EXPORTING
    nr_range_nr = '01'
    object      = 'VBELN'  "Sales order number
  IMPORTING
    number      = order_number.
```

**Kiro Instruction:** Replace with modern ID generation (UUIDs or database sequences) but document the original SAP number range pattern.

### 4. SAP Batch Processing
Many ABAP programs run as batch jobs:

```abap
* Process in chunks of 1000 to avoid memory issues
LOOP AT all_orders INTO order.
  APPEND order TO batch_orders.

  IF lines( batch_orders ) >= 1000.
    PERFORM process_batch USING batch_orders.
    CLEAR batch_orders.
  ENDIF.
ENDLOOP.
```

**Modern Pattern:** Use async queues (AWS SQS, Bull) with worker processes.

## Common ABAP Gotchas (Kiro MUST handle)

### 1. SY-SUBRC (System Return Code)
```abap
READ TABLE customers WITH KEY id = '12345' INTO customer.
IF sy-subrc = 0.
  "Found - process customer
ELSE.
  "Not found - handle error
ENDIF.
```

**Pattern:** Every database/table operation sets sy-subrc. 0 = success, 4 = not found, 8 = error.

**Modern:** Replace with proper error handling (try/catch, null checks).

### 2. ABAP Date/Time Format
```abap
DATA: lv_date TYPE sy-datum.  "YYYYMMDD format (e.g., 20240315)
DATA: lv_time TYPE sy-uzeit.  "HHMMSS format (e.g., 143022)
```

**Kiro Instruction:** Convert to ISO 8601 (2024-03-15T14:30:22Z) in modern code.

### 3. ABAP Type P (Packed Decimals)
```abap
DATA: lv_amount TYPE p DECIMALS 2.  "Fixed precision
lv_amount = '1234.56'.
```

**Kiro Instruction:** Use Decimal types (not float!) to avoid rounding errors in financial calculations.

### 4. Implicit Type Conversions
ABAP does automatic type conversions that can cause bugs:

```abap
DATA: lv_string TYPE string VALUE '00123',
      lv_number TYPE i.
lv_number = lv_string.  "Becomes 123 (leading zeros stripped)
```

**Kiro Instruction:** Make conversions explicit in modern code with proper validation.

## SAP Integration Points

### 1. RFC (Remote Function Calls)
```abap
CALL FUNCTION 'BAPI_SALESORDER_CREATEFROMDAT2'
  DESTINATION 'SAP_SYSTEM'
  EXPORTING
    order_header_in = header
  TABLES
    return = messages.
```

**Modern Pattern:** Replace with REST API calls to external services.

### 2. IDoc (Intermediate Documents)
SAP's EDI message format for integration.

**Kiro Instruction:** Transform to JSON/XML webhooks or message queues (SQS, Kafka).

### 3. BAPIs (Business APIs)
Standardized SAP function modules.

**Pattern Recognition:** BAPI names indicate business objects:
- `BAPI_SALESORDER_*` → Sales Order API
- `BAPI_CUSTOMER_*` → Customer API
- `BAPI_MATERIAL_*` → Product/Material API

## Performance Patterns

### Database Access
```abap
* BAD - Table scan
SELECT * FROM vbak WHERE netwr > 1000.

* GOOD - Index usage
SELECT * FROM vbak WHERE vbeln IN sales_orders.
```

**Kiro Instruction:** Ensure modern code uses proper indexing and query optimization.

### Internal Tables
```abap
* ABAP uses in-memory tables heavily
DATA: lt_orders TYPE STANDARD TABLE OF vbak WITH KEY vbeln.

* Sorted tables for fast access
DATA: lt_sorted TYPE SORTED TABLE OF vbak WITH UNIQUE KEY vbeln.
```

**Modern Pattern:** Map to in-memory caching (Redis) or proper database queries.

## Business Rules to Preserve

### 1. Credit Limit Checks
```abap
IF customer-credit_limit < ( customer-current_balance + order-total ).
  MESSAGE 'Credit limit exceeded' TYPE 'E'.
ENDIF.
```

**Kiro:** ALWAYS preserve financial validations exactly.

### 2. Material Availability
```abap
CALL FUNCTION 'ATP_CHECK'  "Available to Promise
  EXPORTING
    material = order_item-material
    quantity = order_item-quantity
    date     = order_item-delivery_date.
```

**Kiro:** Replace with modern inventory service but preserve check logic.

### 3. Workflow Approvals
Complex approval chains must be preserved:
- Order value thresholds
- Multi-level approvals
- Substitution rules
- Email notifications

## Kiro Success Criteria

When transforming SAP ABAP code, Kiro should:

✅ **Preserve ALL business logic** - no shortcuts on validations, calculations, or workflows
✅ **Recognize SAP patterns** - pricing, authorization, number ranges, batch processing
✅ **Handle ABAP quirks** - sy-subrc, type P decimals, date formats
✅ **Modernize architecture** - microservices, APIs, cloud-native patterns
✅ **Maintain data integrity** - transaction boundaries, error handling
✅ **Document assumptions** - flag any transformations that needed interpretation
✅ **Generate tests** - validate business logic preservation

---

**With this steering document, Kiro becomes an SAP expert capable of handling the complexity that has stumped enterprises for decades.**
