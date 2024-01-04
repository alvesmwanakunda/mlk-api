(function(){
    "use strict";

    var mongoose = require('mongoose');
    var Schema = mongoose.Schema;

    var historiqueModulesSchema = new Schema({

        observation: {
            type: String,
            required: false
        },
        duree: {
            type: Date,
            required: false
        },
        /*entreprise: {
            type: Schema.ObjectId,
            ref: 'Entreprises',
            required: false
        },*/
        user: {
            type: Schema.ObjectId,
            ref: 'Users',
            required: false
        },
        module: {
            type: Schema.ObjectId,
            ref: 'Modules',
            required: false
        },
        dateLastUpdate:{
            type: Date,
            required: false,
        }

    });
    module.exports = {
        HistoriqueModulesSchema: historiqueModulesSchema,
        HistoriqueModulesModel: mongoose.model("HistoriqueModules",historiqueModulesSchema)
      }

})();