(function (){
    'use strict';
    module.exports = function(app,acl){
        var Ctrl = require('../controller/entreprises.controller')(acl);
        var upload = require("../../middlewares/upload")

    
        app.route('/entreprise')
           .get(Ctrl.getAllEntreprise)

        app.route('/entreprise/:id([a-fA-F\\d]{24})')
           .get(Ctrl.getEntreprise)
           .delete(Ctrl.deleteEntreprise)

         app.route('/check-societe/:societe')
           .get(Ctrl.entrepriseExist);

         app.route('/api-search/:societe')
           .get(Ctrl.searchEntreprese);

        /* app.route('/api-search-id/:id')
           .get(Ctrl.searchEntrepreseId);*/
         
        app.route('/add/entreprise')
           .post(Ctrl.newAddEntreprise)

       app.route('/add/entreprise/fournisseur')
           .post(Ctrl.addFournisseurEntreprise)

        app.post('/entreprise',upload.single("uploadfile"),Ctrl.addEntreprise)

        app.put('/entreprise/file/:id([a-fA-F\\d]{24})',upload.single("uploadfile"),Ctrl.updateEntrepriseFile)

        app.put('/entreprise/:id([a-fA-F\\d]{24})',upload.single("uploadfile"),Ctrl.updateEntreprise)
    }

})();