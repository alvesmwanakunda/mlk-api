(function () {
  'use strict';
  var Notification = require('../models/notification.model').NotificationModel;
  var mongoose = require('mongoose');
  var ObjectId = mongoose.Types.ObjectId;

  module.exports = function (acl) {
    return {
      getMyNotifications: function (req, res) {
        acl.isAllowed(req.decoded.id, 'projets', 'create', async function (err, ok) {
          if (!ok) {
            return res.status(401).json({
              success: false,
              message: '401',
            });
          }

          try {
            const page = parseInt(req.query.page || '1', 10);
            const limit = Math.min(parseInt(req.query.limit || '20', 10), 100);
            const skip = (page - 1) * limit;

            const query = {
              user: ObjectId.isValid(req.decoded.id) ? new ObjectId(req.decoded.id) : undefined,
            };

            if (!query.user) {
              return res.json({ success: true, message: [] });
            }

            const notifications = await Notification.find(query)
              .sort({ createdAt: -1 })
              .skip(skip)
              .limit(limit)
              .lean()
              .exec();

            res.json({
              success: true,
              message: notifications,
            });
          } catch (e) {
            return res.status(500).json({
              success: false,
              message: e.message,
            });
          }
        });
      },

      getMyUnreadCount: function (req, res) {
        acl.isAllowed(req.decoded.id, 'projets', 'create', async function (err, ok) {
          if (!ok) {
            return res.status(401).json({
              success: false,
              message: '401',
            });
          }

          try {
            const query = {
              user: ObjectId.isValid(req.decoded.id) ? new ObjectId(req.decoded.id) : undefined,
              readAt: null,
            };

            if (!query.user) {
              return res.json({ success: true, message: { count: 0 } });
            }

            const count = await Notification.countDocuments(query).exec();
            res.json({
              success: true,
              message: { count: count },
            });
          } catch (e) {
            return res.status(500).json({
              success: false,
              message: e.message,
            });
          }
        });
      },

      markAsRead: function (req, res) {
        acl.isAllowed(req.decoded.id, 'projets', 'create', async function (err, ok) {
          if (!ok) {
            return res.status(401).json({
              success: false,
              message: '401',
            });
          }

          try {
            const id = req.params.id;
            if (!ObjectId.isValid(id)) {
              return res.status(400).json({
                success: false,
                message: 'Invalid id',
              });
            }

            const notif = await Notification.findOneAndUpdate(
              { _id: id, user: req.decoded.id },
              { $set: { readAt: new Date() } },
              { new: true }
            ).exec();

            res.json({
              success: true,
              message: notif,
            });
          } catch (e) {
            return res.status(500).json({
              success: false,
              message: e.message,
            });
          }
        });
      },

      markAllAsRead: function (req, res) {
        acl.isAllowed(req.decoded.id, 'projets', 'create', async function (err, ok) {
          if (!ok) {
            return res.status(401).json({
              success: false,
              message: '401',
            });
          }

          try {
            const userId = req.decoded.id;
            if (!ObjectId.isValid(userId)) {
              return res.json({ success: true, message: { modifiedCount: 0 } });
            }

            const result = await Notification.updateMany(
              { user: new ObjectId(userId), readAt: null },
              { $set: { readAt: new Date() } }
            ).exec();

            res.json({
              success: true,
              message: { modifiedCount: result.modifiedCount },
            });
          } catch (e) {
            return res.status(500).json({
              success: false,
              message: e.message,
            });
          }
        });
      },
    };
  };
})();

