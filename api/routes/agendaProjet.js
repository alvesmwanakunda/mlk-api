(function(){

    'use strict';
    module.exports = function(app,acl){
        var Ctrl = require('../controller/agendaProjet.controller')(acl);

    
        app.route('/projet/agenda/by/:id([a-fA-F\\d]{24})')
           .get(Ctrl.getAllAgendaByProjet)

        app.route('/projet/agenda/:id([a-fA-F\\d]{24})')
           .post(Ctrl.addAgenda)
           .get(Ctrl.getAgenda)
           .delete(Ctrl.deleteAgenda)
           .put(Ctrl.updateAgenda)
    }
})();