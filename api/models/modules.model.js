(function(){
    "use strict";

    var mongoose = require('mongoose');
    var Schema = mongoose.Schema;
    var ProjetModule = require('../models/projetModule.model').ProjetModulesModel;
    var FicheTechnique = require('../models/ficheTechnique.model').FicheTechniqueModel;
    var uploadService = require('../services/upload.service');



    var modulesSchema = new Schema({

        nom: {
            type: String,
            required: false
        },
        type: {
            type: String,
            required: false
        },
        position: {
            type: String,
            required: false
        },
        plan: {
            type: String,
            required: false
        },
        chemin: {
            type: String,
            required: false
        },
        photo: {
            type: String,
            required: false
        },
        nom_photo: {
            type: String,
            required: false
        },
        extension: {
            type: String,
            required: false
        },
        hauteur: {
            type: String,
            required: false
        },
        largeur: {
            type: String,
            required: false
        },
        longueur: {
            type: String,
            required: false
        },
        marque: {
            type: String,
            required: false
        },
        categorie:{
           type: String,
           required:false
        },
        entreprise:{
            type:Schema.ObjectId,
            ref:"Entreprises",
            required:false
         },

        batiment: {
            type: String,
            required: false
        },

        module_type: {
            type: String,
            required: false
        },

        dateLastUpdate: {
            type: Date,
            required: true
        },
        qrcode:{
            type:String,
            required:false
        },
        numero_serie:{
            type : String,
            required:false
        },
        dateFabrication:{
           type:Date, 
           required:true  
        }
    });

    modulesSchema.pre('deleteOne',{ document: true }, async function (next) {
        console.log("remove",this._id);
        try {
            // Supprimer les devis associés
            await ProjetModule.deleteMany({module: this._id});
            await FicheTechnique.deleteOne({module:this._id});
            next();
        } catch (error) {
            console.log(error);
            next(error);
        }
    });

    // Middleware pour modifier le champ "photo" après avoir récupéré un ou plusieurs documents
     modulesSchema.post('find', async function (docs, next) {
        for (const doc of docs) {
            if (doc.chemin) {
                doc.chemin = await uploadService.getSignedUrl(doc.chemin);
            }
            if (doc && doc.photo) {
                doc.photo = await uploadService.getSignedUrlPhoto(doc.photo);
            }
        }
        next();
      });
  
      modulesSchema.post('findOneAndUpdate', async function (doc, next) {
           if (doc && doc.chemin) {
             doc.chemin = await uploadService.getSignedUrl(doc.chemin);
           }
          next();
      });

      modulesSchema.post('findOneAndUpdate', async function (doc, next) {
        if (doc && doc.photo) {
          doc.photo = await uploadService.getSignedUrlPhoto(doc.photo);
        }
       next();
   });
  
      modulesSchema.post('findByIdAndUpdate', async function (doc, next) {
           if (doc && doc.chemin) {
             doc.chemin = await uploadService.getSignedUrl(doc.chemin);
           }
          next();
      });

      modulesSchema.post('findByIdAndUpdate', async function (doc, next) {
        if (doc && doc.photo) {
          doc.photo = await uploadService.getSignedUrlPhoto(doc.photo);
        }
       next();
   });
      
      // Middleware pour modifier le champ "photo" après avoir récupéré un seul document
      modulesSchema.post('findOne', async function (doc, next) {
          if (doc && doc.chemin) {
           doc.chemin = await uploadService.getSignedUrl(doc.chemin);
          }
          next();
      });

      modulesSchema.post('findOne', async function (doc, next) {
        if (doc && doc.photo) {
          doc.photo = await uploadService.getSignedUrlPhoto(doc.photo);
          //console.log("photo", doc.photo);
        }
        next();
    });
      
      // Middleware pour modifier le champ "photo" après avoir récupéré un document par son ID
      modulesSchema.post('findById', async function (doc, next) {
          if (doc && doc.chemin) {
          doc.chemin = await uploadService.getSignedUrl(doc.chemin);
          }
          if (doc && doc.photo) {
            doc.photo = await uploadService.getSignedUrlPhoto(doc.photo);
            //console.log("photo", doc.photo);
          }
          next();
      });


    module.exports = {
      ModulesSchema: modulesSchema,
      ModulesModel: mongoose.model("Modules",modulesSchema)
    }
})();