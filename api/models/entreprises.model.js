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
    numero_fournisseur:{
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

   entrepriseSchema.pre('deleteOne',{ document: true }, async function (next) {
    try {
        // Supprimer les projets associés à l'entreprise
        await Projet.deleteMany({ entreprise: this._id });
        // Supprimer les utilisateurs associés à l'entreprise
        await User.deleteMany({ entreprise: this._id });
        // Supprimer les contacts associés à l'entreprise
        await Contact.deleteMany({ entreprise: this._id });
        next(); // Appeler next seulement après la fin de toutes les opérations
    } catch (error) {
        // Gérer les erreurs ici
        console.error("Erreur lors de la suppression d'entreprise et ses entités associées :", error);
        next(error); // Passer l'erreur à la suite du middleware
    }
   });

   module.exports = {
    EntrepriseSchema: entrepriseSchema,
    EntrepriseModel: mongoose.model('Entreprises',entrepriseSchema)
}
})();