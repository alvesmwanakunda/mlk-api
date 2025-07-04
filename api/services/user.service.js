var User = require('../models/users.model').UserModel; 
const axios = require('axios');


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

    getLinkedInUserInfos: async (code, redirect_uri)=>{
        return new Promise(async(resolve, reject)=>{

            const client_id = process.env.LINKEDIN_CLIENT_ID;
            const client_secret = process.env.LINKEDIN_CLIENT_SECRET;

            try {
                // 1. Échange le code contre un access_token
                const tokenRes = await axios.post('https://www.linkedin.com/oauth/v2/accessToken', null, {
                    params: {
                        grant_type: 'authorization_code',
                        code: code,
                        redirect_uri: redirect_uri,
                        client_id:client_id,
                        client_secret: client_secret
                    },
                    headers: {
                        'Content-Type': 'application/x-www-form-urlencoded'
                    }
                });

                const accessToken = tokenRes.data.access_token;

                // 2. Récupère les infos de l’utilisateur
                const userInfos = await axios.get('https://api.linkedin.com/v2/userinfo', {
                    headers: { Authorization: `Bearer ${accessToken}` }
                });
                
                if (userInfos.status == 200){
                    resolve({
                        success: true,
                        message: userInfos.data
                    })
                }else{
                    reject({
                        status: 500,
                        success: false,
                        message: userInfos.statusText
                    })
                }

            } catch (err) {
                console.error(err.response?.data || err.message);
                reject({ 
                    status: 500,
                    success:false,
                    message:err.response?.data || err.message
                });
            }
        })
    }
}