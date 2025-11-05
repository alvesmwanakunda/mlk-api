(function(){

    "use strict";

    var mongoose = require('mongoose');
    var Schema = mongoose.Schema;

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

    module.exports = {
        NoteModulesSchema: noteModulesSchema,
        NoteModuleModel: mongoose.model("NoteModules",noteModulesSchema)
    }

})();