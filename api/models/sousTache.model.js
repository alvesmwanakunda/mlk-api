(function(){

     "use strict";
 
    var mongoose = require("mongoose");
    var Schema = mongoose.Schema;

     var sousTacheSchema = new Schema({


        user:{
            type:Schema.ObjectId,
            ref:"Users",
            required:false
        },

        assignes:{
            type:Schema.ObjectId,
            ref:"Users",
            required:false
        },

        tache:{
            type:Schema.ObjectId,
            ref:"Taches",
            required:true
        },

        image: {
            url: String,       
            width: Number,
            height: Number
        },

        date_creation: { type: Date, default: Date.now },

        description:{
            type:String,
            required: false
        },
     });
      module.exports = {
        sousTacheSchema: sousTacheSchema,
        SousTacheModel: mongoose.model('SousTache',sousTacheSchema)
     }

})();