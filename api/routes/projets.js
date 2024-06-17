(function (){
    'use strict';
    module.exports = function(app,acl){
        var Ctrl = require('../controller/projets.controller')(acl);
        var upload = require("../../middlewares/upload")

    
        app.route('/projet')
           .get(Ctrl.getAllProjet)

        app.route('/projet/:id([a-fA-F\\d]{24})')
           .get(Ctrl.getProjet)
           .delete(Ctrl.deleteProjet)

        app.route('/projet/delete/photo/:id([a-fA-F\\d]{24})')
           .get(Ctrl.deletePhoto)

         app.route('/projet/entreprise/:id([a-fA-F\\d]{24})')
           .get(Ctrl.getProjetByEntreprise)

        app.post('/projet',upload.single("uploadfile"),Ctrl.addProjet)
        
        app.put('/projet/:id([a-fA-F\\d]{24})',upload.single("uploadfile"),Ctrl.updateProjet)

        app.post('/projet/entreprise/:id([a-fA-F\\d]{24})',upload.single("uploadfile"),Ctrl.addProjetEntreprise)
        
        app.put('/projet/entreprise/:id([a-fA-F\\d]{24})',upload.single("uploadfile"),Ctrl.updateProjetEntreprise)

         app.put('/projet/file/:id([a-fA-F\\d]{24})',upload.single("uploadfile"),Ctrl.updateProjetFile)
    }

})();