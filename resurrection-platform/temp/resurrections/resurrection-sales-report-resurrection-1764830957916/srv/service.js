const cds = require('@sap/cds');

module.exports = cds.service.impl(async function() {
  const { VBAK, VBAP } = this.entities;

  // ABAP Logic: Filter sales orders of type 'OR'
  this.before('READ', VBAK, (req) => {
    console.log('Filtering sales orders of type OR');
    req.query.where('docType =', 'OR');
  });

  // ABAP Logic: Categorize sales orders based on net value
  this.after('READ', VBAK, async (salesOrders, req) => {
    console.log('Categorizing sales orders based on net value');
    const salesOrderIds = salesOrders.map(so => so.SalesOrderID);
    if (salesOrderIds.length > 0) {
      // Fetch related items to calculate total net value for each sales order
      const items = await SELECT.from(VBAP).where({ SalesOrderID: salesOrderIds });
      
      // Calculate net value for each sales order
      const netValues = items.reduce((acc, item) => {
        acc[item.SalesOrderID] = (acc[item.SalesOrderID] || 0) + (item.netValue || 0);
        return acc;
      }, {});

      // Categorize each sales order
      salesOrders.forEach(so => {
        const netValue = netValues[so.SalesOrderID];
        if (netValue < 10000) {
          so.category = 'Small';
        } else if (netValue >= 10000 && netValue < 50000) {
          so.category = 'Medium';
        } else {
          so.category = 'Large';
        }
      });
    }
  });
});