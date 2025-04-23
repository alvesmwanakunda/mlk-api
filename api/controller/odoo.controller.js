(function(){
    "use strict";
    var Entreprise = require('../models/entreprises.model').EntrepriseModel;
    var contactService = require('../services/contact.service');


    module.exports = function(acl){
        return{

            async addFournisseurEntreprise(req,res,next){

                var entreprise = new Entreprise();
                entreprise.societe = req.body.name;
                entreprise.email = req.body.email;
                entreprise.postal= req.body.zip;
                entreprise.rue= req.body.street;
                entreprise.numero= req.body.city;
                entreprise.adresse= req.body.adresse;
                entreprise.indicatif = req.body.indicatif;
                entreprise.telephone =  req.body.phone;
                entreprise.type_entreprise = req.body.x_type_entreprise;
                entreprise.source = req.body.x_source;
                entreprise.categorie_societe = req.body.x_categorie_societe;
                entreprise.company_id = req.body.id;
                entreprise.numero_fournisseur = req.body.numero_fournisseur;
                entreprise.pays = req.body.country;

                entreprise.save().then((entreprise)=>{
                    res.json({
                        success:true,
                        entreprise: entreprise
                    });
                }).catch((error)=>{
                    return res.status(500).json({
                        success:false,
                        message: error.message
                    })
                })
            },

            async addContactParticulier(req, res) {
                try {
                    let result;
                    if (req.body.parent_id) {
                        let entreprise = await Entreprise.findOne({ company_id: req.body.parent_id });
                        if (!entreprise) {
                            return res.status(404).json({ 
                                success: false, 
                                message: "Entreprise non trouvée" 
                            });
                        }
                        result = await contactService.createContactEntreprise(entreprise, req.body);
                    } else {
                        result = await contactService.createContact(req.body);
                    }

                    res.status(200).json({
                        success: result.success,
                        message: result.message,
                        user: result.user
                    });

                } catch (error) {
                    console.error("Erreur dans addContactParticulier:", error);
                    res.status(500).json({
                        success: false,
                        message: error.message || "Une erreur est survenue"
                    });
                }
            },

        }
    }

})();