(function(){
    "use strict";
 
    var mongoose = require("mongoose");
    var Schema = mongoose.Schema;
    var Devis = require('../models/devis.model').DevisModel;
    var Fichier = require('../models/fichiers.model').FichierModel;
    var Dossier = require('../models/dossiers.model').DossierModel;
    var ProjetModule = require('../models/projetModule.model').ProjetModulesModel;
    var uploadService = require('../services/upload.service');


 
    var projetSchema = new Schema({
 
     projet:{
         type:String,
         required: false
     },
     entreprise:{
        type:Schema.ObjectId,
        ref:"Entreprises",
        required:true
     },
     user:{
        type:Schema.ObjectId,
        ref:"Users",
        required:true
     },
     service:{
         type:String,
         required: false
     },
     nom:{
         type:String,
         required: false
     },
     prenom:{
        type:String,
        required: false
    },
    genre:{
        type:String,
        required: false
    },
     pays:{
         type:String,
         required: false
     },
     adresse:{
         type:String,
         required: false
     },
     ville:{
         type:String,
         required: false
     },
     rue:{
         type:String,
         required: false
     },
     postal:{
         type:String,
         required: false
     },
     etat:{
         type:String,
         required: false
     },
     photo:{
         type:String,
         required: false
     },
     numero_offre:{
         type:String,
         required: false
     },
     site_offre:{
         type:String,
         required: false
     },
     budget:{
         type:String,
         required: false
     },
     devise:{
         type:String,
         required: false
     },
     code_projet:{
        type:String,
        required:false
     },
     code_client:{
        type:String,
        required:false
     },
     date_limite:{
         type:Date,
         required: false
     },

     date_fin_contrat:{
        type:Date,
        required: false
    },
     createdDate:{
         type:Date,
         required: false
     },
     plan:{
        type:String,
        required: false
    },
    contact:{
        type:Schema.ObjectId,
            ref:"Contacts",
            required:false
    }
    });

    projetSchema.pre('deleteOne',{ document: true }, async function (next) {
        console.log("remove",this._id);
        try {
            // Supprimer les devis associés
            await Devis.deleteMany({ projet: this._id });
    
            // Supprimer les fichiers associés
            await Fichier.deleteMany({ project: this._id });
    
            // Supprimer les dossiers associés
            await Dossier.deleteMany({ project: this._id });

            await ProjetModule.deleteMany({projet: this._id});
    
            next();
        } catch (error) {
            console.log(error);
            next(error);
        }
    });

    // Middleware pour modifier le champ "photo" après avoir récupéré un ou plusieurs documents
    projetSchema.post('find', async function (docs, next) {
        for (const doc of docs) {
        if (doc.photo) {
            doc.photo = await uploadService.getSignedUrl(doc.photo);
        }
        }
        next();
    });

    projetSchema.post('findOneAndUpdate', async function (doc, next) {
        if (doc.photo) {
            doc.photo = await uploadService.getSignedUrl(doc.photo);
        }
        next();
    });

    projetSchema.post('findByIdAndUpdate', async function (doc, next) {
        if (doc.photo) {
            doc.photo = await uploadService.getSignedUrl(doc.photo);
        }
        next();
    });
    
    // Middleware pour modifier le champ "photo" après avoir récupéré un seul document
    projetSchema.post('findOne', async function (doc, next) {
        if (doc && doc.photo) {
        doc.photo = await uploadService.getSignedUrl(doc.photo);
        }
        next();
    });
    
    // Middleware pour modifier le champ "photo" après avoir récupéré un document par son ID
    projetSchema.post('findById', async function (doc, next) {
        if (doc && doc.photo) {
        doc.photo = await uploadService.getSignedUrl(doc.photo);
        }
        next();
    });

    module.exports = {
     ProjetSchema: projetSchema,
     ProjetModel: mongoose.model('Projets',projetSchema)
    }

    
 })();