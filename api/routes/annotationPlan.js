(function(){
    'use strict';
    module.exports = function(app,acl){
        var Ctrl = require('../controller/annotationPlan.controller')(acl);


        app.route('/annotation/plan/:id([a-fA-F\\d]{24})')
           .get(Ctrl.getAnnotation)
           .delete(Ctrl.deleteAnnotation)
           .put(Ctrl.updateAnnotation)

        app.route('/annotation/plan/:plan([a-fA-F\\d]{24})/:projet([a-fA-F\\d]{24})')
            .get(Ctrl.getAllAnnotationByProjetPlan)
            .post(Ctrl.addAnnotation)

    }
})();