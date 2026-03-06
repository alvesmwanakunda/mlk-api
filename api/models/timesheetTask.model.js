(function(){

    "use strict";
 
    var mongoose = require("mongoose");
    var Schema = mongoose.Schema;
    var uploadService = require('../services/upload.service');


     var timesheetSchema = new Schema({

        date: { type: Date, required: false},
        date_fin:{type:Date, required: false},
        employee: [{
            type:Schema.ObjectId,
            ref:"Users",
            required:true
        }],
        user:{
            type:Schema.ObjectId,
            ref:"Users",
            required:false
        },
        description: { type: String },
        hours:{
            type:String,
            required: false,
            match: /^([01]\d|2[0-3]):([0-5]\d)$/  // Validation pour le format HH:mm
        },
        date_creation: { type: Date, default: Date.now },
        tache:{
            type:Schema.ObjectId,
            ref:"Taches",
            required:true
        },
        image: [{
            url: String,       
            width: Number,
            height: Number,
            filename: String,  // Ajouté pour faciliter la gestion des fichiers
            uploadedAt: { type: Date, default: Date.now } // Ajouté pour le suivi
        }],
        statut: {
            type: String,
            enum: ['A Faire', 'En Cours', 'Terminer'],
            default: 'A Faire'
        },
     });
    timesheetSchema.post('find', async function (docs, next) { 
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
    timesheetSchema.post('findById', async function (doc, next) {
        if (doc && doc.image && doc.image.length > 0) {
            for (const image of doc.image) {
                if (image.url) {
                    image.url = await uploadService.getSignedUrl(image.url);
                }
            }
        }
        next();
    });
    timesheetSchema.post('findOne', async function (doc, next) {
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
    timesheetSchema.post('save', async function (doc, next) {
        if (doc.image && doc.image.length > 0) {
            for (const image of doc.image) {
                if (image.url) {
                    image.url = await uploadService.getSignedUrl(image.url);
                }
            }
        }
        next();
    });
    
    timesheetSchema.post('findOneAndUpdate', async function (doc, next) {
        if (doc && doc.image && doc.image.length > 0) {
            for (const image of doc.image) {
                if (image.url) {
                    image.url = await uploadService.getSignedUrl(image.url);
                }
            }
        }
        next();
    });
    // Méthode utilitaire pour supprimer une image par son index ou son URL
    timesheetSchema.methods.removeImage = async function(imageIndex) {
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
        timesheetSchema: timesheetSchema,
        TimesheetTaskModel: mongoose.model('TimesheetTask',timesheetSchema)
    }

})();