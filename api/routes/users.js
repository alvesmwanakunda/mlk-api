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
        
      //   app.route('/signup')
      //      .post(Ctrl.signupUser);

        app.route('/signup/particulier')
           .post(Ctrl.signupUserParticulier);

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

      app.route('/employe/all')
           .get(Ctrl.getAdminAndAgent);

      app.route('/employe')
           .get(Ctrl.allEmploye)
           .post(Ctrl.addEmploye);

      app.route('/employe/:id([a-fA-F\\d]{24})')
           .get(Ctrl.getEmploye)
           .put(Ctrl.updateEmploye);

      app.route('/transporteur')
         .post(Ctrl.addTransporteur)
         .get(Ctrl.allTransporteur);
      
      
      app.route('/update/idphone')
           .put(Ctrl.updateIdPhoneOrFcmToken);

      app.route('/delete/idphone/:id([a-fA-F\\d]{24})')
           .delete(Ctrl.deleteIdphone);
           
      app.route('/delete/fcmtoken/:id([a-fA-F\\d]{24})')
           .delete(Ctrl.deleteFcmToken);
      

      app.route('/active/employe/:id([a-fA-F\\d]{24})')
           .get(Ctrl.activeEmploye)

      app.route('/dissable/employe/:id([a-fA-F\\d]{24})')
           .get(Ctrl.dissableEmploye)
   
      // Verifiy Google Credentials for authentication
      app.route('/auth/google')
         .post(Ctrl.googleAuth);
      
      app.route('/signup/particulier/google')
         .post(Ctrl.googleSignup);

      app.route('/auth/linkedin')
         .post(Ctrl.linkedInAuth);

      app.route('/signup/particulier/linkedin')
         .post(Ctrl.linkedInSignup);
      
      app.route('/update/profil/a2f')
         .put(Ctrl.updateA2FAuthentication);

      app.route('/verify/a2f/authentication')
         .post(Ctrl.verifyA2FAuthentication);
      
      app.route('/resend/authentication/code')
         .post(Ctrl.resendAuthenticationEmailCode);
    }

})();