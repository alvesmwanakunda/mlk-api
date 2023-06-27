(function(){
    "use strict";
 
    var mongoose = require("mongoose");
    var Schema = mongoose.Schema;
 
    var projetSchema = new Schema({
 
     nom:{
         type:String,
         required: false
     },
     entreprise:{
        type:Schema.ObjectId,
        ref:"Entreprises",
        required:true
     },
     user:{
        type:Schema.ObjectId,
        ref:"Users",
        required:true
     },
     service:{
         type:String,
         required: false
     },
     responsable:{
         type:String,
         required: false
     },
     pays:{
         type:String,
         required: false
     },
     adresse:{
         type:String,
         required: false
     },
     ville:{
         type:String,
         required: false
     },
     rue:{
         type:String,
         required: false
     },
     postal:{
         type:String,
         required: false
     },
     etat:{
         type:String,
         required: false
     },
     photo:{
         type:String,
         required: false
     },
     numero_offre:{
         type:String,
         required: false
     },
     site_offre:{
         type:String,
         required: false
     },
     budget:{
         type:String,
         required: false
     },
     devise:{
         type:String,
         required: false
     },
     code_projet:{
        type:String,
        required:false
     },
     code_client:{
        type:String,
        required:false
     },
     date_limite:{
         type:Date,
         required: false
     },
     createdDate:{
         type:Date,
         required: false
     },
    });
    module.exports = {
     projetSchema: projetSchema,
     ProjetModel: mongoose.model('Projets',projetSchema)
 }
 })();