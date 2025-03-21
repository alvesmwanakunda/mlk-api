(function(){
    "use strict";
    var mongoose = require("mongoose");
    var Schema = mongoose.Schema;

    var agendaSchema = new Schema({

        title:{
            type:String,
            required: false
        },
        start:{
            type:Date,
            required: false
        },
        heure_start:{
            type:String,
            required: false
        },
        heure_end:{
            type:String,
            required: false
        },
        end:{
            type:Date,
            required: false
        },
        color:{
             type:String,
             default:'#03A9F4',
             required:false
        },
        user:{
            type:Schema.ObjectId,
            ref:"Users",
            required:false
        },
        isDay:{
            type:Boolean,
            default:false,
            required:false
        }
    });
    module.exports = {
        agendaSchema: agendaSchema,
        AgendaModel: mongoose.model('Agenda',agendaSchema)
    }
})();