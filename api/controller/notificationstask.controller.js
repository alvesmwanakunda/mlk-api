(function () {
    "use strict";

    var mongoose = require('mongoose');
    var ObjectId = mongoose.Types.ObjectId;
    var NotificationsTask = require('../models/notificationstask.model').NotificationsTaskModel;
    var notificationsTaskService = require('../services/notificationstask.service');

    module.exports = function (acl) {
        return {
            getMyUnreadNotifications(req, res) {
                acl.isAllowed(req.decoded.id, 'agenda', 'retreive', async function (err, aclres) {
                    if (err) {
                        return res.status(500).json({
                            success: false,
                            message: err.message
                        });
                    }

                    if (!aclres) {
                        return res.status(401).json({
                            success: false,
                            message: "401"
                        });
                    }

                    try {
                        if (!ObjectId.isValid(req.decoded.id)) {
                            return res.json({
                                success: true,
                                message: []
                            });
                        }

                        var notifications = await NotificationsTask.find({
                            personneAssignee: new ObjectId(req.decoded.id),
                            isLire: false
                        })
                            .sort({ date: -1 })
                            .populate('proprieteTache', 'prenom nom email role valid desactive')
                            .populate('personneAssignee', 'prenom nom email role valid desactive')
                            .populate('tache')
                            .exec();

                        return res.json({
                            success: true,
                            message: notifications
                        });
                    } catch (error) {
                        return res.status(500).json({
                            success: false,
                            message: error.message
                        });
                    }
                });
            },

            updateNotification(req, res) {
                acl.isAllowed(req.decoded.id, 'agenda', 'retreive', async function (err, aclres) {
                    if (err) {
                        return res.status(500).json({
                            success: false,
                            message: err.message
                        });
                    }

                    if (!aclres) {
                        return res.status(401).json({
                            success: false,
                            message: "401"
                        });
                    }

                    try {
                        if (!ObjectId.isValid(req.params.id) || !ObjectId.isValid(req.decoded.id)) {
                            return res.status(400).json({
                                success: false,
                                message: "Invalid id"
                            });
                        }

                        var notification = await NotificationsTask.findOneAndUpdate(
                            {
                                _id: req.params.id,
                                personneAssignee: new ObjectId(req.decoded.id)
                            },
                            {
                                $set: {
                                    isLire: true
                                }
                            },
                            {
                                new: true
                            }
                        )
                            .populate('proprieteTache', 'prenom nom email role valid desactive')
                            .populate('personneAssignee', 'prenom nom email role valid desactive')
                            .populate('tache')
                            .exec();

                        if (!notification) {
                            return res.status(404).json({
                                success: false,
                                message: "Notification introuvable"
                            });
                        }

                        notificationsTaskService.emitNotificationTask(
                            'notification_task_read',
                            notification
                        );

                        return res.json({
                            success: true,
                            message: notification
                        });
                    } catch (error) {
                        return res.status(500).json({
                            success: false,
                            message: error.message
                        });
                    }
                });
            }
        };
    };
})();
