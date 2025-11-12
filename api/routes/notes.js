(function(){
   "use strict";
    module.exports = function(app,acl){
        var Ctrl = require('../controller/noteModule.controller')(acl);
        var upload = require("../../middlewares/upload")

        app.post('/module/note/:id([a-fA-F\\d]{24})', upload.fields([{ name: 'audio' }, { name: 'image' }]), Ctrl.create);
        app.get('/module/note/:id([a-fA-F\\d]{24})', Ctrl.getAllNoteModule);
        app.get('/module/note/single/:id([a-fA-F\\d]{24})', Ctrl.getNote);
        app.put('/module/note/:id([a-fA-F\\d]{24})', upload.fields([{ name: 'audio' }, { name: 'image' }]), Ctrl.update);
        app.delete('/module/note/:id([a-fA-F\\d]{24})', Ctrl.delete);

    }
})();