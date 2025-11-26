namespace resurrection.sales;

/**
 * Sales Order Header
 * Resurrected from: VBAK (Sales Document Header)
 */
entity SalesOrders {
  key ID          : String(10);  // VBELN
  customer        : Association to Customers;
  orderDate       : Date;
  totalAmount     : Decimal(15, 2);
  currency        : String(3) default 'USD';
  status          : String(1);
  items           : Composition of many SalesOrderItems on items.order = $self;
  pricingConditions : Composition of many PricingConditions on pricingConditions.order = $self;
}

/**
 * Sales Order Line Items
 * Resurrected from: VBAP (Sales Document Items)
 */
entity SalesOrderItems {
  key ID          : UUID;
  order           : Association to SalesOrders;
  itemNumber      : Integer;      // POSNR
  material        : String(40);   // MATNR
  quantity        : Decimal(13, 3); // KWMENG
  unitPrice       : Decimal(15, 2); // NETPR
  lineTotal       : Decimal(15, 2);
  unit            : String(3);
}

/**
 * Customer Master Data
 * Resurrected from: KNA1 (Customer Master)
 */
entity Customers {
  key ID          : String(10);  // KUNNR
  name            : String(80);
  creditLimit     : Decimal(15, 2); // KLIMK
  currentBalance  : Decimal(15, 2);
  country         : String(3);
  city            : String(40);
  orders          : Association to many SalesOrders on orders.customer = $self;
}

/**
 * Pricing Conditions
 * Resurrected from: KONV (Conditions)
 */
entity PricingConditions {
  key ID          : UUID;
  order           : Association to SalesOrders;
  conditionType   : String(4);    // KSCHL (PR00, K004, K007, MWST)
  conditionValue  : Decimal(15, 2); // KWERT
  description     : String(40);
}

/**
 * Pricing Configuration
 * Business rules for pricing calculations
 */
entity PricingRules {
  key ID          : UUID;
  ruleType        : String(20);   // BULK_DISCOUNT, TAX_RATE, etc.
  threshold       : Decimal(15, 2);
  percentage      : Decimal(5, 4);
  active          : Boolean default true;
}
