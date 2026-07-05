(function () {
    "use strict";

    module.exports = function (app, acl) {
        var Ctrl = require('../controller/notificationstask.controller')(acl);

        app.route('/notificationstask')
            .get(Ctrl.getMyUnreadNotifications);

        app.route('/notificationstask/:id([a-fA-F\\d]{24})')
            .put(Ctrl.updateNotification)
            .patch(Ctrl.updateNotification);

        app.route('/notificationstask/:id([a-fA-F\\d]{24})/read')
            .put(Ctrl.updateNotification)
            .patch(Ctrl.updateNotification);
    };
})();
