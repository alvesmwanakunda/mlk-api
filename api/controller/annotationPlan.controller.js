(function(){

     "use strict";
      var Plan = require('../models/annotationPlan.model').AnnotationPlanModel;

       module.exports = function(acl){
        return {

            addAnnotation(req, res, next) {
                acl.isAllowed(req.decoded.id, 'projets', 'create', async (err, aclres) => {
                    if (err) return res.status(500).json({ success: false, message: 'ACL error', error: err.message });
                    if (!aclres) return res.status(401).json({ success: false, message: "401" });

                    try {
                         
                        var plan = new Plan(req.body);
                        plan.createdBy = req.decoded.id;
                        plan.plan = req.params.plan;
                        plan.projet = req.params.projet;
                        plan.createdAt = new Date();

                        plan.save().then((plan)=>{
                                           
                            res.json({
                                success:true,
                                message:plan,
                            });

                            }).catch((error)=>{
                                return res.status(500).json({
                                    success:false,
                                    message:error.message
                                })
                        })
                    } catch (e) {
                    return res.status(500).json({ success: false, message: "Erreur addAnnotation", error: e.message });
                    }
                });
            },

            updateAnnotation(req, res, next) {
                acl.isAllowed(req.decoded.id, 'projets', 'create', async (err, aclres) => {
                    if (err) return res.status(500).json({ success: false, message: 'ACL error', error: err.message });
                    if (!aclres) return res.status(401).json({ success: false, message: "401" });

                    try {

                        let plan = await Plan.findOne({_id:req.params.id});

                        if(plan){
                            Plan.findOneAndUpdate({_id:req.params.id},req.body,{new:true}).then((plan)=>{
                                res.json({
                                    success:true,
                                    message:plan
                                });
                            }).catch((error)=>{
                                return res.status(500).json({
                                    success:false,
                                    message:error.message
                                })
                            })
                        }
                          
                    } catch (e) {
                    return res.status(500).json({ success: false, message: "Erreur addAnnotation", error: e.message });
                    }
                });
            },

            deleteAnnotation(req, res, next) {
                acl.isAllowed(req.decoded.id, 'projets', 'create', async (err, aclres) => {
                    if (err) return res.status(500).json({ success: false, message: 'ACL error', error: err.message });
                    if (!aclres) return res.status(401).json({ success: false, message: "401" });

                    try {

                        let plan = await Plan.findOne({_id:req.params.id});

                        if(plan){
                            plan.deleteOne().then((plan)=>{
                                res.json({
                                    success:true,
                                    message:plan
                                });
                            }).catch((error)=>{
                                return res.status(500).json({
                                    success:false,
                                    message:error.message
                                })
                            })
                        }   
                    } catch (e) {
                    return res.status(500).json({ success: false, message: "Erreur addAnnotation", error: e.message });
                    }
                });
            },

            getAnnotation(req, res, next) {
                acl.isAllowed(req.decoded.id, 'projets', 'create', async (err, aclres) => {
                    if (err) return res.status(500).json({ success: false, message: 'ACL error', error: err.message });
                    if (!aclres) return res.status(401).json({ success: false, message: "401" });

                    try {

                        Plan.findOne({_id:req.params.id}).then((plan)=>{
                            res.json({
                                success:true,
                                message:plan
                            });
                        }).catch((error)=>{
                            return res.status(500).json({
                                success:false,
                                message:error.message
                            })
                        })
                          
                    } catch (e) {
                    return res.status(500).json({ success: false, message: "Erreur addAnnotation", error: e.message });
                    }
                });
            },

            getAllAnnotationByProjetPlan(req, res, next) {
                acl.isAllowed(req.decoded.id, 'projets', 'create', async (err, aclres) => {
                    if (err) return res.status(500).json({ success: false, message: 'ACL error', error: err.message });
                    if (!aclres) return res.status(401).json({ success: false, message: "401" });

                    try {

                        Plan.find({plan:req.params.plan,projet:req.params.projet}).then((plan)=>{
                            res.json({
                                success:true,
                                message:plan
                            });
                        }).catch((error)=>{
                            return res.status(500).json({
                                success:false,
                                message:error.message
                            })
                        })
                          
                    } catch (e) {
                    return res.status(500).json({ success: false, message: "Erreur addAnnotation", error: e.message });
                    }
                });
            },

        }
       };
})();