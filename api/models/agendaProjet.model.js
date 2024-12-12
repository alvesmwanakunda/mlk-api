(function(){
    "use strict";
    var mongoose = require("mongoose");
    var Schema = mongoose.Schema;

    var agendaProjetSchema = new Schema({

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
        },
        projet: {
            type: Schema.ObjectId,
            ref: 'Projets',
            required: false
        },
       
    });
    module.exports = {
        agendaProjetSchema: agendaProjetSchema,
        AgendaProjetModel: mongoose.model('AgendaProjet',agendaProjetSchema)
    }
})();