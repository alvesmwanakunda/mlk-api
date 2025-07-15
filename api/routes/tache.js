(function(){
    'use strict';
    module.exports = function(app,acl){
        var Ctrl = require('../controller/tache.controller')(acl);

        app.route('/taches/projet/:id([a-fA-F\\d]{24})')
           .get(Ctrl.getAllTacheByProjet)

        app.route('/taches/:id([a-fA-F\\d]{24})')
           .post(Ctrl.addTache)
           .put(Ctrl.updateTache)
           .delete(Ctrl.deleteTache)
           .get(Ctrl.getTache)
    }
})();