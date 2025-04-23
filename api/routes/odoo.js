(function (){
    'use strict';
    module.exports = function(app,acl){
        var Ctrl = require('../controller/odoo.controller')(acl);

      app.route('/add/entreprise/fournisseur')
           .post(Ctrl.addFournisseurEntreprise)
      
      app.route('/add/particulier/fournisseur')
           .post(Ctrl.addContactParticulier)

   }

})();