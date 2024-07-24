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
    createdAt : {
        type: Date,
        require: true,
    },
    tache : {
        type: String,
        require: true,
    },
    heure:{
        type:Number,
        require:true
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
   });
   module.exports = {
    timeSheetSchema: timeSheetSchema,
    TimeSheetModel: mongoose.model('TimeSheet',timeSheetSchema)
   }
})();