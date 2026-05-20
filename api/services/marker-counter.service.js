var MarkerCounter = require('../models/markerCounter.model').MarkerCounterModel;

module.exports={

getNextMarkerNumber: async (plan)=> {
  const counter = await MarkerCounter.findOneAndUpdate(
    { plan },
    { $inc: { lastNumber: 1 } },
    { new: true, upsert: true }
  );

  const markerNumber = counter.lastNumber;
  const markerCode = `MK-${String(markerNumber).padStart(3, '0')}`;

  return { markerNumber, markerCode };
}

}
