(function(){
    "use strict";

    var mongoose = require('mongoose');
    var Schema = mongoose.Schema;

    var markerCounterSchema = new mongoose.Schema({
        plan: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'PlanProjet',
        required: true,
        unique: true
        },
        lastNumber: {
        type: Number,
        default: 0
        }
    },
    { timestamps: true }
    );
    module.exports = {
     MarkerCounterSchema: markerCounterSchema,
     MarkerCounterModel: mongoose.model('MarkerCounter', markerCounterSchema)
    }
})();
