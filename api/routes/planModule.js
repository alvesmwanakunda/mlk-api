(function(){
    'use strict';
    module.exports = function(app,acl){
        var Ctrl = require('../controller/planModule.controller')(acl);
        var upload = require("../../middlewares/upload")


        app.post('/plan/module/:id([a-fA-F\\d]{24})',upload.array("uploadfile",5),Ctrl.create)


        app.put('/plan/module/:id([a-fA-F\\d]{24})',upload.single("uploadfile"),Ctrl.update)

        app.route('/plan/module/:id([a-fA-F\\d]{24})')
           .get(Ctrl.read)
           .delete(Ctrl.delete)

        app.route('/plans/module/:id([a-fA-F\\d]{24})')
           .get(Ctrl.readAll)

    }


})();