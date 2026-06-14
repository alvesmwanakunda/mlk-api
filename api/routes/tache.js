(function(){
    'use strict';
    module.exports = function(app,acl){
        var Ctrl = require('../controller/tache.controller')(acl);
        var upload = require("../../middlewares/upload")
        var multer = require("multer");
        var path = require("path");

        var voiceStorage = multer.diskStorage({
            destination: function(req, file, cb) {
                cb(null, './public/');
            },
            filename: function(req, file, cb) {
                var extension = path.extname(file.originalname || '').toLowerCase() || '.webm';
                cb(null, 'task-audio-' + Date.now() + '-' + Math.round(Math.random() * 1E9) + extension);
            }
        });

        var voiceUpload = multer({
            storage: voiceStorage,
            limits: { fileSize: 25 * 1024 * 1024 },
            fileFilter: function(req, file, cb) {
                if (
                    !file.mimetype ||
                    file.mimetype.startsWith('audio/') ||
                    file.mimetype === 'video/webm'
                ) {
                    return cb(null, true);
                }

                return cb(new Error("Le fichier doit être un audio"));
            }
        });


        app.route('/taches/projet/:id([a-fA-F\\d]{24})')
           .get(Ctrl.getAllTacheByProjet)

       app.post('/taches/:id([a-fA-F\\d]{24})', upload.array("image",5), Ctrl.addTache);
       app.post('/taches/voice/:id([a-fA-F\\d]{24})', voiceUpload.single("audio"), Ctrl.createTacheFromVoice);
       app.put('/taches/:id([a-fA-F\\d]{24})', upload.fields([{ name: 'image', maxCount: 20 }]), Ctrl.updateTache);
       app.put('/taches/:id([a-fA-F\\d]{24})/images', upload.fields([{ name: 'image', maxCount: 20 }]), Ctrl.updateTacheImages);
       app.delete('/taches/:id([a-fA-F\\d]{24})/images', Ctrl.deleteTacheImages);


        app.route('/taches/:id([a-fA-F\\d]{24})')
           //.post(Ctrl.addTache)
           //.put(Ctrl.updateTache)
           .delete(Ctrl.deleteTache)
           .get(Ctrl.getTache)

         // Historique

         app.get('/historiques/tache/:id([a-fA-F\\d]{24})', Ctrl.getAllHistoriqueByTask)

        // Time Sheet

         app.route('/time/tache/:id([a-fA-F\\d]{24})').get(Ctrl.getAllTimeByTask)

          
         app.post('/time/taches/:id([a-fA-F\\d]{24})',upload.fields([{ name: 'image', maxCount: 5 }]), Ctrl.addTime);
         app.put('/time/taches/:id([a-fA-F\\d]{24})',upload.fields([{ name: 'image', maxCount: 5 }]), Ctrl.updateTime);


         app.route('/time/taches/:id([a-fA-F\\d]{24})')
           //.post(Ctrl.addTime)
           //.put(Ctrl.updateTime)
           .delete(Ctrl.deleteTime)
           .get(Ctrl.getTime)



      // Sub Task

        app.route('/sous/tache/:id([a-fA-F\\d]{24})')
           .get(Ctrl.getAllSubTaskByTask)

        app.route('/sous/taches/:id([a-fA-F\\d]{24})')
           .post(Ctrl.addSubTask)
           .put(Ctrl.updateSubTask)
           .delete(Ctrl.deleteSubTask)
           .get(Ctrl.getSubTask)

      // Update Markers
       app.route('/marker/tache/:id([a-fA-F\\d]{24})')
         .put(Ctrl.updateTaskMarkerPosition)
         .delete(Ctrl.deleteTaskMarker)
          
        
        
    }
})();
