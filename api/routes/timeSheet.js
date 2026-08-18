(function(){
    'use strict';
    module.exports = function(app,acl){
        var Ctrl = require('../controller/timeSheet.controller')(acl);

       app.route('/timesheet/today').get(Ctrl.getAllTimeToDay)
       app.route('/timesheet/month/:month').get(Ctrl.getTimesheetsByMonth)
       app.route('/timesheet/day/:date').get(Ctrl.getTimesheetsByDay)
       app.route('/timesheet/period').get(Ctrl.getTimesheetsByPeriod)
       app.route('/timesheet/week/:year/:week').get(Ctrl.getTimesheetsByWeek)
       app.route('/timesheet/advanced').get(Ctrl.getTimesheetsAdvanced)
        // Nouvelles routes de filtrage


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

        app.route('/timesheet/user/:id([a-fA-F\\d]{24})/statistics')
           .get(Ctrl.getUserStatistics)

        app.route('/timesheet/user/:id([a-fA-F\\d]{24})/:month/:year')
           .get(Ctrl.getAllTimeSheetUserByDate)

        app.route('/timesheet/user/period/:id([a-fA-F\\d]{24})/:start/:end')
           .get(Ctrl.getAllTimeSheetUserByPeriod)

        app.route('/timesheet/donwload/excel/:month/:year')
           .get(Ctrl.downloadExecelTimeSheet)

        app.route('/timesheet/phone/:id([a-fA-F\\d]{24})')
        .post(Ctrl.addTimeSheetMobile)


        app.route('/timesheet/agent')
           .get(Ctrl.getAllTimeSheetByAgent)

        app.route('/timesheet/agent/:month/:year').get(Ctrl.getAllTimeSheetAgentByDate)

      



    }
})();
