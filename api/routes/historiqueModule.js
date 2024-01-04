(function(){
   "use strict";
   module.exports = function(app,acl){
    var Ctrl = require('../controller/historiqueModule.controller')(acl);

    app.post('/historique/save/:id([a-fA-F\\d]{24})',Ctrl.create)

    app.put('/historique/update/:id([a-fA-F\\d]{24})',Ctrl.update)

    app.get('/historique/list/:id([a-fA-F\\d]{24})',Ctrl.getAllHistorique)

    app.get('/historique/get/:id([a-fA-F\\d]{24})',Ctrl.getHistorique)

    app.delete('/historique/:id([a-fA-F\\d]{24})',Ctrl.delete)

   }
})();