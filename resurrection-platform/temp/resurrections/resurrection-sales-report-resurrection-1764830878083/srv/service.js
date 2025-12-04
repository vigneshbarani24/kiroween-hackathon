const cds = require('@sap/cds');

module.exports = cds.service.impl(async function() {
    const {VBAK, VBAP} = this.entities;

    // Handling ABAP Filter logic: Filter sales orders of type 'OR'
    this.before('READ', VBAK, (req) => {
        console.log('Filtering VBAK for sales order type OR');
        req.query.where('VBTYP', '=', 'OR');
    });

    // Implement categorization based on net value
    this.after('READ', VBAK, async (vbaks, req) => {
        console.log('Categorizing orders based on net value');
        const orders = Array.isArray(vbaks) ? vbaks : [vbaks];
        for (const order of orders) {
            const items = await cds.tx(req).run(SELECT.from(VBAP).where({VBELN: order.VBELN}));
            let netValue = items.reduce((acc, curr) => acc + curr.NETWR, 0);
            order.netValueCategory = categorizeNetValue(netValue);
        }
    });

    // Helper function for categorization based on net value
    function categorizeNetValue(netValue) {
        if (netValue < 10000) return 'Small';
        if (netValue >= 10000 && netValue < 50000) return 'Medium';
        return 'Large';
    }
});