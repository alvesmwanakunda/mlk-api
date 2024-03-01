(function (){
    'use strict';
    module.exports = function(app,acl){
        var Ctrl = require('../controller/contacts.controller')(acl);

    
        app.route('/contact')
           .get(Ctrl.getAllContact)
           .post(Ctrl.addContact)

        app.route('/contact/:id([a-fA-F\\d]{24})')
           .get(Ctrl.getContact)
           .delete(Ctrl.deleteContact)
           .put(Ctrl.updateContact)
        
        app.route('/contact/adresse/:id([a-fA-F\\d]{24})')
           .put(Ctrl.updateContactAdresse)

        app.route('/contact/entreprise/:id([a-fA-F\\d]{24})')
           .get(Ctrl.getAllContactByEntreprise)

       // url adresse livraison

       app.route('/contact/livraison/:id([a-fA-F\\d]{24})')
           .get(Ctrl.getAdresseLivraison)
           .put(Ctrl.updateAdresseLivraison)
           .post(Ctrl.addAdresseLivraison)
          
       
       




    }

})();