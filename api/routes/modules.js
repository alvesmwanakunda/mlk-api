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

        app.route('/module/qrcode/infos/:id([a-fA-F\\d]{24})')
           .get(Ctrl.getModuleQrCode)

        app.route('/modules')
           .get(Ctrl.getAllModule)

        app.route('/modules/stock')
           .get(Ctrl.getAllModuleStock)

        app.route('/modules/preparation')
           .get(Ctrl.getAllModulePr)

        app.route('/modules/partir')
           .get(Ctrl.getAllModulePp)

        app.route('/modules/site')
           .get(Ctrl.getAllModuleSite)

        app.route('/modules/entreprise/:id([a-fA-F\\d]{24})')
           .get(Ctrl.getAllModuleByEntreprise)

        app.route('/modules/entreprise/:id([a-fA-F\\d]{24})/stock')
           .get(Ctrl.getAllModuleByEntrepriseStock)

        app.route('/modules/entreprise/:id([a-fA-F\\d]{24})/preparation')
           .get(Ctrl.getAllModuleByEntreprisePp)

        app.route('/modules/entreprise/:id([a-fA-F\\d]{24})/partir')
           .get(Ctrl.getAllModuleByEntreprisePr)

        app.route('/modules/entreprise/:id([a-fA-F\\d]{24})/site')
           .get(Ctrl.getAllModuleByEntrepriseSite)

       app.route('/count/modules')
           .get(Ctrl.getAccountModule)

       app.route('/count/modules/:id([a-fA-F\\d]{24})')
           .get(Ctrl.getAccountModuleEntreprise)

       app.route('/projet/module/list/:id([a-fA-F\\d]{24})')
           .get(Ctrl.getAllModuleByProjet)

       app.put('/module/image/:id([a-fA-F\\d]{24})',upload.single("uploadfile"),Ctrl.updateImage)

       app.put('/module/plan/:id([a-fA-F\\d]{24})',upload.single("uploadfile"),Ctrl.updatePlan)

       // Affecter module a un projet

       app.route('/projet/module/:id([a-fA-F\\d]{24})')
           //.post(Ctrl.affectModule)
           .get(Ctrl.getAllModuleProjet)
           .delete(Ctrl.deleteModuleProjet)
           .put(Ctrl.updatePositionModule)
       
       app.post('/projet/module/:id([a-fA-F\\d]{24})',upload.single("uploadfile"),Ctrl.affectModule)
       app.put('/projet/module/plan/:id([a-fA-F\\d]{24})',upload.single("uploadfile"),Ctrl.updateProjetModule)
       
       app.route('/projet/module/plan/:id([a-fA-F\\d]{24})')
          .get(Ctrl.getProjetModule)

       // Fiche technique et description module

       app.route('/module/fiche/:id([a-fA-F\\d]{24})')
          .post(Ctrl.createFiche)
          .put(Ctrl.updateFiche)
          .delete(Ctrl.deleteFicheModule)
          .get(Ctrl.getFicheByModule)

      // Projet affectation direct

      app.post('/affecte/module/:id([a-fA-F\\d]{24})',upload.fields([{name:'imageFile'},{name:'planFile'}]),Ctrl.createModuleAffecteProjet)

      app.route('/modules/notsite/')
          .get(Ctrl.getAllModuleNotSite)

      app.route('/modules/notsite/:id([a-fA-F\\d]{24})/:projet([a-fA-F\\d]{24})')
          .get(Ctrl.addModuleProjet)





       




        
        
        
    }


})();