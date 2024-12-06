(function(){
    'use strict';
    module.exports = function(app,acl){
        var Ctrl = require('../controller/prestation.controller')(acl);

        app.route('/prestation/:id([a-fA-F\\d]{24})')
           .post(Ctrl.create)
           .put(Ctrl.update)
           .get(Ctrl.getPrestation)
           .delete(Ctrl.delete)

        app.route('/prestation/all/:id([a-fA-F\\d]{24})')
           .get(Ctrl.getAllByCategorie)

        app.route('/prestations')
           .get(Ctrl.getAll)
    }
})();