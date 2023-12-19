(function(){

    "use strict";
    var mongoose = require('mongoose');
    var Schema = mongoose.Schema;

    var chatProjetsSchema = new Schema({
        message : {
            type: String,
            required: true
        },
        projet :{
            type: Schema.ObjectId,
            ref: 'Projets',
            required: false
        },
        user :{
            type: Schema.ObjectId,
            ref: 'Users',
            required: false
        },
        isClient:{
            type:Boolean,
            default:false
        },
        isAdmin:{
            type:Boolean,
            default:false
        },
        createdAt : {
            type: Date,
            default: Date.now()
        }
    });
    module.exports = {
        ChatProjetsSchema: chatProjetsSchema,
        ChatProjetsModel: mongoose.model("ChatProjets",chatProjetsSchema)
    }

})();