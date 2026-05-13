(function(){
    'use strict';
    module.exports = function(app,acl){
        var Ctrl = require('../controller/tache.controller')(acl);
        var upload = require("../../middlewares/upload")


        app.route('/taches/projet/:id([a-fA-F\\d]{24})')
           .get(Ctrl.getAllTacheByProjet)

       app.post('/taches/:id([a-fA-F\\d]{24})', upload.array("image",5), Ctrl.addTache);
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
          
        
        
    }
})();