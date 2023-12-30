(function(){
    "use strict";

    var mongoose = require('mongoose');
    var Schema = mongoose.Schema;

    var facturesSchema = new Schema({

        numero: {
            type: String,
            required: false
        },

        devis: {
            type: Schema.ObjectId,
            ref: 'Devis',
            required: false
        },
        
        dateLastUpdate: {
            type: Date,
            required: true
        },
        
    });
    module.exports = {
        FacturesSchema: facturesSchema,
        FacturesModel: mongoose.model("Factures",facturesSchema)
    }
})();