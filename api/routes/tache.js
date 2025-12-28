(function(){
    'use strict';
    module.exports = function(app,acl){
        var Ctrl = require('../controller/tache.controller')(acl);
        var upload = require("../../middlewares/upload")


        app.route('/taches/projet/:id([a-fA-F\\d]{24})')
           .get(Ctrl.getAllTacheByProjet)

       app.post('/taches/:id([a-fA-F\\d]{24})', upload.fields([{ name: 'image' }]), Ctrl.addTache);
       app.put('/taches/:id([a-fA-F\\d]{24})', upload.fields([{ name: 'image' }]), Ctrl.updateTache);


        app.route('/taches/:id([a-fA-F\\d]{24})')
           //.post(Ctrl.addTache)
           //.put(Ctrl.updateTache)
           .delete(Ctrl.deleteTache)
           .get(Ctrl.getTache)

        // Time Sheet

         app.route('/time/tache/:id([a-fA-F\\d]{24})')
           .get(Ctrl.getAllTimeByTask)

         app.route('/time/taches/:id([a-fA-F\\d]{24})')
           .post(Ctrl.addTime)
           .put(Ctrl.updateTime)
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
        
        
    }
})();