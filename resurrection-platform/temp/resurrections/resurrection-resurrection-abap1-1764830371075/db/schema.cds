namespace resurrection.db;

using { cuid, managed } from '@sap/cds/common';

entity EKKO {
  key EBELN : String(10);  // Purchasing Document Number
  AEDAT : Date;            // Document Date in Document
  BSTYP : String(1);       // Document Category
  BSART : String(4);       // Document Type
  LIFNR : String(10);      // Vendor Account Number
  EKORG : String(4);       // Purchasing Organization
  EKGRP : String(3);       // Purchasing Group
  WAERS : String(5);       // Currency Key
  STATU : String(1);       // PO Status
}

entity EKPO {
  key EBELN : String(10);  // Purchasing Document Number
  key EBELP : String(5);   // Item Number of Purchasing Document
  MATNR : String(18);      // Material Number
  WERKS : String(4);       // Plant
  MENGE : Decimal(13,3);   // Purchase Order Quantity
  MEINS : String(3);       // Order Unit
  NETPR : Decimal(11,2);   // Net Price
  ELIKZ : String(1);       // Delivery Completed Indicator
  LOEKZ : String(1);       // Deletion Indicator
  WEPOS : String(1);       // Goods Receipt Indicator
  WEMNG : Decimal(13,3);   // Quantity Already Delivered
}

// Business logic preserved from ABAP:
// Generates a report of open purchase orders by subtracting the goods received quantity from the purchase order quantity
// Filters purchase orders based on selection screen inputs and checks for not deleted, not finally delivered, and not fully delivered items
