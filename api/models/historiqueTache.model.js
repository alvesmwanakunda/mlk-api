(function(){

    "use strict";
 
    var mongoose = require("mongoose");
    var Schema = mongoose.Schema; 

    var historiqueTacheSchema = new Schema({
        description: { type: String },
        originalDescription: {
            type: String,
            required: false
        },
        descriptionSourceLanguage: {
            type: String,
            required: false
        },
        descriptionTranslations: {
            type: Map,
            of: String,
            default: {}
        },
        descriptionTranslation: {
            provider: String,
            status: String,
            translatedAt: Date,
            baseLanguage: String,
            error: String
        },
        user:{
            type:Schema.ObjectId,
            ref:"Users",
            required:false
        },
        tache:{
            type:Schema.ObjectId,
            ref:"Taches",
            required:true
        },
        date_creation: { type: Date, default: Date.now },
     });
      module.exports = {
        historiqueTacheSchema: historiqueTacheSchema,
        HistoriqueTacheModel: mongoose.model('HistoriqueTask',historiqueTacheSchema)
     }
})();