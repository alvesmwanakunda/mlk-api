(function(){

    "use strict";
 
    var mongoose = require("mongoose");
    var Schema = mongoose.Schema;
    var Time = require('../models/timesheetTask.model').TimesheetTaskModel;
    var SubTask = require('../models/sousTache.model').SousTacheModel;
    var uploadService = require('../services/upload.service');


    var tacheSchema = new Schema({

        titre:{
            type:String,
            required: false
        },

        projet:{
            type:Schema.ObjectId,
            ref:"Projets",
            required:true
        },

        agenda:{
            type:Schema.ObjectId,
            ref:"Agendas",
            required:false
        },

        temps:{
            type:String,
            required: false,
            match: /^([01]\d|2[0-3]):([0-5]\d)$/  // Validation pour le format HH:mm
        },

        assignes:[{
            type:Schema.ObjectId,
            ref:"Users",
            required:false
        }],

        user:{
            type:Schema.ObjectId,
            ref:"Users",
            required:false
        },

        date_debut:{
            type:Date,
            required: false,
        },

        date_fin:{
            type:Date,
            required: false,
        },

        description:{
            type:String,
            required: false
        },

        statut: {
            type: String,
            enum: ['A Faire', 'En Cours', 'Terminer', 'Clôturer'],
            default: 'A Faire'
        },

        image: [{
            url: String,       
            width: Number,
            height: Number,
            filename: String,  // Ajouté pour faciliter la gestion des fichiers
            uploadedAt: { type: Date, default: Date.now } // Ajouté pour le suivi
        }],

        // image: {
        //     url: String,       
        //     width: Number,
        //     height: Number
        // },

        date_creation: { type: Date, default: Date.now }

    });
    tacheSchema.post('find', async function (docs, next) { 
        try {
            for (const doc of docs) {
                if (doc.image && doc.image.length >0) {
                    for (const image of doc.image) {
                        if (image.url) {
                            image.url = await uploadService.getSignedUrl(image.url);
                        }
                    }
                    //doc.image.url = await uploadService.getSignedUrl(doc.image.url);
                }
            }
            next();
        } catch (error) {
            console.error('❌ Erreur dans post-find hook:', error);
            next(error);
        }
    }); 
    // Middleware pour modifier le champ "photo" après avoir récupéré un document par son ID
    tacheSchema.post('findById', async function (doc, next) {
        // if (doc && doc.image) {
        // doc.image.url = await uploadService.getSignedUrl(doc.image.url);
        // }
        if (doc && doc.image && doc.image.length > 0) {
            for (const image of doc.image) {
                if (image.url) {
                    image.url = await uploadService.getSignedUrl(image.url);
                }
            }
        }
        next();
    });
    tacheSchema.post('findOne', async function (doc, next) {
        // if (doc && doc.image.url) {
        //  doc.image.url = await uploadService.getSignedUrl(doc.image.url);
        // }
        if (doc && doc.image && doc.image.length > 0) {
            for (const image of doc.image) {
                if (image.url) {
                    image.url = await uploadService.getSignedUrl(image.url);
                }
            }
        }
        next();
    });
        // Middleware pour mettre à jour les hooks après save/update
    tacheSchema.post('save', async function (doc, next) {
        if (doc.image && doc.image.length > 0) {
            for (const image of doc.image) {
                if (image.url) {
                    image.url = await uploadService.getSignedUrl(image.url);
                }
            }
        }
        next();
    });
    
    tacheSchema.post('findOneAndUpdate', async function (doc, next) {
        if (doc && doc.image && doc.image.length > 0) {
            for (const image of doc.image) {
                if (image.url) {
                    image.url = await uploadService.getSignedUrl(image.url);
                }
            }
        }
        next();
    });
    tacheSchema.pre('deleteOne',{ document: true }, async function (next) {
        console.log("remove",this._id);
        try {
            // Supprimer les devis associés
            await Time.deleteMany({ tache: this._id });
            await SubTask.deleteMany({ tache: this._id });
            if (this.image && this.image.length > 0) {
                for (const image of this.image) {
                    await uploadService.deleteTachesFirebaseStorage(image.url);
                }
            }
    
            next();
        } catch (error) {
            console.log(error);
            next(error);
        }
    });
    // Méthode utilitaire pour supprimer une image par son index ou son URL
    tacheSchema.methods.removeImage = async function(imageIndex) {
        if (this.image && this.image.length > imageIndex) {
            // Optionnel: Supprimer le fichier du stockage
            const imageToRemove = this.image[imageIndex];
            await uploadService.deleteTachesFirebaseStorage(imageToRemove.url);
            this.image.splice(imageIndex, 1);
            return this.save();
        }
        return Promise.resolve(this);
    };
    module.exports = {
        tacheSchema: tacheSchema,
        TacheModel: mongoose.model('Taches',tacheSchema)
     }

})();