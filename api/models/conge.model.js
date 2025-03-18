(function(){

    "use strict";
    var mongoose = require("mongoose");
    var Schema = mongoose.Schema;
    var uploadService = require('../services/upload.service');


    var congeSchema = new Schema({

        debut:{
            type:Date,
            required: false
        },

        heure_debut:{
            type:String,
            required: false
        },

        heure_fin:{
            type:String,
            required: false
        },

        fin:{
            type:Date,
            required: false
        },

        user:{
            type:Schema.ObjectId,
            ref:"Users",
            required:false
        },

        responsable:{
            type:Schema.ObjectId,
            ref:"Users",
            required:false
        },

        types:{
            type:String,
            required: false
        },

        motif:{
            type:String,
            required: false
        },

        status:{
            type:String,
            required: false
        },

        jours:{
            type:String,
            required: Number
        },

        date_demande:{
            type:Date,
            required: false
        },

        date_signature:{
            type:Date,
            required: false
        },

        signature_user:{
            type:String,
            required: false
        },

        signature_entreprise:{
            type:String,
            required: false
        },
        raison:{
            type:String,
            required:false,
        },
        fichier:{
            type:String,
            required:false
        },
        nom_fichier: {
            type: String,
            required: false
        },
        
    });

     // Middleware pour modifier le champ "photo" après avoir récupéré un ou plusieurs documents
     congeSchema.post('find', async function (docs, next) {
        for (const doc of docs) {
        if (doc.fichier) {
            doc.fichier = await uploadService.getSignedUrl(doc.fichier);
        }
        }
        next();
      });
  
      congeSchema.post('findOneAndUpdate', async function (doc, next) {
          if (doc.fichier) {
              doc.fichier = await uploadService.getSignedUrl(doc.fichier);
          }
          next();
      });
  
      congeSchema.post('findByIdAndUpdate', async function (doc, next) {
          if (doc.fichier) {
              doc.fichier = await uploadService.getSignedUrl(doc.fichier);
          }
          next();
      });
      
      // Middleware pour modifier le champ "photo" après avoir récupéré un seul document
      congeSchema.post('findOne', async function (doc, next) {
          if (doc && doc.fichier) {
          doc.fichier = await uploadService.getSignedUrl(doc.fichier);
          }
          next();
      });
      
      // Middleware pour modifier le champ "photo" après avoir récupéré un document par son ID
      congeSchema.post('findById', async function (doc, next) {
          if (doc && doc.fichier) {
          doc.fichier = await uploadService.getSignedUrl(doc.fichier);
          }
          next();
      });

    
    module.exports = {
        congeSchema: congeSchema,
        CongeModel: mongoose.model('Conge',congeSchema)
    }
})();