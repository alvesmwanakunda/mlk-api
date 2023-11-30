(function(){
    'use strict';
    module.exports = function(app,acl){
        var Ctrl = require('../controller/devis.controller')(acl);
        var upload = require("../../middlewares/upload")

        app.post('/devis',upload.single('uploadfile'),Ctrl.create)

        app.put('/devis/:id([a-fA-F\\d]{24})',upload.single('uploadfile'),Ctrl.update)

        app.route('/devis/:id([a-fA-F\\d]{24})')
           .get(Ctrl.getDevis)
           .delete(Ctrl.delete)

        app.route('/devis')
           .get(Ctrl.getAllDevis)

        app.route('/devis/projet/:id([a-fA-F\\d]{24})')
           .get(Ctrl.getAllDevisByProjet)
    }


})();