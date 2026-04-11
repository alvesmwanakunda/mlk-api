(function () {
  'use strict';
  module.exports = function (app, acl) {
    var Ctrl = require('../controller/notification.controller')(acl);

    app.route('/notifications')
      .get(Ctrl.getMyNotifications);

    app.route('/notifications/unread-count')
      .get(Ctrl.getMyUnreadCount);

    app.route('/notifications/:id([a-fA-F\\d]{24})/read')
      .patch(Ctrl.markAsRead);

    app.route('/notifications/read-all')
      .patch(Ctrl.markAllAsRead);
  };
})();

