(function(){
    'use strict';
    module.exports = function(app,acl){
        var Ctrl = require('../controller/facture.controller')(acl);
        var upload = require("../../middlewares/upload")

        app.post('/facture',upload.single('uploadfile'),Ctrl.create)

        app.put('/facture/:id([a-fA-F\\d]{24})',upload.single('uploadfile'),Ctrl.update)

        app.route('/facture/:id([a-fA-F\\d]{24})')
           .get(Ctrl.getFacture)
           .delete(Ctrl.delete)

        app.route('/factures')
           .get(Ctrl.getAllFactures)

        app.route('/facture/projet/:id([a-fA-F\\d]{24})')
           .get(Ctrl.getAllFacturesByProjet)
    }


})();