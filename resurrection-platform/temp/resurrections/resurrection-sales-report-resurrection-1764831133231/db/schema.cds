namespace resurrection.db;

using { cuid, managed } from '@sap/cds/common';

entity VBAK {
  key vbeln : String(10);  // Sales Document Number
  auart : String(4);       // Sales Document Type
  erdat : Date;            // Created On
  kunnr : String(10);      // Sold-to Party
  netwr : Decimal(15,2);   // Net Value
}

entity VBAP {
  key vbeln : String(10);  // Sales Document Number
  key posnr : String(6);   // Sales Document Item
  matnr : String(18);      // Material Number
  arktx : String(40);      // Short Text
  netwr : Decimal(15,2);   // Net Value
}

// Business logic preserved from ABAP:
// Filter orders of type 'OR'
// Distinguish orders based on net value
