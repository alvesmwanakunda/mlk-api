(function(){
    'use strict';
    module.exports = function(app,acl){
        var Ctrl = require('../controller/facture.controller')(acl);
        var upload = require("../../middlewares/upload")

        app.route('/new/facture/:id([a-fA-F\\d]{24})')
        .get(Ctrl.create)

        /*app.post('/factures',upload.single('uploadfile'),Ctrl.create)


        app.route('/factures/:id([a-fA-F\\d]{24})')
           .get(Ctrl.getFacture)
           .delete(Ctrl.delete)

        app.route('/factures')
           .get(Ctrl.getAllFactures)

        app.route('/factures/projet/:id([a-fA-F\\d]{24})')
           .get(Ctrl.getAllFacturesByProjet)*/
    }


})();