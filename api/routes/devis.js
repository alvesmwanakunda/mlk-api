(function(){
    'use strict';
    module.exports = function(app,acl){
        var Ctrl = require('../controller/devis.controller')(acl);
        var upload = require("../../middlewares/upload")

        app.post('/devis',Ctrl.create)

        app.put('/devis/:id([a-fA-F\\d]{24})',Ctrl.update)

        app.route('/devis/:id([a-fA-F\\d]{24})')
           .get(Ctrl.getDevis)
           .delete(Ctrl.delete)

     app.route('/devis')
           .get(Ctrl.getAllDevis)

      app.route('/devis/facture/:id([a-fA-F\\d]{24})')
           .put(Ctrl.updateFacture)

      app.route('/devis/signature/:id([a-fA-F\\d]{24})')
           .put(Ctrl.updateSignature)

      app.route('/devis/entreprise/:id([a-fA-F\\d]{24})')
           .get(Ctrl.getAllDevisEntreprise)

      app.route('/devis/projet/:id([a-fA-F\\d]{24})')
           .get(Ctrl.getAllDevisByProjet)

     // Facture

     app.route('/facture')
        .get(Ctrl.getAllFactureDevis)

     app.route('/facture/entreprise/:id([a-fA-F\\d]{24})')
        .get(Ctrl.getAllDevisFactureEntreprise)

     app.route('/facture/projet/:id([a-fA-F\\d]{24})')
        .get(Ctrl.getAllDevisFactureByProjet)

    }


})();