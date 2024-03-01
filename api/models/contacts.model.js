(function(){
    "use strict";
    var mongoose = require("mongoose");
    var Schema = mongoose.Schema;

    var contactSchema = new Schema({

        nom:{
            type:String,
            required: false
        },
        prenom:{
            type:String,
            required: false
        },
        phone:{
            type:String,
            required: false
        },
        indicatif:{
            type:String,
            required: false
        },
        email:{
            type:String,
            required: false
        },
        poste:{
            type:String,
            required: false
        },
        contact_id:{
            type:String,
            required: false
        },
        entreprise:{
            type:Schema.ObjectId,
            ref:"Entreprises",
            required:false
        },
        createdDate:{
            type:Date,
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
        numero:{
            type:String,
            required: false
        },
    });
    module.exports = {
        contactSchema: contactSchema,
        ContactModel: mongoose.model('Contacts',contactSchema)
    }
})();