(function(){

    'use strict';
    module.exports = function(app,acl){
        var Ctrl = require('../controller/chatProjets.controller')(acl);

        app.route('/messages/projet/send/:id([a-fA-F\\d]{24})')
           .post(Ctrl.create)

        app.route('/messages/projet/:id([a-fA-F\\d]{24})')
           .get(Ctrl.getAllMessageByProjet)

        app.route('/messages/projet/pending/client/:id([a-fA-F\\d]{24})')
           .get(Ctrl.getMessageLireClient)

        app.route('/messages/projet/pending/admin/:id([a-fA-F\\d]{24})')
           .get(Ctrl.getMessageLireAdmin)

        app.route('/messages/projet/update/client/:id([a-fA-F\\d]{24})')
           .get(Ctrl.updateClientMessage)

        app.route('/messages/projet/update/admin/:id([a-fA-F\\d]{24})')
           .get(Ctrl.updateAdminMessage)
    }
})();