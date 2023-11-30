(function(){

    'use strict';
    module.exports = function(app,acl){
        var Ctrl = require('../controller/chat.controller')(acl);

    
        app.route('/messages/send')
           .post(Ctrl.create)

        app.route('/messages/received/:id([a-fA-F\\d]{24})')
           .post(Ctrl.response) 
        
        app.route('/messages/client')
           .get(Ctrl.getAllMessageByClient)

        app.route('/messages/client/:id([a-fA-F\\d]{24})')
           .get(Ctrl.allMessageAdminByClient)

        app.route('/messages/client/admin')
           .get(Ctrl.getAllMessageSender)

        app.route('/messages/pending/client')
           .get(Ctrl.getNumberMessageNonLus)

        app.route('/messages/pending/admin')
           .get(Ctrl.getNumberMessageNonLusAdmin)

        app.route('/messages/update')
           .get(Ctrl.updateClientMessage)

        app.route('/messages/update/admin/:id([a-fA-F\\d]{24})')
           .get(Ctrl.updateAdminMessage)
    }

})();