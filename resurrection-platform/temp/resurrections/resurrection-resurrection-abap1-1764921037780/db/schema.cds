namespace resurrection.db;

using { cuid, managed } from '@sap/cds/common';

plaintext
entity EKKO {
  key ebeln : String(10);  // Purchase Document Number
  bukrs : String(4);       // Company Code
  bsart : String(4);       // Document Type
  lifnr : String(10);      // Vendor's Account Number
  aedat : Date;            // Document Date in Document
}

entity EKPO {
  key ebeln : String(10);  // Purchase Document Number
  key ebelp : String(5);   // Purchase Order Item Number
  werks : String(4);       // Plant
  matnr : String(18);      // Material Number
  menge : Decimal(13,3);   // Purchase Order Quantity
  meins : String(3);       // Order Unit
  netpr : Decimal(11,2);   // Net Price
  elikz : String(1);       // "Delivery Completed" Indicator
  erekz : String(1);       // Final Invoice Indicator
  wemng : Decimal(13,3);   // Quantity Received
}

// Business logic preserved from ABAP:
// Calculate open quantities for purchase orders
// Display a report of open purchase orders with various details such as PO Number, Vendor, Plant, Material, PO Qty, GR Qty, Open Qty, and Net Price
