(function(){

    "use strict";
 
    var mongoose = require("mongoose");
    var Schema = mongoose.Schema;
    var uploadService = require('../services/upload.service');


     var timesheetSchema = new Schema({

        date: { type: Date, required: true },
        employee: {
            type:Schema.ObjectId,
            ref:"Users",
            required:true
        },
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
        image: {
            url: String,       
            width: Number,
            height: Number
        },
     });
        timesheetSchema.post('find', async function (docs, next) { 
            try {
                for (const doc of docs) {
                if (doc.image && doc.image.url) {
                    doc.image.url = await uploadService.getSignedUrl(doc.image.url);
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
            if (doc && doc.image) {
            doc.image.url = await uploadService.getSignedUrl(doc.image.url);
            }
            next();
        });
        timesheetSchema.post('findOne', async function (doc, next) {
            if (doc && doc.image.url) {
            doc.image.url = await uploadService.getSignedUrl(doc.image.url);
            }
            next();
        });

      module.exports = {
        timesheetSchema: timesheetSchema,
        TimesheetTaskModel: mongoose.model('TimesheetTask',timesheetSchema)
     }

})();