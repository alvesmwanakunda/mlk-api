const { admin } = require('../../firebase-config');
const Notification = require('../models/notification.model').NotificationModel;

module.exports = {

  sendNotification: (fcmToken, title, body, data) => {
    return new Promise(async (resolve, reject) => {
      try {
        let notificationDoc = null;
        let dataToSend = data;

        try {
          // Enregistrer l'historique côté base si possible (optionnel, non bloquant)
          const payload = {
            title: title,
            body: body,
            type: data && data.type ? data.type : undefined,
            resource: data && data.resource ? data.resource : undefined,
            resourceId: data && data.resourceId ? data.resourceId : undefined,
            tacheId: data && data.tacheId ? data.tacheId : undefined,
            agendaId: data && data.agendaId ? data.agendaId : undefined,
            data: data || undefined,
          };

          // userId éventuellement passé dans data.userId
          if (data && data.userId) {
            payload.user = data.userId;
          }

          notificationDoc = await Notification.create(payload);
        } catch (e) {
          console.error('Erreur création Notification en base:', e);
        }

        // Injecter l'id Mongo dans le payload FCM pour pouvoir marquer lu côté mobile.
        if (notificationDoc && notificationDoc._id) {
          try {
            if (!dataToSend || typeof dataToSend !== 'object') {
              dataToSend = {};
            }
            dataToSend.notificationId = notificationDoc._id.toString();
          } catch (e) {}
        }

        if (fcmToken) {
          const message = {
            token: fcmToken,
            notification: {
              title: title,
              body: body,
            },
            data: dataToSend,
          };
          await admin.messaging().send(message);
          console.log('Notification envoyée avec succès');
        }

        resolve(notificationDoc);
      } catch (error) {
        console.error('Erreur envoi notif:', error);
        reject(error);
      }
    });
  },
}
