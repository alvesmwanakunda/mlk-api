(function(){
    "use strict";
 
    var mongoose = require("mongoose");
    var Schema = mongoose.Schema;
    var Devis = require('../models/devis.model').DevisModel;
    var Facture = require('../models/facture.mode').FacturesModel;
 
    var projetSchema = new Schema({
 
     projet:{
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
     nom:{
         type:String,
         required: false
     },
     prenom:{
        type:String,
        required: false
    },
    genre:{
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
     plan:{
        type:String,
        required: false
    },
    });
    projetSchema.pre('remove', async function (next) {
     
        Devis.find({
          projet: this._id
        }, function (err, resp) {
          if (resp) {
            resp.forEach(doc => {
              doc.remove();
            });
          }
        });
        Facture.find({
          projet: this._id
        }, function (err, resp) {
          if (resp) {
            resp.forEach(dos => {
              dos.remove();
            });
          }
        });
        next();
    });
    module.exports = {
     projetSchema: projetSchema,
     ProjetModel: mongoose.model('Projets',projetSchema)
 }
 })();