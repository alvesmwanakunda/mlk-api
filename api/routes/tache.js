(function(){
    'use strict';
    module.exports = function(app,acl){
        var Ctrl = require('../controller/tache.controller')(acl);

        app.route('/taches/projet/:id([a-fA-F\\d]{24})')
           .get(Ctrl.getAllTacheByProjet)

        app.route('/taches/:id([a-fA-F\\d]{24})')
           .post(Ctrl.addTache)
           .put(Ctrl.updateTache)
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