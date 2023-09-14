(function(){
    'use strict';
    module.exports = function(app,acl){
        var Ctrl = require('../controller/fichiers.controller')(acl);
        var upload = require("../../middlewares/upload")


        app.post('/fichier',upload.single("uploadfile"),Ctrl.create)

        app.post('/fichier/projet/:id([a-fA-F\\d]{24})',upload.single("uploadfile"),Ctrl.createProject)

        app.put('/fichier/:id([a-fA-F\\d]{24})',upload.single("uploadfile"),Ctrl.update)

        app.route('/fichier/:id([a-fA-F\\d]{24})')
           .get(Ctrl.read)
           .delete(Ctrl.delete)

        app.route('/fichier/download/:id([a-fA-F\\d]{24})')
           .get(Ctrl.donwload)
    }


})();