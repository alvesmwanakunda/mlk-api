var Historique = require('../models/historiqueTache.model').HistoriqueTacheModel;
var Tache = require('../models/taches.model').TacheModel;
var SubTask = require('../models/timesheetTask.model').TimesheetTaskModel;
var User = require("../models/users.model").UserModel;
var historiqueI18n = require('../i18n/historique.i18n');

function getModifierName(user) {
    return [user?.nom, user?.prenom].filter(Boolean).join(' ').trim();
}

function applyDescriptionFields(historique, fields) {
    historique.description = fields.description;
    historique.originalDescription = fields.originalDescription;
    historique.descriptionSourceLanguage = fields.descriptionSourceLanguage;
    historique.descriptionTranslations = fields.descriptionTranslations;
    historique.descriptionTranslation = fields.descriptionTranslation;
    return historique;
}

module.exports = {

    create: (idTask, idUser) => {
        return new Promise(async (resolve, reject) => {
            try {
                const tache = await Tache.findOne({ _id: idTask });
                const user = await User.findOne({ _id: idUser });

                if (!tache || !user) {
                    return reject({
                        status: 'error',
                        body: 'Tâche ou utilisateur introuvable',
                    });
                }

                const fields = historiqueI18n.buildHistoriqueDescriptionFields(
                    'TASK_STATUS_CHANGED',
                    {
                        modifierName: getModifierName(user),
                        taskStatus: tache.statut || '',
                    }
                );

                const historique = applyDescriptionFields(new Historique(), fields);
                historique.tache = idTask;
                historique.user = idUser;

                const result = await historique.save();
                resolve({
                    success: true,
                    message: result,
                });
            } catch (error) {
                reject({
                    status: 'error',
                    body: error.message,
                });
            }
        });
    },

    createSous: (idTask, idUser) => {
        return new Promise(async (resolve, reject) => {
            try {
                const sousTache = await SubTask.findOne({ _id: idTask });
                const user = await User.findOne({ _id: idUser });

                if (!sousTache || !user) {
                    return reject({
                        status: 'error',
                        body: 'Sous-tâche ou utilisateur introuvable',
                    });
                }

                const fields = historiqueI18n.buildHistoriqueDescriptionFields(
                    'SUBTASK_STATUS_CHANGED',
                    {
                        modifierName: getModifierName(user),
                        taskStatus: sousTache.statut || '',
                        subTaskDescriptionSource: sousTache,
                    }
                );

                const historique = applyDescriptionFields(new Historique(), fields);
                historique.tache = sousTache.tache;
                historique.user = idUser;

                const result = await historique.save();
                resolve({
                    success: true,
                    message: result,
                });
            } catch (error) {
                reject({
                    status: 'error',
                    body: error.message,
                });
            }
        });
    },

};
