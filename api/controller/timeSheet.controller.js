(function(){
   "use strict";
   var TimeSheet = require('../models/timesheet.model').TimeSheetModel;
   var ObjectId = require('mongoose').Types.ObjectId;
   const monthNames = [
    'Janvier', 'Février', 'Mars', 'Avril', 'Mai', 'Juin',
    'Juillet', 'Août', 'Septembre', 'Octobre', 'Novembre', 'Décembre'
  ];

   module.exports = function(acl){
    return{
        addTimeSheet(req,res){
            acl.isAllowed(req.decoded.id,'agenda', 'create', async function(err,aclres){
                if(aclres){
                    var timeSheet = new TimeSheet(req.body);
                    timeSheet.user = req.params.id;
                    timeSheet.save().then((time)=>{
                            res.json({
                                success:true,
                                message:time
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
        updsteTimeSheet(req,res){
            acl.isAllowed(req.decoded.id,'agenda', 'create', async function(err,aclres){
                if(aclres){
                    TimeSheet.findOneAndUpdate({_id:req.params.id},req.body,{new:true}).then((conge)=>{
                        res.json({
                            success:true,
                            message:conge
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
        deleteTimeSheet(req,res){
            acl.isAllowed(req.decoded.id,'agenda', 'delete', async function(err,aclres){

                if(aclres){

                    let timesheet = await TimeSheet.findOne({_id:req.params.id});
                    timesheet.deleteOne().then((conge)=>{
                        res.json({
                            success: true,
                            message:conge
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
        getAllTimeSheet(req,res){
            acl.isAllowed(req.decoded.id,'agenda', 'retreive', async function(err,aclres){
                if(aclres){
                    TimeSheet.find({user:req.params.id}).then((time)=>{
                        res.json({
                            success: true,
                            message:time
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
        getTimeSheet(req,res){
            acl.isAllowed(req.decoded.id,'agenda', 'retreive', async function(err,aclres){

                if(aclres){
                    TimeSheet.findOne({_id:req.params.id}).populate('user').then((conge)=>{
                        res.json({
                            success: true,
                            message:conge
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
        getAllTimeSheetByUser(req,res){
            acl.isAllowed(req.decoded.id,'agenda', 'retreive', async function(err,aclres){

                if(aclres){
                    try {
                        const timesheets = await TimeSheet.aggregate([
                            { $match: { user: new ObjectId(req.params.id)} },
                            {
                              $group: {
                                _id: { year: { $year: '$createdAt' }, month: { $month: '$createdAt' } },
                                timesheets: { $push: '$$ROOT' },
                              },
                            },
                            {
                              $sort: { '_id.year': -1, '_id.month': -1 }
                            }
                        ]);
                        const formattedTimesheets = timesheets.map(item => ({
                            month: monthNames[item._id.month - 1], // Utilise le nom du mois
                            year: item._id.year,
                            monthChiffre:item._id.month
                        }));
                        //timesheets: item.timesheets
                        res.json({
                            success: true,
                            message:formattedTimesheets
                        });  
                    } catch (error) {
                        return res.status(500).json({
                            success:false,
                            message:error.message
                        })
                    }

                }else{
                    return res.status(401).json({
                        success: false,
                        message: "401"
                    });
                }
            })
        },
        getAllTimeSheetUserByDate(req,res){
            acl.isAllowed(req.decoded.id,'agenda', 'retreive', async function(err,aclres){

                if(aclres){
                    try {
                        const year = parseInt(req.params.year);
                        const month = parseInt(req.params.month);
                        /*const timesheets = await TimeSheet.aggregate([
                            { $match: { 
                                user: new ObjectId(req.params.id),
                                createdAt: {
                                    $gte: new Date(year, month - 1, 1),
                                    $lt: new Date(year, month, 1)
                                }  
                              }
                            },
                            {
                              $group: {
                                _id: { year: { $year: '$createdAt' }, month: { $month: '$createdAt' }, day: { $dayOfMonth: '$createdAt' } },
                                timesheets: { $push: '$$ROOT' },
                              },
                            },
                            {
                              $sort: { '_id.day': 1 }
                            }
                        ]);
                         const formattedTimesheets = timesheets.map(item => ({
                            date: `${item._id.day} ${monthNames[item._id.month - 1]} ${item._id.year}`,
                            timesheets: item.timesheets
                        }));
                        
                        */
                        const timesheets = await TimeSheet.find({
                            user: new ObjectId(req.params.id),
                            createdAt: {
                              $gte: new Date(year, month - 1, 1),
                              $lt: new Date(year, month, 1)
                            }
                          }).sort({ createdAt: 1 });
                       
                        res.json({
                            success: true,
                            message:timesheets
                        });  
                    } catch (error) {
                        return res.status(500).json({
                            success:false,
                            message:error.message
                        })
                    }

                }else{
                    return res.status(401).json({
                        success: false,
                        message: "401"
                    });
                }
            })
        },
        // TimeSheet for user agent
        getAllTimeSheetByAgent(req,res){
            acl.isAllowed(req.decoded.id,'agenda', 'retreive', async function(err,aclres){

                if(aclres){
                    try {
                        const timesheets = await TimeSheet.aggregate([
                            { $match: { user: new ObjectId(req.decoded.id)} },
                            {
                              $group: {
                                _id: { year: { $year: '$createdAt' }, month: { $month: '$createdAt' } },
                                timesheets: { $push: '$$ROOT' },
                              },
                            },
                            {
                              $sort: { '_id.year': -1, '_id.month': -1 }
                            }
                        ]);
                        const formattedTimesheets = timesheets.map(item => ({
                            month: monthNames[item._id.month - 1], // Utilise le nom du mois
                            year: item._id.year,
                            monthChiffre:item._id.month
                        }));
                        //timesheets: item.timesheets
                        res.json({
                            success: true,
                            message:formattedTimesheets
                        });  
                    } catch (error) {
                        return res.status(500).json({
                            success:false,
                            message:error.message
                        })
                    }

                }else{
                    return res.status(401).json({
                        success: false,
                        message: "401"
                    });
                }
            })
        },
        getAllTimeSheetAgentByDate(req,res){
            acl.isAllowed(req.decoded.id,'agenda', 'retreive', async function(err,aclres){

                if(aclres){
                    try {
                        const year = parseInt(req.params.year);
                        const month = parseInt(req.params.month);
                        const timesheets = await TimeSheet.find({
                            user: new ObjectId(req.decoded.id),
                            createdAt: {
                              $gte: new Date(year, month - 1, 1),
                              $lt: new Date(year, month, 1)
                            }
                          }).sort({ createdAt: 1 });
                       
                        res.json({
                            success: true,
                            message:timesheets
                        });  
                    } catch (error) {
                        return res.status(500).json({
                            success:false,
                            message:error.message
                        })
                    }

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