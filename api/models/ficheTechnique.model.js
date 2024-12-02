(function(){

    "use strict";

    var mongoose = require('mongoose');
    var Schema = mongoose.Schema;

    var ficheTechniqueSchema = new Schema({

        description: {
            type: String,
            required: false
        },
        createdAt:{
            type: Date,
            required: false
        }
    });
    module.exports = {
        FicheTechniqueSchema: ficheTechniqueSchema,
        FicheTechniqueModel: mongoose.model("FicheTechniques",ficheTechniqueSchema)
      }

})();