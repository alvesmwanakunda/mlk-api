(function(){

    "use strict";

    var mongoose = require('mongoose');
    var Schema = mongoose.Schema;
    var uploadService = require('../services/upload.service');


    var noteModulesSchema = new Schema({
        //projectId: { type: Schema.Types.ObjectId, ref: 'Project', required: true },
        type: { type: String, enum: ['text','audio','image','mixed'], default: 'mixed' },
        text: { type: String },
        audio: {
            url: String,        
            mime: String,
            duration: Number
        },
        image: {
            url: String,       
            width: Number,
            height: Number
        },
         module: {
            type: Schema.ObjectId,
            ref: 'Modules',
            required: false
        },
    
        annotationJSON: { type: Schema.Types.Mixed }, 
        createdBy: { type: Schema.Types.ObjectId, ref: 'Users' },
        dateLastUpdate:{
            type: Date,
            required: false,
        }
        //meta: { type: Schema.Types.Mixed }, // tags, position, etc.
    });

    noteModulesSchema.post('find', async function (docs, next) {
        console.log('📝 Post-find hook executé');
        console.log('📝 Nombre de documents:', docs.length);
        
        try {
            for (const doc of docs) {
            console.log('📝 Traitement document:', doc._id);
            console.log('📝 Doc audio:', doc.audio ? 'PRÉSENT' : 'ABSENT');
            console.log('📝 Doc image:', doc.image ? 'PRÉSENT' : 'ABSENT');
            
            if (doc.audio && doc.audio.url) {
                console.log('🎵 Génération URL signée pour audio');
                doc.audio.url = await uploadService.getSignedUrl(doc.audio.url);
                console.log('🎵 URL audio mise à jour');
            }
            
            if (doc.image && doc.image.url) {
                console.log('🖼️ Génération URL signée pour image');
                doc.image.url = await uploadService.getSignedUrl(doc.image.url);
                console.log('🖼️ URL image mise à jour');
            }
            }
            next();
        } catch (error) {
            console.error('❌ Erreur dans post-find hook:', error);
            next(error);
        }
    });

      // Middleware pour modifier le champ "photo" après avoir récupéré un document par son ID
    noteModulesSchema.post('findById', async function (doc, next) {
        if (doc && doc.audio) {
        doc.audio.url = await uploadService.getSignedUrl(doc.audio.url);
        }
        if (doc && doc.image) {
        doc.image.url = await uploadService.getSignedUrl(doc.image.url);
        }
        next();
    });

    module.exports = {
        NoteModulesSchema: noteModulesSchema,
        NoteModuleModel: mongoose.model("NoteModules",noteModulesSchema)
    }

})();