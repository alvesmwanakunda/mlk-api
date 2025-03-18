(function(){
    "use strict";

    var mongoose = require('mongoose');
    var Schema = mongoose.Schema;
    var uploadService = require('../services/upload.service');


    var planModuleSchema = new Schema({

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
      

    });

    // Middleware pour modifier le champ "photo" après avoir récupéré un ou plusieurs documents
    planModuleSchema.post('find', async function (docs, next) {
      for (const doc of docs) {
      if (doc.chemin) {
          doc.chemin = await uploadService.getSignedUrl(doc.chemin);
      }
      }
      next();
    });

    planModuleSchema.post('findOneAndUpdate', async function (doc, next) {
        if (doc && doc.chemin) {
          doc.chemin = await uploadService.getSignedUrl(doc.chemin);
        }
        next();
    });

    planModuleSchema.post('findByIdAndUpdate', async function (doc, next) {
        if (doc && doc.chemin) {
         doc.chemin = await uploadService.getSignedUrl(doc.chemin);
        }
        next();
    });
    
    // Middleware pour modifier le champ "photo" après avoir récupéré un seul document
    planModuleSchema.post('findOne', async function (doc, next) {
        if (doc && doc.chemin) {
        doc.chemin = await uploadService.getSignedUrl(doc.chemin);
        }
        next();
    });
    
    // Middleware pour modifier le champ "photo" après avoir récupéré un document par son ID
    planModuleSchema.post('findById', async function (doc, next) {
        if (doc && doc.chemin) {
        doc.chemin = await uploadService.getSignedUrl(doc.chemin);
        }
        next();
    });

    module.exports = {
        PlanModuleSchema: planModuleSchema,
        PlanModuleModel: mongoose.model('PlanModule', planModuleSchema)
    }
})();