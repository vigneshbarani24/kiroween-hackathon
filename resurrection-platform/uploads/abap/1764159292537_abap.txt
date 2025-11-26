*&---------------------------------------------------------------------*
*& Function Module Z_CALCULATE_ORDER_TOTAL
*& Created: 1998 (Legacy SAP R/3 Code)
*& Purpose: Calculate sales order total with pricing conditions
*&---------------------------------------------------------------------*
FUNCTION z_calculate_order_total.
*"----------------------------------------------------------------------
*"*"Local Interface:
*"  IMPORTING
*"     VALUE(IV_ORDER_ID) TYPE  VBELN
*"  EXPORTING
*"     VALUE(EV_TOTAL) TYPE  WRBTR
*"     VALUE(EV_CURRENCY) TYPE  WAERS
*"  TABLES
*"      IT_MESSAGES STRUCTURE  BAPIRET2
*"----------------------------------------------------------------------

  DATA: lt_items TYPE TABLE OF vbap,
        ls_item TYPE vbap,
        lt_conditions TYPE TABLE OF konv,
        ls_condition TYPE konv,
        lv_customer TYPE kunnr,
        ls_customer TYPE kna1,
        lv_subtotal TYPE wrbtr,
        lv_discount TYPE wrbtr,
        lv_tax TYPE wrbtr,
        lv_credit_limit TYPE wrbtr.

  CONSTANTS: lc_bulk_discount TYPE f VALUE '0.05',  "5% bulk discount
             lc_tax_rate TYPE f VALUE '0.08',       "8% tax
             lc_bulk_threshold TYPE i VALUE 1000.   "$1000 threshold

* Get customer from order header
  SELECT SINGLE kunnr FROM vbak
    INTO lv_customer
    WHERE vbeln = iv_order_id.

  IF sy-subrc <> 0.
    APPEND VALUE #( type = 'E' id = 'ZSD' number = '001'
                   message = 'Order not found' ) TO it_messages.
    RETURN.
  ENDIF.

* Check customer credit limit (critical business rule!)
  SELECT SINGLE * FROM kna1
    INTO ls_customer
    WHERE kunnr = lv_customer.

  IF sy-subrc = 0.
    lv_credit_limit = ls_customer-klimk.  "Credit limit
  ENDIF.

* Get order line items
  SELECT * FROM vbap
    INTO TABLE lt_items
    WHERE vbeln = iv_order_id.

  IF sy-subrc <> 0.
    APPEND VALUE #( type = 'E' id = 'ZSD' number = '002'
                   message = 'No items found' ) TO it_messages.
    RETURN.
  ENDIF.

* Calculate subtotal from line items
  LOOP AT lt_items INTO ls_item.
    lv_subtotal = lv_subtotal + ( ls_item-kwmeng * ls_item-netpr ).
  ENDLOOP.

* Apply pricing conditions (SAP pricing procedure logic)
  SELECT * FROM konv
    INTO TABLE lt_conditions
    WHERE knumv = iv_order_id.

  LOOP AT lt_conditions INTO ls_condition.
    CASE ls_condition-kschl.  "Condition type
      WHEN 'PR00'.  "Base price
        " Already included in netpr
      WHEN 'K004'.  "Material discount
        lv_discount = lv_discount + ls_condition-kwert.
      WHEN 'K007'.  "Customer discount
        lv_discount = lv_discount + ls_condition-kwert.
      WHEN 'MWST'.  "Tax
        lv_tax = lv_tax + ls_condition-kwert.
    ENDCASE.
  ENDLOOP.

* Apply bulk discount (business rule: 5% off if subtotal > $1000)
  IF lv_subtotal > lc_bulk_threshold.
    lv_discount = lv_discount + ( lv_subtotal * lc_bulk_discount ).
    APPEND VALUE #( type = 'I' id = 'ZSD' number = '003'
                   message = 'Bulk discount applied' ) TO it_messages.
  ENDIF.

* Calculate final total
  ev_total = lv_subtotal - lv_discount + lv_tax.
  ev_currency = 'USD'.

* Credit limit check (critical validation!)
  IF ev_total > lv_credit_limit.
    APPEND VALUE #( type = 'E' id = 'ZSD' number = '004'
                   message = 'Credit limit exceeded' ) TO it_messages.
  ENDIF.

* Final validation
  IF ev_total < 0.
    ev_total = 0.
    APPEND VALUE #( type = 'W' id = 'ZSD' number = '005'
                   message = 'Negative total adjusted to zero' ) TO it_messages.
  ENDIF.

ENDFUNCTION.
