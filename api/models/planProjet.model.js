(function(){
    "use strict";

    var mongoose = require('mongoose');
    var Schema = mongoose.Schema;
    var uploadService = require('../services/upload.service');

    var planProjetSchema = new Schema({

        nom: {
            type: String,
            required: true
        },
        chemin: {
            type: String,
            required: false
        },
        extension: {
            type: String,
            required: true
        },
        date: {
            type: Date,
            required: true
        },
        projet: {
            type: Schema.ObjectId,
            ref: "Projets",
            required: false
        }

    });

    // Middleware pour modifier le champ "chemin" après avoir récupéré un ou plusieurs documents
    planProjetSchema.post('find', async function (docs, next) {
        for (const doc of docs) {
            if (doc.chemin) {
                doc.chemin = await uploadService.getSignedUrl(doc.chemin);
            }
        }
        next();
    });

    planProjetSchema.post('findOneAndUpdate', async function (doc, next) {
        if (doc && doc.chemin) {
            doc.chemin = await uploadService.getSignedUrl(doc.chemin);
        }
        next();
    });

    planProjetSchema.post('findByIdAndUpdate', async function (doc, next) {
        if (doc && doc.chemin) {
            doc.chemin = await uploadService.getSignedUrl(doc.chemin);
        }
        next();
    });

    // Middleware pour modifier le champ "chemin" après avoir récupéré un seul document
    planProjetSchema.post('findOne', async function (doc, next) {
        if (doc && doc.chemin) {
            doc.chemin = await uploadService.getSignedUrl(doc.chemin);
        }
        next();
    });

    // Middleware pour modifier le champ "chemin" après avoir récupéré un document par son ID
    planProjetSchema.post('findById', async function (doc, next) {
        if (doc && doc.chemin) {
            doc.chemin = await uploadService.getSignedUrl(doc.chemin);
        }
        next();
    });

    module.exports = {
        PlanProjetSchema: planProjetSchema,
        PlanProjetModel: mongoose.model('PlanProjet', planProjetSchema)
    }
})();
