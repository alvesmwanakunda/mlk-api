(function(){
   'use strict';
   var mongoose = require('mongoose');
   var Schema = mongoose.Schema;

   var timeSheetSchema = new Schema({
    user:{
        type:Schema.ObjectId,
        ref:"Users",
        required:false
    },
    responsable:{
        type:Schema.ObjectId,
        ref:"Users",
        required:false
    },
    createdAt : {
        type: Date,
        require: true,
    },
    tache : {
        type: String,
        require: false,
    },
    heure:{
        type:Number,
        require:false
    },
    minute:{
       type: Number,
       require:false
    },
    status:{
        type:String,
        required: false
    },
    deplacement:{
       type:String,
       required: false
    },
    projet:{
        type:String,
        required: false
    },
    motifs:{
        type:String,
        required: false,
    },
    types_deplacement:{
        type:String,
        required: false
    },
    presence:{
        type:String,
        required: false
    },
    heureDebut: {
        type: String,
        required: false,
        match: /^([01]\d|2[0-3]):([0-5]\d)$/  // Validation pour le format HH:mm
      },
    heureFin: {
        type: String,
        required: false,
        match: /^([01]\d|2[0-3]):([0-5]\d)$/  // Validation pour le format HH:mm
      },
    pause: {
        type: String,
        required: false,
        match: /^([01]\d|2[0-3]):([0-5]\d)$/  // Validation pour le format HH:mm
      },
    localisation:{
        type:String,
        required: false
      },
   });
   module.exports = {
    timeSheetSchema: timeSheetSchema,
    TimeSheetModel: mongoose.model('TimeSheet',timeSheetSchema)
   }
})();