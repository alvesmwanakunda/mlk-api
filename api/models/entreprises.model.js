(function(){
   "use strict";

   var mongoose = require("mongoose");
   var Schema = mongoose.Schema;
   var Projet = require('./projets.model').ProjetModel;

   var entrepriseSchema = new Schema({

    nom:{
        type:String,
        required: false
    },
    commercial:{
        type:String,
        required: false
    },
    siren:{
        type:String,
        required: false
    },
    siret:{
        type:String,
        required: false
    },
    juridique:{
        type:String,
        required: false
    },
    tva:{
        type:String,
        required: false
    },
    activite:{
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
    site:{
        type:String,
        required: false
    },
    email:{
        type:String,
        required: false
    },
    indicatif:{
        type:String,
        required: false
    },
    telephone:{
        type:String,
        required: false
    },
    photo:{
        type:String,
        required: false
    },
    corps_act:{
        type:String,
        required: false
    },
    corps_etat:{
        type:String,
        required: false
    },
    fournisseur:{
        type:String,
        required: false
    },
    createdDate:{
        type:Date,
        required: false
    },
    nbr_projet:{
        type:Number,
        required: false,
        default:0,
    },
    representant:{
        type:String,
        required: false
    },

   });

   entrepriseSchema.pre('remove',async function(next){
    await Projets.deleteMany({entreprise : this._id});
    next();
   });

   module.exports = {
    entrepriseSchema: entrepriseSchema,
    EntrepriseModel: mongoose.model('Entreprises',entrepriseSchema)
}
})();