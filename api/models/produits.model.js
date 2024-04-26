(function(){

    "use strict";

    var mongoose = require('mongoose');
    var Schema = mongoose.Schema;

    var produitsSchema = new Schema({

        nom: {
            type: String,
            required: false
        },

        produit_odoo: {
            type: Number,
            required: false
        },

        produit_prestashop: {
            type: String,
            required: false
        },

        createdAt : {
            type: Date,
            default: Date.now()
        },
        
    });
    module.exports = {
        ProduitsSchema: produitsSchema,
        ProduitsModel: mongoose.model("Produits",produitsSchema)
    }


})();