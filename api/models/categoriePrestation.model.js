(function(){
    "use strict";
    var mongoose = require("mongoose");
    var Schema = mongoose.Schema;

    var categoriePrestationSchema = new Schema({

        nom:{
            type:String,
            required: false
        },
        reference:{
            type:String,
            required: false
        },
        createdAt:{
            type:Date,
            required: false
        },
    });
    module.exports = {
        categoriePrestationSchema:categoriePrestationSchema,
        CategoriePrestationModel: mongoose.model('CategoriesPrestations',categoriePrestationSchema)
    }
})();