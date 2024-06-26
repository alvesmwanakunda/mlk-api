(function(){
    "use strict";

    var mongoose = require('mongoose');
    var Schema = mongoose.Schema;

    var modulesSchema = new Schema({

        nom: {
            type: String,
            required: false
        },
        type: {
            type: String,
            required: false
        },
        position: {
            type: String,
            required: false
        },
        plan: {
            type: String,
            required: false
        },
        chemin: {
            type: String,
            required: false
        },
        photo: {
            type: String,
            required: false
        },
        nom_photo: {
            type: String,
            required: false
        },
        extension: {
            type: String,
            required: false
        },
        hauteur: {
            type: String,
            required: false
        },
        largeur: {
            type: String,
            required: false
        },
        longueur: {
            type: String,
            required: false
        },
        marque: {
            type: String,
            required: false
        },
        categorie:{
           type: String,
           required:false
        },
        entreprise:{
            type:Schema.ObjectId,
            ref:"Entreprises",
            required:false
         },

        batiment: {
            type: String,
            required: false
        },

        module_type: {
            type: String,
            required: false
        },

        dateLastUpdate: {
            type: Date,
            required: true
        },
        qrcode:{
            type:String,
            required:false
        },
        numero_serie:{
            type : String,
            required:false
        },
        dateFabrication:{
           type:Date, 
           required:true  
        }
    });
    module.exports = {
      ModulesSchema: modulesSchema,
      ModulesModel: mongoose.model("Modules",modulesSchema)
    }
})();