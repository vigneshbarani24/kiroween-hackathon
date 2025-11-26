# 🔧 Complete SAP CAP Transformation Example

**This file shows EXACTLY how ABAP transforms to SAP CAP with the Resurrection Platform**

---

## 📋 Example 1: Sales Order Calculation (Complete)

### **Input: Legacy ABAP (1998)**

**File:** `src/abap-samples/sales-order-calculation.abap`

```abap
*&---------------------------------------------------------------------*
*& Function Module Z_CALCULATE_SALES_ORDER
*& Created: 1998-03-15
*& Author: Legacy Developer (retired 2015)
*& Purpose: Calculate sales order total with discounts and tax
*&---------------------------------------------------------------------*
FUNCTION z_calculate_sales_order.
*"----------------------------------------------------------------------
*"*"Local Interface:
*"  IMPORTING
*"     VALUE(IV_ORDER_ID) TYPE VBELN
*"  EXPORTING
*"     VALUE(EV_TOTAL) TYPE WRBTR
*"     VALUE(EV_CURRENCY) TYPE WAERS
*"  TABLES
*"      ET_MESSAGES STRUCTURE BAPIRET2
*"----------------------------------------------------------------------

DATA: lt_items TYPE TABLE OF vbap,
      ls_item TYPE vbap,
      lt_pricing TYPE TABLE OF konv,
      ls_pricing TYPE konv,
      lv_customer TYPE kunnr,
      ls_customer TYPE kna1,
      lv_subtotal TYPE wrbtr,
      lv_material_discount TYPE wrbtr,
      lv_customer_discount TYPE wrbtr,
      lv_bulk_discount TYPE wrbtr,
      lv_tax TYPE wrbtr,
      lv_credit_limit TYPE wrbtr,
      lv_current_balance TYPE wrbtr.

CONSTANTS: lc_bulk_qty TYPE kwmeng VALUE 1000,
           lc_bulk_discount TYPE p DECIMALS 2 VALUE '0.05',
           lc_tax_rate TYPE p DECIMALS 2 VALUE '0.08'.

* Step 1: Get customer from order header
SELECT SINGLE kunnr FROM vbak
  INTO lv_customer
  WHERE vbeln = iv_order_id.

IF sy-subrc <> 0.
  APPEND VALUE #( type = 'E' id = 'ZSD' number = '001'
                  message = 'Order not found' ) TO et_messages.
  RETURN.
ENDIF.

* Step 2: Get customer master data for credit check
SELECT SINGLE * FROM kna1
  INTO ls_customer
  WHERE kunnr = lv_customer.

IF sy-subrc = 0.
  lv_credit_limit = ls_customer-klimk.
ELSE.
  lv_credit_limit = 0.
ENDIF.

* Step 3: Get order line items
SELECT * FROM vbap
  INTO TABLE lt_items
  WHERE vbeln = iv_order_id.

IF sy-subrc <> 0.
  APPEND VALUE #( type = 'E' id = 'ZSD' number = '002'
                  message = 'No items found' ) TO et_messages.
  RETURN.
ENDIF.

* Step 4: Calculate subtotal
LOOP AT lt_items INTO ls_item.
  lv_subtotal = lv_subtotal + ( ls_item-kwmeng * ls_item-netpr ).
ENDLOOP.

* Step 5: Get pricing conditions
SELECT * FROM konv
  INTO TABLE lt_pricing
  WHERE knumv = iv_order_id.

* Step 6: Apply pricing conditions
LOOP AT lt_pricing INTO ls_pricing.
  CASE ls_pricing-kschl.
    WHEN 'K004'.  "Material discount
      lv_material_discount = lv_material_discount + ls_pricing-kwert.
    WHEN 'K007'.  "Customer discount
      lv_customer_discount = lv_customer_discount + ls_pricing-kwert.
    WHEN 'MWST'.  "Tax
      lv_tax = lv_tax + ls_pricing-kwert.
  ENDCASE.
ENDLOOP.

* Step 7: Check for bulk discount (business rule: 5% if total qty > 1000)
DATA: lv_total_qty TYPE kwmeng.
LOOP AT lt_items INTO ls_item.
  lv_total_qty = lv_total_qty + ls_item-kwmeng.
ENDLOOP.

IF lv_total_qty > lc_bulk_qty.
  lv_bulk_discount = lv_subtotal * lc_bulk_discount.
  APPEND VALUE #( type = 'I' id = 'ZSD' number = '003'
                  message = 'Bulk discount applied (5%)' ) TO et_messages.
ENDIF.

* Step 8: Calculate final total
ev_total = lv_subtotal
         - lv_material_discount
         - lv_customer_discount
         - lv_bulk_discount
         + lv_tax.

ev_currency = 'USD'.

* Step 9: Credit limit check (CRITICAL BUSINESS RULE!)
IF ev_total > lv_credit_limit.
  APPEND VALUE #( type = 'E' id = 'ZSD' number = '004'
                  message = 'Credit limit exceeded' ) TO et_messages.
ENDIF.

* Step 10: Validate final total
IF ev_total < 0.
  ev_total = 0.
  APPEND VALUE #( type = 'W' id = 'ZSD' number = '005'
                  message = 'Negative total adjusted to zero' ) TO et_messages.
ENDIF.

ENDFUNCTION.
```

---

## 🤖 Platform Intelligence Analysis

### Step 1: ABAP Analyzer MCP Output

```json
{
  "name": "Z_CALCULATE_SALES_ORDER",
  "type": "FUNCTION",
  "module": "SD",
  "complexity": 7,
  "linesOfCode": 95,
  "businessLogic": [
    {
      "type": "calculation",
      "description": "Calculate order subtotal from line items",
      "critical": true
    },
    {
      "type": "discount",
      "description": "Apply material discount (K004)",
      "conditionType": "K004"
    },
    {
      "type": "discount",
      "description": "Apply customer discount (K007)",
      "conditionType": "K007"
    },
    {
      "type": "discount",
      "description": "Apply bulk discount (5% when qty > 1000)",
      "threshold": 1000,
      "rate": 0.05,
      "critical": true
    },
    {
      "type": "tax",
      "description": "Calculate tax (8%)",
      "rate": 0.08
    },
    {
      "type": "validation",
      "description": "Credit limit check",
      "critical": true
    },
    {
      "type": "validation",
      "description": "Negative total handling",
      "critical": false
    }
  ],
  "tables": [
    { "name": "VBAK", "operation": "SELECT", "description": "Sales Document Header" },
    { "name": "VBAP", "operation": "SELECT", "description": "Sales Document Items" },
    { "name": "KNA1", "operation": "SELECT", "description": "Customer Master" },
    { "name": "KONV", "operation": "SELECT", "description": "Pricing Conditions" }
  ],
  "dependencies": [],
  "sapPatterns": {
    "pricingProcedure": true,
    "creditManagement": true,
    "conditionTechnique": true
  }
}
```
