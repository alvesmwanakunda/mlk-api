(function(){

    "use strict";
 
    var mongoose = require("mongoose");
    var Schema = mongoose.Schema;

     var timesheetSchema = new Schema({

        date: { type: Date, required: true },
        employee: { type: String, required: true },
        description: { type: String },
        hours:{
            type:String,
            required: false,
            match: /^([01]\d|2[0-3]):([0-5]\d)$/  // Validation pour le format HH:mm
        },
        date_creation: { type: Date, default: Date.now },
        tache:{
            type:Schema.ObjectId,
            ref:"Taches",
            required:true
        },
     });
      module.exports = {
        timesheetSchema: timesheetSchema,
        TimesheetTaskModel: mongoose.model('TimesheetTask',timesheetSchema)
     }

})();