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
        

  

    }

})();