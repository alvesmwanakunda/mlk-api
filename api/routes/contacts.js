(function (){
    'use strict';
    module.exports = function(app,acl){
        var Ctrl = require('../controller/contacts.controller')(acl);

    
        app.route('/contact')
           .get(Ctrl.getAllContact)
           .post(Ctrl.addContact)

         app.route('/contact/entreprise/:id([a-fA-F\\d]{24})')
           .post(Ctrl.addContactByEntreprise)

        app.route('/contact/:id([a-fA-F\\d]{24})')
           .get(Ctrl.getContact)
           .delete(Ctrl.deleteContact)
           .put(Ctrl.updateContact)

         app.route('/contact/projet/:id([a-fA-F\\d]{24})')
           .get(Ctrl.getAllContactByProjet)

         app.route('/contact/entreprise/:id([a-fA-F\\d]{24})')
           .get(Ctrl.getAllContactByEntreprise)

        app.route('/contact/addProjet/:id([a-fA-F\\d]{24})')
           .put(Ctrl.addContactToProjet)


    }

})();