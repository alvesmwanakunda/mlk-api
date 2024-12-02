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
          required:true,
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
        role:String,
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
         }
    });

    module.exports = {
        userSchema: userSchema,
        UserModel: mongoose.model('Users',userSchema)
    }
})();