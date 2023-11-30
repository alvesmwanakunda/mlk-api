(function(){
    "use strict";

    var mongoose = require('mongoose');
    var Schema = mongoose.Schema;

    var facturesSchema = new Schema({

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
        chemin: {
            type: String,
            required: false
        },
        facture: {
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
        FacturesSchema: facturesSchema,
        FacturesModel: mongoose.model("Factures",facturesSchema)
    }
})();