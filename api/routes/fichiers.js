(function(){
    'use strict';
    module.exports = function(app,acl){
        var Ctrl = require('../controller/fichiers.controller')(acl);
        var upload = require("../../middlewares/upload")
        const multer = require("multer");

        const projectTreeStorage = multer.diskStorage({
            destination:(req,file,cb)=>{
                cb(null,'./public/');
            },
            filename:(req,file,cb)=>{
                const extension = file.originalname.includes(".") ? `.${file.originalname.split(".").pop()}` : "";
                cb(null,`${Date.now()}-${Math.round(Math.random() * 1E9)}${extension}`);
            }
        });
        const uploadProjectTree = multer({
            storage: projectTreeStorage
        });


        app.post('/fichier',upload.array("uploadfile",5),Ctrl.create)

        // Méthode d'ajout,suppression,modification,download file projet

            app.post('/fichier/projet/:id([a-fA-F\\d]{24})',upload.array("uploadfile",5),Ctrl.createProject)
            app.post('/fichier/projet/tree/:id([a-fA-F\\d]{24})',uploadProjectTree.array("uploadfile",1000),Ctrl.createProjectTree)
            app.post('/fichier/projet/migrate-storage/:id([a-fA-F\\d]{24})',Ctrl.migrateProjectStoragePaths)
            app.put('/fichier/projet/:id([a-fA-F\\d]{24})',upload.single("uploadfile"),Ctrl.updateProjetFile)
            app.route('/fichier/projet/rename/:id([a-fA-F\\d]{24})')
            .put(Ctrl.renameProjetFile);
            app.route('/fichier/projet/:id([a-fA-F\\d]{24})')
            .delete(Ctrl.deleteProjetFile)
            app.route('/fichier/download/:id([a-fA-F\\d]{24})')
            .get(Ctrl.donwloadProjetFile)

        // Fin Méthode d'ajout,suppression,modification,download file projet

        app.put('/fichier/:id([a-fA-F\\d]{24})',upload.single("uploadfile"),Ctrl.update)
        
        app.route('/fichier/rename/:id([a-fA-F\\d]{24})')
           .put(Ctrl.renameFile);

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
