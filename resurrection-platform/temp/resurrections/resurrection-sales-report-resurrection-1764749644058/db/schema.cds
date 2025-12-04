namespace resurrection.db;

using { cuid, managed } from '@sap/cds/common';

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
  arktx : String(40);      // Short Text
  netwr : Decimal(15,2);   // Net Value
  werks : String(4);       // Plant
}

// Business logic preserved from ABAP:
// Select sales orders of type 'OR'
// Distinguish between high value and standard orders based on net value
