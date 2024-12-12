(function(){

    'use strict';
    module.exports = function(app,acl){
        var Ctrl = require('../controller/agenda.controller')(acl);

    
        app.route('/agenda')
           .get(Ctrl.getAllAgenda)
           .post(Ctrl.addAgenda)

        app.route('/agenda/:id([a-fA-F\\d]{24})')
           .get(Ctrl.getAgenda)
           .delete(Ctrl.deleteAgenda)
           .put(Ctrl.updateAgenda)

        app.route('/agenda/web/:id([a-fA-F\\d]{24})')
           .get(Ctrl.getAgendaWeb)
    }
})();