(function(){
    "use strict";

    var mongoose = require('mongoose');
    var Schema = mongoose.Schema;
    var uploadService = require('../services/upload.service');


    var planSchema = new Schema({

        nom: {
            type: String,
            required: true
          },
          vignette: {
            type: String,
            required: false
          },
          chemin: {
            type: String,
            required: false
          },
          extension: {
            type: String,
            required: true
          },
          
          size: {
            type: Number,
            required: false
          },
          numeroPage: {
            type: Number,
            required: false
          },
          date: {
            type: Date,
            required: true
          },
          dateLastUpdate: {
            type: Date,
            required: true
          },
          creator: {
            type: Schema.ObjectId,
            ref: 'Users',
            required: true
          },
          module: {
            type: Schema.ObjectId,
            ref: 'Modules',
            required: false
          },
          
          profondeur: {
            type: Number,
            required: false
          },

          creator: {
            type: Schema.ObjectId,
            ref: 'Users',
            required: false
          },

          dossierParent: {
            type: Schema.ObjectId,
            ref: 'DossiersModule',
            required: false
          },
        
    });

    // Middleware pour modifier le champ "photo" après avoir récupéré un ou plusieurs documents
    planSchema.post('find', async function (docs, next) {
      for (const doc of docs) {
      if (doc.chemin) {
          doc.chemin = await uploadService.getSignedUrl(doc.chemin);
      }
      }
      next();
    });

    planSchema.post('findOneAndUpdate', async function (doc, next) {
        if (doc && doc.chemin) {
          doc.chemin = await uploadService.getSignedUrl(doc.chemin);
        }
        next();
    });

    planSchema.post('findByIdAndUpdate', async function (doc, next) {
        if (doc && doc.chemin) {
         doc.chemin = await uploadService.getSignedUrl(doc.chemin);
        }
        next();
    });
    
    // Middleware pour modifier le champ "photo" après avoir récupéré un seul document
    planSchema.post('findOne', async function (doc, next) {
        if (doc && doc.chemin) {
        doc.chemin = await uploadService.getSignedUrl(doc.chemin);
        }
        next();
    });
    
    // Middleware pour modifier le champ "photo" après avoir récupéré un document par son ID
    planSchema.post('findById', async function (doc, next) {
        if (doc && doc.chemin) {
        doc.chemin = await uploadService.getSignedUrl(doc.chemin);
        }
        next();
    });

    module.exports = {
        PlanSchema:planSchema,
        PlanModel: mongoose.model('Plans', planSchema)
    }
})();