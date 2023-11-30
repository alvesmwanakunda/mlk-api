(function(){
    'use strict';
    module.exports = function(app,acl){
        var Ctrl = require('../controller/dossiers.controller')(acl);

        app.route('/dossier')
           .get(Ctrl.list)
           .post(Ctrl.create)

        app.route('/dossier/projet/:id([a-fA-F\\d]{24})')
           .get(Ctrl.listProjet)
           .post(Ctrl.createProjet)

        app.route('/dossier/:id([a-fA-F\\d]{24})')
           .get(Ctrl.read)
           .delete(Ctrl.delete)
           .put(Ctrl.update)

      app.route('/dossier/read/:id([a-fA-F\\d]{24})')
           .get(Ctrl.readOnly)

      app.route('/dossier/move/:id([a-fA-F\\d]{24})/:parent([a-fA-F\\d]{24})')
           .get(Ctrl.moveFolder)
    }
})();