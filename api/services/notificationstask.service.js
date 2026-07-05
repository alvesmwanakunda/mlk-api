var NotificationsTask = require('../models/notificationstask.model').NotificationsTaskModel;

function emitNotificationTask(eventName, notification) {
    if (global.io && notification) {
        global.io.emit(eventName, notification);
    }
}

async function createNotificationTask(params) {
    var tache = params.tache;
    var personneAssignee = params.personneAssignee;
    var eventName = params.eventName || 'new_notification_task';

    if (!tache || !tache._id || !tache.user || !personneAssignee) {
        return null;
    }

    var notification = await NotificationsTask.create({
        proprieteTache: tache.user,
        personneAssignee: personneAssignee,
        date: new Date(),
        tache: tache._id,
        isLire: false
    });

    var populatedNotification = await NotificationsTask.findOne({ _id: notification._id })
        .populate('proprieteTache', 'prenom nom email role valid desactive')
        .populate('personneAssignee', 'prenom nom email role valid desactive')
        .populate('tache')
        .lean()
        .exec();

    emitNotificationTask(eventName, populatedNotification || notification);
    return populatedNotification || notification;
}

async function createNotificationsForTaskAssignees(params) {
    try {
        var tache = params.tache;
        var eventName = params.eventName || 'new_notification_task';
        var skipUserId = params.skipUserId;
        var assignees = Array.isArray(tache && tache.assignes) ? tache.assignes : [];
        var created = [];
        var usedIds = new Set();

        for (var i = 0; i < assignees.length; i++) {
            var assigneeId = assignees[i];
            if (!assigneeId) continue;

            var id = String(assigneeId);
            if (usedIds.has(id)) continue;
            if (skipUserId && id === String(skipUserId)) continue;
            usedIds.add(id);

            var notification = await createNotificationTask({
                tache: tache,
                personneAssignee: assigneeId,
                eventName: eventName
            });

            if (notification) {
                created.push(notification);
            }
        }

        return created;
    } catch (error) {
        console.error('Erreur création NotificationsTask:', error);
        return [];
    }
}

module.exports = {
    createNotificationTask: createNotificationTask,
    createNotificationsForTaskAssignees: createNotificationsForTaskAssignees,
    emitNotificationTask: emitNotificationTask
};
