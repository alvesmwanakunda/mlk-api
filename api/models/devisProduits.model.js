(function(){

    "use strict";

    var mongoose = require('mongoose');
    var Schema = mongoose.Schema;

    var devisProduitsSchema = new Schema({

        produit: {
            type: String,
            required: false
        },
        description: {
            type: String,
            required: false
        },
        price_unitaire: {
            type: Number,
            required: false
        },
        quantite: {
            type: Number,
            required: false
        },
        price:{
            type: Number,
            required: false
        },
        createdAt : {
            type: Date,
            default: Date.now()
        },
        devis: {
            type: Schema.ObjectId,
            ref: 'Devis',
            required: false
        },
    });
    module.exports = {
        DevisProduitsSchema: devisProduitsSchema,
        DevisProduitsModel: mongoose.model("DevisProduits",devisProduitsSchema)
    }
})();