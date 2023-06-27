(function (){
    'use strict';
    module.exports = function(app,acl){
        var Ctrl = require('../controller/users.controller')(acl);

        app.route('/auth')
           .post(Ctrl.auth);

        app.route('/register')
           .post(Ctrl.signup)

    }

})();