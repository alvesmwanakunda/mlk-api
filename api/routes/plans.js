(function(){
    'use strict';
    module.exports = function(app,acl){
        var Ctrl = require('../controller/plans.controller')(acl);
        var upload = require("../../middlewares/upload")


        app.route('/module/plans/:id([a-fA-F\\d]{24})')
           .get(Ctrl.read)
           .delete(Ctrl.delete)

        app.route('/module/all/plans/:id([a-fA-F\\d]{24})')
           .get(Ctrl.readAll)
    }


})();