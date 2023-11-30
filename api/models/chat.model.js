(function(){
    "use strict";
    var mongoose = require('mongoose');
    var Schema = mongoose.Schema;

    var chatSchema = new Schema({
        isReadAdmin:{
            type:Boolean,
            default:false
        },
        isRead:{
            type:Boolean,
            default:false
        },
        message : {
            type: String,
            required: true
        },
        senderId :{
            type: Schema.ObjectId,
            ref: 'Users',
            required: false
        },
        receviedId :{
            type: Schema.ObjectId,
            ref: 'Users',
            required: false
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
        ChatSchema: chatSchema,
        ChatModel: mongoose.model("Chat",chatSchema)
    }
})();