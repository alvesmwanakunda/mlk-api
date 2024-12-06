(function(){
    "use strict";
    var mongoose = require("mongoose");
    var Schema = mongoose.Schema;

    var prestationSchema = new Schema({

        nom:{
            type:String,
            required: false
        },
        reference:{
            type:String,
            required: false
        },
        prix:{
            type:Number,
            required: false
        },
        unite:{
            type:String,
            required: false
        },
        createdAt:{
            type:Date,
            required: false
        },
        categorie: {
            type: Schema.ObjectId,
            ref: 'CategoriesPrestations',
            required: false
        },
    });
    module.exports = {
        prestationSchema:prestationSchema,
        PrestationModel: mongoose.model('Prestations',prestationSchema)
    }
})();