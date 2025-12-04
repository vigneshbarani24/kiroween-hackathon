namespace resurrection.db;

using { cuid, managed } from '@sap/cds/common';

sql
entity VBAK {
  key vbeln : String(10);  // Sales Document Number
  erdat : Date;            // Created On
  auart : String(4);       // Sales Document Type
  kunnr : String(10);      // Sold-to Party
  netwr : Decimal(15,2);   // Net Value
}

entity VBAP {
  key vbeln : String(10);  // Sales Document Number
  key posnr : String(6);   // Sales Document Item
  matnr : String(18);      // Material Number
  werks : String(4);       // Plant
  netwr : Decimal(15,2);   // Net Value
}

// Business logic preserved from ABAP:
// Filter orders of type 'OR'
// Differentiate orders based on net value
