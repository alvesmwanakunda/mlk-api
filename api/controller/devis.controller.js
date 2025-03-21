(function(){
    "use strict";
    var Devis = require('../models/devis.model').DevisModel;
    var DevisProduit = require('../models/devisProduits.model').DevisProduitsModel;
    var User = require('../models/users.model').UserModel;
    var codes = require('voucher-code-generator');
    var nodemailer = require('nodemailer');
    var fs = require('fs');




    module.exports=function(acl){

        return{
             create:function(req,res){
                acl.isAllowed(req.decoded.id,'box', 'create', async function(err,aclres){

                    if(aclres){

                        try {

                            const currentYear = new Date().getFullYear();
                            const generatedCode = `D${currentYear}00`;
                            var code = codes.generate({
                                length: 2,
                                count: 1,
                                charset: "0123456789"
                            });
                            code = code[0];

                            let devis = new Devis();
                            devis.dateLastUpdate=new Date();
                            devis.numero=generatedCode+""+code; 
                            devis.entreprise=req.body.entreprise;  
                            devis.total = req.body.total;  
                            devis.isPrestation = req.body.isPrestation; 
                                              
                            if(req.body.projet){
                                devis.projet=req.body.projet;
                            }
                            const newDevis = await devis.save();
                            const produitsData = req.body.produits;
                            const produitsAssocies = produitsData.map(produit=>({
                                devis:newDevis._id,
                                ...produit
                            }));
                            const produitsEnregistres = await DevisProduit.insertMany(produitsAssocies);
                            return res.status(200).json({
                                success: true,
                                message: "Devis et produits enregistrés avec succès",
                                devis: newDevis,
                                produits: produitsEnregistres
                            }); 
                        } catch (error) {
                            console.error(error);
                            return res.status(500).json({
                                success: false,
                                message: "Erreur lors de l'enregistrement du devis et des produits"
                            }); 
                        }
                    }else{
                        return res.status(401).json({
                            success: false,
                            message: "401"
                        });  
                    }
                })

             },

             update:function(req,res){
                acl.isAllowed(req.decoded.id,'box', 'create', async function(err,aclres){

                    if(aclres){

                        try {

                            let devis = await Devis.findOne({_id:req.params.id});
                            devis.dateLastUpdate=new Date();
                            devis.total=req.body.total;


                            const newDevis = await Devis.findByIdAndUpdate({_id:req.params.id},devis, { new: true });

                            if(req.body.produits){
                                const produitsData = req.body.produits;
                                const produitsAssocies = produitsData.map(produit=>({
                                    devis:req.params.id,
                                    ...produit
                                }));
                                const produitsEnregistres = await DevisProduit.insertMany(produitsAssocies);
                            }
                            return res.status(200).json({
                                success: true,
                                message: "Devis et produits enregistrés avec succès",
                                devis: newDevis,
                            }); 
                        } catch (error) {
                            console.error(error);
                            return res.status(500).json({
                                success: false,
                                message: "Erreur lors de l'enregistrement du devis et des produits"
                            }); 
                        }

                    }else{
                        return res.status(401).json({
                            success: false,
                            message: "401"
                        });  
                    }
                })

             },

             updateFacture:function(req,res){
                acl.isAllowed(req.decoded.id,'box', 'create', async function(err,aclres){
                    if(aclres){

                        let devis = await Devis.findOne({_id:req.params.id});
                        devis.isFacture=req.body.facture;

                        Devis.findByIdAndUpdate({_id:req.params.id},devis, { new: true }).then((devis)=>{
                            res.json({
                                success: true,
                                message:devis
                            });
                        }).catch((error)=>{
                            return res.status(500).json({
                                success:false,
                                message:error.message
                            })
                        })
                    }else{
                        return res.status(401).json({
                            success: false,
                            message: "401"
                        });  
                    }
                })
             },

             updateSignature:function(req,res){
                acl.isAllowed(req.decoded.id,'box', 'create', async function(err,aclres){
                    if(aclres){

                        let devis = await Devis.findOne({_id:req.params.id});
                        devis.signature=req.body.signature;

                        Devis.findByIdAndUpdate({_id:req.params.id},devis, { new: true }).then((devis)=>{
                            res.json({
                                success: true,
                                message:devis
                            });
                        }).catch((error)=>{
                            return res.status(500).json({
                                success:false,
                                message:error.message
                            })
                        })
                    }else{
                        return res.status(401).json({
                            success: false,
                            message: "401"
                        });  
                    }
                })
             },

             delete:function(req,res){
                acl.isAllowed(req.decoded.id,'box', 'create', async function(err,aclres){

                    if(aclres){

                        let devis= await Devis.findOne({_id:req.params.id});
                        devis.deleteOne().then((module)=>{
                            res.json({
                                success: true,
                                message:module
                            });
                        }).catch((error)=>{
                            return res.status(500).json({
                                success:false,
                                message:error.message
                            })
                        })
                    }else{
                        return res.status(401).json({
                            success: false,
                            message: "401"
                        });  
                    }
                })

             },

             getDevis:function(req,res){
                acl.isAllowed(req.decoded.id,'box', 'create', async function(err,aclres){

                    if(aclres){
                        Devis.findOne({_id:req.params.id}).populate("projet").populate("entreprise").then((module)=>{
                            res.json({
                                success: true,
                                message:module
                            });
                        }).catch((error)=>{
                            return res.status(500).json({
                                success:false,
                                message:error.message
                            })
                        })
                    }else{
                        return res.status(401).json({
                            success: false,
                            message: "401"
                        });  
                    }
                })

             },

             getAllDevis:function(req,res){
                acl.isAllowed(req.decoded.id,'box', 'create', async function(err,aclres){

                    if(aclres){
                        Devis.find().populate("projet").then((module)=>{
                            res.json({
                                success: true,
                                message:module
                            });
                        }).catch((error)=>{
                            return res.status(500).json({
                                success:false,
                                message:error.message
                            })
                        })
                    }else{
                        return res.status(401).json({
                            success: false,
                            message: "401"
                        });  
                    }
                })

             },

             getAllDevisEntreprise:function(req,res){
                acl.isAllowed(req.decoded.id,'box', 'create', async function(err,aclres){

                    if(aclres){
                        Devis.find({entreprise:req.params.id}).populate("projet").then((module)=>{
                            res.json({
                                success: true,
                                message:module
                            });
                        }).catch((error)=>{
                            return res.status(500).json({
                                success:false,
                                message:error.message
                            })
                        })
                    }else{
                        return res.status(401).json({
                            success: false,
                            message: "401"
                        });  
                    }
                })

             },

             getAllDevisByProjet:function(req,res){
                acl.isAllowed(req.decoded.id,'box', 'create', async function(err,aclres){

                    if(aclres){
                        Devis.find({projet:req.params.id}).populate("projet").then((module)=>{
                            res.json({
                                success: true,
                                message:module
                            });
                        }).catch((error)=>{
                            return res.status(500).json({
                                success:false,
                                message:error.message
                            })
                        })
                    }else{
                        return res.status(401).json({
                            success: false,
                            message: "401"
                        });  
                    }
                })

             },

             // Devis Facture

             getAllFactureDevis:function(req,res){
                acl.isAllowed(req.decoded.id,'box', 'create', async function(err,aclres){

                    if(aclres){
                        Devis.find({isFacture:true}).populate("projet").then((module)=>{
                            res.json({
                                success: true,
                                message:module
                            });
                        }).catch((error)=>{
                            return res.status(500).json({
                                success:false,
                                message:error.message
                            })
                        })
                    }else{
                        return res.status(401).json({
                            success: false,
                            message: "401"
                        });  
                    }
                })

             },

             getAllDevisFactureEntreprise:function(req,res){
                acl.isAllowed(req.decoded.id,'box', 'create', async function(err,aclres){

                    if(aclres){
                        Devis.find({entreprise:req.params.id,isFacture:true}).populate("projet").then((module)=>{
                            res.json({
                                success: true,
                                message:module
                            });
                        }).catch((error)=>{
                            return res.status(500).json({
                                success:false,
                                message:error.message
                            })
                        })
                    }else{
                        return res.status(401).json({
                            success: false,
                            message: "401"
                        });  
                    }
                })

             },

             getAllDevisFactureByProjet:function(req,res){
                acl.isAllowed(req.decoded.id,'box', 'create', async function(err,aclres){

                    if(aclres){
                        Devis.find({projet:req.params.id,isFacture:true}).populate("projet").then((module)=>{
                            res.json({
                                success: true,
                                message:module
                            });
                        }).catch((error)=>{
                            return res.status(500).json({
                                success:false,
                                message:error.message
                            })
                        })
                    }else{
                        return res.status(401).json({
                            success: false,
                            message: "401"
                        });  
                    }
                })

             },

             sendDevis:function(req,res){

                acl.isAllowed(req.decoded.id,'box', 'create', async function(err,aclres){
                    if(aclres){

                        let body = req.body.message;
                        //let doc = req.file.buffer;
                        let user = await User.findOne({_id:req.decoded.id});
                        let devis = await Devis.findOne({_id:req.params.id});
                        let path="./public/"+devis.numero+".pdf";

                        fs.readFile(path, (err, data) => {
                            if (err) {
                              console.error('Erreur lors de la lecture du fichier PDF', err);
                              return res.status(500).json({
                                success: false,
                                message: 'Erreur lors de la lecture du fichier PDF'
                              });
                            }
                            try {

                                let transporter = nodemailer.createTransport({
                                    host: process.env.SMTP_SERVER,
                                    port: process.env.SMTP_PORT,
                                    secure:false,
                                    tls:true,
                                    auth:{
                                        user:process.env.SMTP_USERNAME,
                                        pass:process.env.SMTP_PASSWORD
                                    },
                                    logger: false,
                                    debug: false
                                },{
                                    from: 'MLKA <' + process.env.SMTP_FROM + '>',
                                    headers:{
                                        'X-Laziness-level':1000
                                    }
                                });
                                let message = {
                                    to:'contact@mlka.fr',
                                    subject: 'Demande de devis',
                                    html: body,
                                    attachments: [
                                        {
                                          filename:devis.numero+".pdf",
                                          content: data
                                        }
                                      ]
                                };
                                transporter.sendMail(message, (error, user)=>{
                                    if(error){
                                        return res.status(500).json({
                                            success:false,
                                            message:error.message
                                        })
                                    }else{
                                        res.json({
                                            success: true,
                                            message:user
                                        });
                                    }
                                    transporter.close();
                                    fs.unlink(path,(err)=>{
                                        if(err){
                                            console.error(err)
                                            return
                                        }
                                    })
                                });
                                
                            } catch (error) {
                                fs.unlink(path,(err)=>{
                                    if(err){
                                        console.error(err)
                                        return
                                    }
                                })
                                return res.status(500).json({
                                    success:false,
                                    message:error.message
                                })
                                
                            }

                        });
                    }else{
                        return res.status(401).json({
                            success: false,
                            message: "401"
                        });  
                    }
                })
             }
        }
    }
})();