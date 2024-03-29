(function(){
    'use strict';
    module.exports = function(app,acl){
        var Ctrl = require('../controller/modules.controller')(acl);
        var upload = require("../../middlewares/upload")

        app.post('/module',upload.fields([{name:'imageFile'},{name:'planFile'}]),Ctrl.create)

        app.put('/module/:id([a-fA-F\\d]{24})',upload.fields([{name:'imageFile'},{name:'planFile'}]),Ctrl.update)

        app.route('/module/:id([a-fA-F\\d]{24})')
           .get(Ctrl.getModule)
           .delete(Ctrl.delete)

        app.route('/module/qrcode/:id([a-fA-F\\d]{24})')
           .get(Ctrl.getQrcodeModule)

        app.route('/modules')
           .get(Ctrl.getAllModule)

        app.route('/modules/entreprise/:id([a-fA-F\\d]{24})')
           .get(Ctrl.getAllModuleByEntreprise)

       app.route('/count/modules')
           .get(Ctrl.getAccountModule)

       app.route('/count/modules/:id([a-fA-F\\d]{24})')
           .get(Ctrl.getAccountModuleEntreprise)

       app.put('/module/image/:id([a-fA-F\\d]{24})',upload.single("uploadfile"),Ctrl.updateImage)

       app.put('/module/plan/:id([a-fA-F\\d]{24})',upload.single("uploadfile"),Ctrl.updatePlan)


        
        
        
    }


})();