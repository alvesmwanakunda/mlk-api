(function(){
    "use strict";

    var mongoose = require('mongoose');
    var Schema = mongoose.Schema;
    var uploadService = require('../services/upload.service');


    var projetmodulesSchema = new Schema({

        module:{
            type:Schema.ObjectId,
            ref:"Modules",
            required:false
         },
         projet:{
            type:Schema.ObjectId,
            ref:"Projets",
            required:false
         },
        dateLastUpdate: {
            type: Date,
            required: true
        },
        position:{
            type: String,
            required:false
        },
        plan:{
            type: String,
            required:false
        },
        extension:{
            type: String,
            required:false
        }
    });

    // Middleware pour modifier le champ "photo" après avoir récupéré un ou plusieurs documents
      projetmodulesSchema.post('find', async function (docs, next) {
        for (const doc of docs) {
        if (doc.plan) {
            doc.plan = await uploadService.getSignedUrl(doc.plan);
        }
        }
        next();
      });
  
      projetmodulesSchema.post('findOneAndUpdate', async function (doc, next) {
        if (doc && doc.plan) {
            doc.plan = await uploadService.getSignedUrl(doc.plan);
        }
        next();
      });
  
      projetmodulesSchema.post('findByIdAndUpdate', async function (doc, next) {
        if (doc && doc.plan) {
            doc.plan = await uploadService.getSignedUrl(doc.plan);
        }
        next();
      });
      
      // Middleware pour modifier le champ "photo" après avoir récupéré un seul document
      projetmodulesSchema.post('findOne', async function (doc, next) {
          if (doc && doc.plan) {
          doc.plan = await uploadService.getSignedUrl(doc.plan);
          }
          next();
      });
      
      // Middleware pour modifier le champ "photo" après avoir récupéré un document par son ID
      projetmodulesSchema.post('findById', async function (doc, next) {
          if (doc && doc.plan) {
          doc.plan = await uploadService.getSignedUrl(doc.plan);
          }
          next();
      });

    
    module.exports = {
      ProjetModulesSchema: projetmodulesSchema,
      ProjetModulesModel: mongoose.model("ProjetModules",projetmodulesSchema)
    }
})();