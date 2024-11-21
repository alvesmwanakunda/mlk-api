(function(){
    'use strict';
    module.exports = function(app,acl){
        var Ctrl = require('../controller/timeSheet.controller')(acl);

        app.route('/timesheet')
           .get(Ctrl.getAllTimeSheet)
           //.post(Ctrl.addTimeSheet)

        app.route('/timesheet/:id([a-fA-F\\d]{24})')
           .post(Ctrl.addTimeSheet)
           .put(Ctrl.updsteTimeSheet)
           .delete(Ctrl.deleteTimeSheet)
           .get(Ctrl.getTimeSheet)
        
        app.route('/timesheet/user/:id([a-fA-F\\d]{24})')
           .get(Ctrl.getAllTimeSheetByUser)

        app.route('/timesheet/user/:id([a-fA-F\\d]{24})/:month/:year')
           .get(Ctrl.getAllTimeSheetUserByDate)

        app.route('/timesheet/donwload/excel/:month/:year')
           .get(Ctrl.downloadExecelTimeSheet)

        app.route('/timesheet/phone/:id([a-fA-F\\d]{24})')
        .post(Ctrl.addTimeSheetMobile)


        app.route('/timesheet/agent')
           .get(Ctrl.getAllTimeSheetByAgent)

        app.route('/timesheet/agent/:month/:year')
           .get(Ctrl.getAllTimeSheetAgentByDate)

      



    }
})();