(function(){
    'use strict';
    module.exports = function(app,acl){
        var Ctrl = require('../controller/fichiers.controller')(acl);
        var upload = require("../../middlewares/upload")


        app.post('/fichier',upload.array("uploadfile",5),Ctrl.create)

        app.post('/fichier/projet/:id([a-fA-F\\d]{24})',upload.array("uploadfile",5),Ctrl.createProject)

        app.put('/fichier/:id([a-fA-F\\d]{24})',upload.single("uploadfile"),Ctrl.update)

        app.route('/fichier/:id([a-fA-F\\d]{24})')
           .get(Ctrl.read)
           .delete(Ctrl.delete)

        app.route('/fichier/download/:id([a-fA-F\\d]{24})')
           .get(Ctrl.donwload)

        app.route('/fichier/move/:id([a-fA-F\\d]{24})/:parent([a-fA-F\\d]{24})')
           .get(Ctrl.moveFile)

        app.route('/open/fichier/:url')
            .get(Ctrl.openAllFile)

        app.route('/update/database')
           .get(Ctrl.updatePhotoPaths)
    }


})();