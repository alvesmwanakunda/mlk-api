const { admin } = require('../../firebase-config');

module.exports={

    sendNotification:(fcmToken, title, body)=>{
        return new Promise (async(resolve, reject)=>{
 
            try {
                if (fcmToken) {
                    const message = {
                        token: fcmToken,
                        notification: {
                            title: title,
                            body: body
                        }
                    };
                    await admin.messaging().send(message);
                    console.log('Notification envoyée avec succès');
                }
            } catch (error) {
                console.error('Erreur envoi notif:', error);
            }
        });
    }, 
}