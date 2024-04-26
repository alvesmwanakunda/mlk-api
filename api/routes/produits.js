(function(){
   "use strict";
   module.exports = function(app,acl){
    var Ctrl = require('../controller/produits.controller')(acl);

    app.route('/add/produit')
    .post(Ctrl.addProduit)

    app.route('/produits')
      .get(Ctrl.getProduits)

   app.route('/produit/:id')
      .get(Ctrl.getProduit)

   app.route('/images/produit/:id')
      .get(Ctrl.getImagesProduit)

    app.route('/categories')
    .get(Ctrl.getAllCategories)

    app.route('/manufacturers')
    .get(Ctrl.getAllManufactures)

    app.route('/suppliers')
    .get(Ctrl.getAllSuppliers)
   }
})();