(function(){
    "use strict";

    var mongoose = require('mongoose');
    var Schema = mongoose.Schema;

    var devisSchema = new Schema({

        nom: {
            type: String,
            required: false
        },
        numero: {
            type: String,
            required: false
        },
        projet: {
            type: Schema.ObjectId,
            ref: 'Projets',
            required: false
        },
        dateLastUpdate: {
            type: Date,
            required: true
        },
        devis: {
            type: String,
            required: false
        },
        chemin: {
            type: String,
            required: false
        },
        extension: {
            type: String,
            required: true
        },
        size: {
            type: Number,
            required: false
        },
    });
    module.exports = {
        DevisSchema: devisSchema,
        DevisModel: mongoose.model("Devis",devisSchema)
    }
})();