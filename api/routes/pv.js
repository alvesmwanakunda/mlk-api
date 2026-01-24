(function(){
  "use strict";
  module.exports =  function(app,acl){
     var Ctrl = require('../controller/pvReception.controller')(acl);
     var upload = require("../../middlewares/upload")

    app.post('/pv/create/:id([a-fA-F\\d]{24})', upload.fields([{ name: 'reservePhotos' },{ name: 'reserveLevee' }]), Ctrl.createPV);
    app.put('/pv/update/:id([a-fA-F\\d]{24})', upload.fields([{ name: 'reservePhotos' },{ name: 'reserveLevee' }]), Ctrl.updatePV);
    app.post('/pv-receptions/:id/revision', upload.fields([{ name: 'reservePhotos'},{ name: 'reserveLevee' }]),Ctrl.leveeReserve);
    app.route('/pv/:id([a-fA-F\\d]{24})')
        .get(Ctrl.getPV)
        .delete(Ctrl.deletePV)

    app.route('/pv/all/:id([a-fA-F\\d]{24})')
        .get(Ctrl.getAllPVProjet)


  }
})();