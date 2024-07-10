(function(){

    'use strict';
    module.exports = function(app,acl){
        var Ctrl = require('../controller/conge.controller')(acl);
        var upload = require("../../middlewares/upload");



        app.post('/conge',upload.single("uploadfile"),Ctrl.addConge)
        
        app.put('/conge/:id([a-fA-F\\d]{24})',upload.single("uploadfile"),Ctrl.updateConge)

        app.route('/conge')
           .get(Ctrl.getAllConge)
           //.post(Ctrl.addConge)

        app.route('/conge/user')
           .get(Ctrl.getAllCongeUser)

        app.route('/conge/:id([a-fA-F\\d]{24})')
           .get(Ctrl.getConge)
           .delete(Ctrl.deleteConge)
           //.put(Ctrl.updateConge)

         app.route('/conge/valider/:id([a-fA-F\\d]{24})')
           .get(Ctrl.valideConge)

         app.route('/conge/refuser/:id([a-fA-F\\d]{24})')
           .get(Ctrl.refuseConge)

         app.route('/conge/status/:id([a-fA-F\\d]{24})')
           .put(Ctrl.updateStatus)
    }
})();