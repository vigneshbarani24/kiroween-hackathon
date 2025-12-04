# Mock Data

This directory contains realistic mock data generated from the original ABAP code analysis.

## Data Files

- **VBAK.csv** - Sales Document Header (Orders)
- **VBAP.csv** - Sales Document Items (Order Line Items)

## Business Logic

The mock data reflects the business logic from the original ABAP:

- Filter orders of type 'OR'
- Distinguish orders based on net value

## Usage

To load the data:

```bash
cds deploy --to sqlite
```

Or for testing:

```bash
cds watch
```

The data will be automatically loaded into the in-memory database.

## Data Relationships

- **VBAK** (Sales Orders) → **VBAP** (Order Items) via `vbeln`
- **VBAK** (Sales Orders) → **KNA1** (Customers) via `kunnr`
- **VBAP** (Order Items) → **KONV** (Pricing) via `vbeln` + `posnr`

## Sample Queries

```sql
-- Get order with items
SELECT * FROM VBAK 
JOIN VBAP ON VBAK.vbeln = VBAP.vbeln 
WHERE VBAK.vbeln = '0000000001';

-- Get customer orders
SELECT * FROM VBAK 
WHERE kunnr = '0000100001';

-- Calculate order total with pricing
SELECT 
  v.vbeln,
  SUM(vp.netwr) as subtotal,
  SUM(k.kwert) as discount,
  SUM(vp.netwr) - SUM(k.kwert) as total
FROM VBAK v
JOIN VBAP vp ON v.vbeln = vp.vbeln
LEFT JOIN KONV k ON v.vbeln = k.knumv
GROUP BY v.vbeln;
```
