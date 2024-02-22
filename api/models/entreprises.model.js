(function(){
   "use strict";

   var mongoose = require("mongoose");
   var Schema = mongoose.Schema;
   var Projet = require('./projets.model').ProjetModel;
   var User = require('./users.model').UserModel;
   var Contact = require('./contacts.model').ContactModel;

   var entrepriseSchema = new Schema({

    societe:{
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
    /*adresse:{
        type:String,
        required: false
    },
    ville:{
        type:String,
        required: false
    },*/
    rue:{
        type:String,
        required: false
    },
    postal:{
        type:String,
        required: false
    },
    numero:{
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
    genre:{
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
    company_id:{
        type:String,
        required: false
    },
    type_entreprise:{
        type:String,
        required: false
    },
    source:{
        type:String,
        required: false
    },
    categorie_societe:{
        type:String,
        required: false
    }
   });

   entrepriseSchema.pre('remove',async function(next){
    await Projet.deleteMany({entreprise : this._id});
    await User.deleteMany({entreprise: this._id});
    await Contact.deleteMany({entreprise: this._id});
    next();
   });

   module.exports = {
    entrepriseSchema: entrepriseSchema,
    EntrepriseModel: mongoose.model('Entreprises',entrepriseSchema)
}
})();