(function(){

    "use strict";
 
    var mongoose = require("mongoose");
    var Schema = mongoose.Schema;

     var timesheetSchema = new Schema({

        date: { type: Date, required: true },
        employee: {
            type:Schema.ObjectId,
            ref:"Users",
            required:true
        },
        user:{
            type:Schema.ObjectId,
            ref:"Users",
            required:false
        },
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
     }/*{
            // Assurez-vous que cette option n'est pas désactivée
            autoCreate: true,
            autoIndex: true
    }*/);

      module.exports = {
        timesheetSchema: timesheetSchema,
        TimesheetTaskModel: mongoose.model('TimesheetTask',timesheetSchema)
     }

})();