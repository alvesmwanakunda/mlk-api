(function(){

    "use strict";
 
    var mongoose = require("mongoose");
    var Schema = mongoose.Schema; 

    var historiqueTacheSchema = new Schema({
        description: { type: String },
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