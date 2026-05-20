const { admin } = require('../../firebase-config');
const Notification = require('../models/notification.model').NotificationModel;
const User = require('../models/users.model').UserModel;
const notificationI18n = require('../i18n/notification.i18n');
const translationService = require('./deeplTranslation.service');

function mapTranslationsToObject(value) {
  if (!value) return {};
  if (value instanceof Map) {
    return Object.fromEntries(value);
  }
  return value;
}

function getUserLanguage(user) {
  return translationService.normalizeAppLanguage(user?.preferredLanguage) || 'fr';
}

module.exports = {
  /**
   * Envoie une notification traduite (FCM + historique en base).
   * @param {Object} params
   * @param {Object} params.user - Utilisateur destinataire (fcmToken, preferredLanguage, _id)
   * @param {string} params.templateKey - Clé du gabarit (ex: TASK_ASSIGNED)
   * @param {Object} params.context - Variables du gabarit (taskTitle, projectName, …)
   * @param {Object} [params.data] - Métadonnées FCM / ressource
   */
  sendNotification: ({ user, templateKey, context = {}, data = {} }) => {
    return new Promise(async (resolve, reject) => {
      try {
        let notificationDoc = null;
        const language = getUserLanguage(user);

        const translationFields = notificationI18n.buildNotificationTranslationFields(
          templateKey,
          context
        );
        const localized = notificationI18n.getLocalizedNotificationContent(
          translationFields,
          language
        );

        const payload = {
          title: translationFields.title,
          body: translationFields.body,
          originalTitle: translationFields.originalTitle,
          originalBody: translationFields.originalBody,
          sourceLanguage: translationFields.sourceLanguage,
          titleTranslations: translationFields.titleTranslations,
          bodyTranslations: translationFields.bodyTranslations,
          translation: translationFields.translation,
          type: data?.type,
          resource: data?.resource,
          resourceId: data?.resourceId,
          tacheId: data?.tacheId,
          agendaId: data?.agendaId,
          data: data || undefined,
        };

        if (user?._id) {
          payload.user = user._id;
        } else if (data?.userId) {
          payload.user = data.userId;
        }

        try {
          notificationDoc = await Notification.create(payload);
        } catch (e) {
          console.error('Erreur création Notification en base:', e);
        }

        let dataToSend = { ...(data || {}) };
        if (notificationDoc && notificationDoc._id) {
          dataToSend.notificationId = notificationDoc._id.toString();
        }

        dataToSend.title = localized.title;
        dataToSend.body = localized.body;
        dataToSend.displayTitle = localized.title;
        dataToSend.displayBody = localized.body;
        dataToSend.language = language;

        const fcmToken = user?.fcmToken;
        if (fcmToken) {
          const message = {
            token: fcmToken,
            notification: {
              title: localized.title,
              body: localized.body,
            },
            data: Object.fromEntries(
              Object.entries(dataToSend).map(([key, value]) => [
                key,
                value == null ? '' : String(value),
              ])
            ),
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

  /**
   * Notifie les assignés d'un agenda (création ou mise à jour).
   */
  notifyAgendaAssignees: async ({
    assigneeIds,
    agenda,
    projet,
    templateKey,
    skipUserId,
  }) => {
    const ids = Array.isArray(assigneeIds) ? assigneeIds : [];
    const context = projet
      ? {
          agendaTitleSource: translationService.toTitleSource(agenda),
          projectName: projet?.projet || '',
        }
      : {
          agendaTitleSource: translationService.toTitleSource(agenda),
        };

    for (const assigneeId of ids) {
      if (!assigneeId) continue;
      if (skipUserId && String(assigneeId) === String(skipUserId)) continue;

      const user = await User.findOne({ _id: assigneeId });
      if (!user) continue;

      const data = {
        type: projet ? 'tache' : 'agenda',
        userId: user._id.toString(),
        agendaId: agenda?._id?.toString(),
      };

      if (projet?._id) {
        data.resource = 'projet';
        data.resourceId = projet._id.toString();
      }

      await module.exports.sendNotification({
        user,
        templateKey,
        context,
        data,
      });
    }
  },

  mapTranslationsToObject,
  getUserLanguage,
};
