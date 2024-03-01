var User = require('../models/users.model').UserModel; 


module.exports={

    updateEmailUser:(oldEmail, email)=>{
        return new Promise (async(resolve, reject)=>{
 
          let user = await User.findOne({email:oldEmail});
          user.email = email;
          if(user){
           
             User.findByIdAndUpdate({_id:user._id},user,{new:true}).then((res)=>{
                 resolve({
                     status:'success',
                     body:res
                 });
             }).catch((error)=>{
                  reject({
                     status:'error',
                     body:error.message
                  })
             })
          } 
        })
     }, 
}