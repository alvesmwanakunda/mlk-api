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
        projet:[{
            type:Schema.ObjectId,
            ref:"Projets",
            required:false
        }],
        entreprise:[{
            type:Schema.ObjectId,
            ref:"Entreprises",
            required:false
        }],
        createdDate:{
            type:Date,
            required: false
        },
    });
    module.exports = {
        contactSchema: contactSchema,
        ContactModel: mongoose.model('Contacts',contactSchema)
    }
})();