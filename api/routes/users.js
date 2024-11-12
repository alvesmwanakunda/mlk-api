(function (){
    'use strict';
    module.exports = function(app,acl){
        var Ctrl = require('../controller/users.controller')(acl);

        app.route('/auth')
           .post(Ctrl.auth);

        app.route('/register')
           .post(Ctrl.signup)

        app.route('/reset')
           .post(Ctrl.resetPassword);

        app.route('/reset/password')
           .post(Ctrl.changePassword);
        
        app.route('/signup')
           .post(Ctrl.signupUser);

       app.route('/signup/odoo')
           .post(Ctrl.addCompany);

        app.route('/check-email/:email')
           .get(Ctrl.userExist);
        
        app.route('/update/profil')
           .put(Ctrl.updateProfil);

       app.route('/update/profil/password')
           .put(Ctrl.updatePassword);

      // 

      app.route('/users')
           .get(Ctrl.allUser);

      app.route('/employe')
           .get(Ctrl.allEmploye)
           .post(Ctrl.addEmploye);

      app.route('/employe/:id([a-fA-F\\d]{24})')
           .get(Ctrl.getEmploye)
           .put(Ctrl.updateEmploye);

      app.route('/update/idphone')
           .put(Ctrl.updateIdPhone);

      app.route('/active/employe/:id([a-fA-F\\d]{24})')
           .get(Ctrl.activeEmploye)

      app.route('/dissable/employe/:id([a-fA-F\\d]{24})')
           .get(Ctrl.dissableEmploye)
   
        

  

    }

})();