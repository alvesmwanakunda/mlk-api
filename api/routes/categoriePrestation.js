(function(){
    'use strict';
    module.exports = function(app,acl){
        var Ctrl = require('../controller/categoriePrestation.controller')(acl);

        app.route('/categorie/prestation')
           .post(Ctrl.create)
           .get(Ctrl.getAll)

        app.route('/categorie/prestation/:id([a-fA-F\\d]{24})')
           .put(Ctrl.update)
           .get(Ctrl.getCategorie)
           .delete(Ctrl.delete)
    }
})();