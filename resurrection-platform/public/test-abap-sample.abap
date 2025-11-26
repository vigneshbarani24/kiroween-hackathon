*&---------------------------------------------------------------------*
*& Report  Z_TEST_SALES_ORDER
*&---------------------------------------------------------------------*
*& Simple test ABAP program for resurrection platform testing
*&---------------------------------------------------------------------*
REPORT z_test_sales_order.

* Data declarations
DATA: lv_vbeln TYPE vbak-vbeln,
      lv_kunnr TYPE kna1-kunnr,
      lv_netwr TYPE vbak-netwr,
      lt_vbap  TYPE TABLE OF vbap,
      ls_vbap  TYPE vbap.

* Constants
CONSTANTS: lc_vkorg TYPE vbak-vkorg VALUE '1000',
           lc_vtweg TYPE vbak-vtweg VALUE '10',
           lc_spart TYPE vbak-spart VALUE '00'.

START-OF-SELECTION.

  * Get sales order number
  lv_vbeln = '0000012345'.

  * Read sales order header
  SELECT SINGLE vbeln kunnr netwr
    FROM vbak
    INTO (lv_vbeln, lv_kunnr, lv_netwr)
    WHERE vbeln = lv_vbeln
      AND vkorg = lc_vkorg
      AND vtweg = lc_vtweg
      AND spart = lc_spart.

  IF sy-subrc = 0.
    WRITE: / 'Sales Order:', lv_vbeln.
    WRITE: / 'Customer:', lv_kunnr.
    WRITE: / 'Net Value:', lv_netwr.

    * Read sales order items
    SELECT *
      FROM vbap
      INTO TABLE lt_vbap
      WHERE vbeln = lv_vbeln.

    LOOP AT lt_vbap INTO ls_vbap.
      WRITE: / 'Item:', ls_vbap-posnr,
             'Material:', ls_vbap-matnr,
             'Quantity:', ls_vbap-kwmeng.
    ENDLOOP.

    * Calculate pricing
    PERFORM calculate_pricing USING lv_vbeln
                               CHANGING lv_netwr.

    WRITE: / 'Final Net Value:', lv_netwr.
  ELSE.
    WRITE: / 'Sales order not found:', lv_vbeln.
  ENDIF.

*&---------------------------------------------------------------------*
*&      Form  CALCULATE_PRICING
*&---------------------------------------------------------------------*
FORM calculate_pricing USING    p_vbeln TYPE vbeln_va
                       CHANGING p_netwr TYPE netwr_ak.

  DATA: lv_discount TYPE p DECIMALS 2,
        lv_tax      TYPE p DECIMALS 2.

  * Apply 10% discount
  lv_discount = p_netwr * '0.10'.
  p_netwr = p_netwr - lv_discount.

  * Add 19% tax
  lv_tax = p_netwr * '0.19'.
  p_netwr = p_netwr + lv_tax.

  WRITE: / 'Discount applied:', lv_discount.
  WRITE: / 'Tax added:', lv_tax.

ENDFORM.
