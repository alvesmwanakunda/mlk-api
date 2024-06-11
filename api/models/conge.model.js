(function(){

    "use strict";
    var mongoose = require("mongoose");
    var Schema = mongoose.Schema;

    var congeSchema = new Schema({

        debut:{
            type:Date,
            required: false
        },

        heure_debut:{
            type:String,
            required: false
        },

        heure_fin:{
            type:String,
            required: false
        },

        fin:{
            type:Date,
            required: false
        },

        user:{
            type:Schema.ObjectId,
            ref:"Users",
            required:false
        },

        types:{
            type:String,
            required: false
        },

        motif:{
            type:String,
            required: false
        },

        status:{
            type:String,
            required: false
        },

        jours:{
            type:String,
            required: Number
        },

        date_demande:{
            type:Date,
            required: false
        },

        date_signature:{
            type:Date,
            required: false
        },

        signature_user:{
            type:String,
            required: false
        },

        signature_entreprise:{
            type:String,
            required: false
        },

    });
    module.exports = {
        congeSchema: congeSchema,
        CongeModel: mongoose.model('Conge',congeSchema)
    }
})();