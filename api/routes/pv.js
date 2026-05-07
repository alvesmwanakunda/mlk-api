(function(){
  "use strict";
  module.exports =  function(app,acl){
     var Ctrl = require('../controller/pvReception.controller')(acl);
     var upload = require("../../middlewares/upload")

    app.post('/pv/create/:id([a-fA-F\\d]{24})', upload.fields([{ name: 'reservePhotos' },{ name: 'reserveLevee' },{name: 'planTravaux'}]), Ctrl.createPV);
    app.put('/pv/update/:id([a-fA-F\\d]{24})', upload.fields([{ name: 'reservePhotos' },{ name: 'reserveLevee' },{name: 'planTravaux'}]), Ctrl.updatePV);
    app.post('/pv-receptions/:id/revision', upload.fields([{ name: 'reservePhotos'},{ name: 'reserveLevee' }]),Ctrl.leveeReserve);
    app.route('/pv/:id([a-fA-F\\d]{24})')
        .get(Ctrl.getPV)
        .delete(Ctrl.deletePV)

    app.route('/pv/all/:id([a-fA-F\\d]{24})')
        .get(Ctrl.getAllPVProjet)

    
  app.post('/pv/send-mail/:id([a-fA-F\\d]{24})', upload.fields([{ name: 'pvReception' }]), Ctrl.sendPvByMail);
  app.post('/pv/send-signature-request/:id([a-fA-F\\d]{24})', Ctrl.sendSignatureRequestToClient);
  app.post('/pv/validate-signature/:id([a-fA-F\\d]{24})', Ctrl.validateClientSignature);
  app.route('/pv/signature/:id([a-fA-F\\d]{24})').get(Ctrl.getPVForSignature)

  }
})();