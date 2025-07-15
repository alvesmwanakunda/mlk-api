(function(){

    "use strict";
 
    var mongoose = require("mongoose");
    var Schema = mongoose.Schema;

     var tacheSchema = new Schema({

        titre:{
            type:String,
            required: false
        },

        projet:{
            type:Schema.ObjectId,
            ref:"Projets",
            required:true
        },

        temps:{
            type:String,
            required: false,
            match: /^([01]\d|2[0-3]):([0-5]\d)$/  // Validation pour le format HH:mm
        },

        assignes:{
            type:Schema.ObjectId,
            ref:"Users",
            required:false
        },

        date_debut:{
            type:Date,
            required: false,
        },

        date_fin:{
            type:Date,
            required: false,
        },

        description:{
            type:String,
            required: false
        },

        statut: {
            type: String,
            enum: ['A Faire', 'En Cours', 'Terminer'],
            default: 'A Faire'
        },

        date_creation: { type: Date, default: Date.now }

     });
      module.exports = {
        tacheSchema: tacheSchema,
        TacheModel: mongoose.model('Taches',tacheSchema)
     }

})();