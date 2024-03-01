(function(){
   "use strict";
   var mongoose = require("mongoose");
   var Schema = mongoose.Schema;

   var adresseLivraisonSchema = new Schema({

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
    contact_id:{
        type:String,
        required: false
    },
    contact:{
        type:Schema.ObjectId,
        ref:"Contacts",
        required:false
    },
    createdDate:{
        type:Date,
        required: false,
        default: new Date()
    },
});
module.exports = {
    adresseLivraisonSchema: adresseLivraisonSchema,
    AdresseLivraisonModel: mongoose.model('AdresseLivraison',adresseLivraisonSchema)
}

})();