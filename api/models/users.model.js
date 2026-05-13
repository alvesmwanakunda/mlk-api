(function(){
    "use strict";

    var mongoose = require('mongoose');
    var Schema = mongoose.Schema;

    var userSchema = new Schema({
        prenom:{
            type:String,
            required: false
        },
        nom:{
            type:String,
            required: false
        },
        email:{
            type:String,
            required:false,
        },
        phone:{
          type:String,
          required:false
        },
        adresse:{
            type:String,
            required:false
        },
        genre:{
           type:String,
           required:false
        },
        password:{
          type: String,
          required:false,
          select:false
        },
        valid:{
            type: Boolean,
            default: false
        },
        desactive:{
            type: Boolean,
            default: false
        },
        isPerson:{
            type: Boolean,
            default: false
        },
        role:String,
        preferredLanguage: {
            type: String,
            enum: ['fr', 'en', 'tr', 'pl', 'wo'],
            default: 'fr'
        },
        
        code: {
            type: String,
            required: false,
            select: false
        },
        entreprise:{
            type:Schema.ObjectId,
            ref:"Entreprises",
            required:false
        },
        idPhone:{
            type:String,
            required:false
         },
         type_contrat:{
            type:String,
            required:false
         },
         heure:{
            type:Number,
            required:false
         },
        source_id:{
            type:String,
            required:false
        },
        source:{
            type:String,
            required:false
        },
        twoFactorEnabled: { 
            type: Boolean, 
            required:false
        },
        twoFactorType:{
            type:String,
            required:false
        },
        twoFactorSecret: { 
            type: String,
            required:false
        },
        codeExpiration: {
            type: Date,
            required:false
        },
        fcmToken: {
            type: String,
            required:false
        }
    });

    module.exports = {
        userSchema: userSchema,
        UserModel: mongoose.model('Users',userSchema)
    }
})();
