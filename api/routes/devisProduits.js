(function(){
    'use strict';
     module.exports = function(app,acl){

        var Ctrl = require('../controller/devisProduis.controller')(acl);

        app.route('/devis/produits')
        .get(Ctrl.getProduits)

        app.put('/devis/produits/:id([a-fA-F\\d]{24})',Ctrl.update)

        app.put('/devis/produits/unite/:id([a-fA-F\\d]{24})',Ctrl.updateUnites)

        app.post('/devis/produits/:id([a-fA-F\\d]{24})',Ctrl.create)

        app.route('/devis/produits/:id([a-fA-F\\d]{24})')
        .get(Ctrl.getDevis)
        .delete(Ctrl.delete)

        app.route('/devis/produits/devis/:id([a-fA-F\\d]{24})')
        .get(Ctrl.getAllDevisProduit)
     }
})();