# ABAP to Modern Stack Modernization Spec

## Overview
This spec teaches Kiro how to analyze and transform legacy SAP ABAP code (1980s-era proprietary language) into modern, cloud-native applications.

## Context: The ABAP Challenge
ABAP (Advanced Business Application Programming) is SAP's proprietary language from 1983. It powers critical business systems at 25,000+ enterprises but:
- Developer shortage (avg age 45+)
- Cryptic syntax, minimal documentation
- Billions spent on legacy maintenance
- Migration projects cost $5-50M and take 2-3 years

## Kiro's Role: The Hero
Kiro uses AI to understand what humans can't - decades-old business logic embedded in cryptic code - and resurrects it as modern applications.

## ABAP Syntax Patterns

### 1. Data Declarations
```abap
DATA: lv_customer TYPE kunnr,
      lt_orders TYPE TABLE OF vbak,
      ls_order TYPE vbak.
```

**Modern Equivalent (TypeScript):**
```typescript
let customer: string;
let orders: Order[] = [];
let order: Order;
```

### 2. Database Operations (Open SQL)
```abap
SELECT * FROM vbak
  INTO TABLE lt_orders
  WHERE kunnr = lv_customer.
```

**Modern Equivalent:**
```typescript
const orders = await db.orders.findMany({
  where: { customerId: customer }
});
```

### 3. Loop Processing
```abap
LOOP AT lt_orders INTO ls_order.
  WRITE: / ls_order-vbeln, ls_order-netwr.
ENDLOOP.
```

**Modern Equivalent:**
```typescript
orders.forEach(order => {
  console.log(`${order.id}: ${order.total}`);
});
```

### 4. Function Modules (Business Logic)
```abap
CALL FUNCTION 'BAPI_SALESORDER_CREATE'
  EXPORTING
    order_header_in = ls_header
  TABLES
    order_items     = lt_items
    return         = lt_return.
```

**Modern Equivalent (Microservice API):**
```typescript
const result = await salesOrderService.create({
  header: orderHeader,
  items: orderItems
});
```

### 5. Complex Business Logic Patterns
```abap
* Pricing calculation with conditions
READ TABLE lt_conditions WITH KEY kschl = 'PR00'
  INTO ls_condition.
IF sy-subrc = 0.
  lv_price = ls_condition-kbetr / 10.
  IF lv_quantity > 100.
    lv_price = lv_price * '0.95'.  "5% bulk discount
  ENDIF.
ENDIF.
```

**Modern Equivalent:**
```typescript
const priceCondition = conditions.find(c => c.type === 'PR00');
if (priceCondition) {
  let price = priceCondition.amount / 10;
  if (quantity > 100) {
    price *= 0.95; // 5% bulk discount
  }
}
```

## Transformation Requirements

### Business Logic Preservation
1. **Extract** all business rules, calculations, validations
2. **Preserve** exact logic flow and conditions
3. **Validate** output matches ABAP behavior 100%

### Modernization Targets
- **Frontend:** React with TypeScript
- **Backend:** Node.js/Express or Python/FastAPI
- **Database:** PostgreSQL (from SAP's proprietary DB)
- **Deployment:** AWS Lambda/ECS + RDS
- **API:** RESTful/GraphQL

### Data Model Migration
Map SAP tables to modern schemas:
- `VBAK` (Sales Orders) → `sales_orders` table
- `KNA1` (Customers) → `customers` table
- `MARA` (Materials) → `products` table

## Kiro Instructions

### Phase 1: Analysis
When given ABAP code:
1. Identify business entities (customers, orders, products)
2. Extract business logic (pricing, validation, workflows)
3. Map database operations to modern ORM queries
4. Document dependencies and integration points

### Phase 2: Transformation
Generate modern code that:
1. Maintains identical business logic
2. Uses modern patterns (async/await, REST APIs, React hooks)
3. Includes error handling and validation
4. Adds unit tests for business logic

### Phase 3: Validation
1. Generate test cases from ABAP scenarios
2. Ensure output matches ABAP behavior
3. Document any edge cases or assumptions

## Example: Complete Transformation

### Input: Legacy ABAP
```abap
FUNCTION z_calculate_order_total.
  TABLES: order_items TYPE ty_items.
  EXPORTING: total TYPE p DECIMALS 2.

  DATA: lv_subtotal TYPE p DECIMALS 2,
        ls_item TYPE ty_item.

  LOOP AT order_items INTO ls_item.
    lv_subtotal = lv_subtotal + ( ls_item-quantity * ls_item-price ).
  ENDLOOP.

  IF lv_subtotal > 1000.
    total = lv_subtotal * '0.90'.  "10% discount
  ELSE.
    total = lv_subtotal.
  ENDIF.
ENDFUNCTION.
```

### Output: Modern TypeScript
```typescript
interface OrderItem {
  quantity: number;
  price: number;
}

export async function calculateOrderTotal(items: OrderItem[]): Promise<number> {
  // Calculate subtotal
  const subtotal = items.reduce(
    (sum, item) => sum + (item.quantity * item.price),
    0
  );

  // Apply volume discount (preserved from ABAP logic)
  const total = subtotal > 1000
    ? subtotal * 0.90  // 10% discount for orders over $1000
    : subtotal;

  return Number(total.toFixed(2));
}

// Unit test (auto-generated)
describe('calculateOrderTotal', () => {
  it('should apply 10% discount for orders over $1000', () => {
    const items = [
      { quantity: 10, price: 110 }  // $1100 subtotal
    ];
    expect(calculateOrderTotal(items)).toBe(990);  // $1100 * 0.90
  });

  it('should not discount orders under $1000', () => {
    const items = [
      { quantity: 5, price: 100 }  // $500 subtotal
    ];
    expect(calculateOrderTotal(items)).toBe(500);
  });
});
```

## Success Criteria
- ✅ Business logic preservation: 100%
- ✅ Code quality: Modern patterns, typed, tested
- ✅ Performance: Cloud-native, scalable
- ✅ Maintainability: Clear, documented, standard tech stack

---

**This spec enables Kiro to be the hero that resurrects dead ABAP code into modern applications that developers can actually work with.**
