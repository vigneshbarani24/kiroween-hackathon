const cds = require('@sap/cds');

module.exports = cds.service.impl(async function() {
  const { EKKO, EKPO } = this.entities;

  // ABAP Logic: Calculate open quantities for purchase orders
  this.after('READ', EKPO, (each) => {
    // Assuming GR Qty is stored and we calculate Open Qty as PO Qty - GR Qty
    if (each.POQty && each.GRQty) {
      each.OpenQty = each.POQty - each.GRQty;
    }
  });

  // Display a report of open purchase orders with various details
  this.on('READ', 'OpenPOReport', async (req) => {
    console.log('Generating report for open purchase orders');

    // Combine EKKO and EKPO based on PO Number to fetch required details
    const report = await cds.run(SELECT.from(EKPO)
      .columns('PONumber', 'Vendor', 'Plant', 'Material', 'POQty', 'GRQty', 'NetPrice')
      .where({ OpenQty: { '!=': 0 } }) // Filter for open quantities not equal to 0
      .innerJoin(EKKO).on(EKKO.PONumber.eq(EKPO.PONumber))
    );

    // Calculate Open Qty for each entry in the report
    report.forEach(entry => {
      entry.OpenQty = entry.POQty - entry.GRQty;
    });

    return report;
  });

});