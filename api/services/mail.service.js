var nodemailer = require('nodemailer');
var ObjectId = require('mongoose').Types.ObjectId;


module.exports={


    reset:(user)=>{
        return new Promise(async(resolve, reject)=>{
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
                    logger: true,
                    debug: true
                },{
                    from: 'MLKA <' + process.env.SMTP_FROM + '>',
                    headers:{
                        'X-Laziness-level':1000
                    }
                });
                
                let message = {
                    to: user.email,
                    subject: 'Réinitialisation de mot de passe MLKA',
                    html: 'Bonjour' + user?.nom +" "+user?.prenom+ ', <br/><br/> <p>Nous avons bien reçu une demande de récupération de votre mot de passe MLKA.<p/> <p>Pour définir un nouveau mot de passe, veuillez cliquer sur le lien suivant:</p> <a href="' + process.env.lostpassword + user.code + '&email=' + user.email + '">' + process.env.lostpassword + user.code + '&email=' + user.email + '</a> <br/> <p> Si vous n\'êtes pas à l\'origine de cette demande de récupération de votre mot de passe, veuillez ignorer ce message.</p> <p style="text-align:center">L\'équipe MLKA</p>',
                };
                transporter.sendMail(message, (error, user)=>{
                    if(error){
                        console.log("erreur", error);
                    }
                    resolve(user);
                    transporter.close();
                });
                
            } catch (error) {
                console.log("Erreur mail", error);
                reject(error);
            }

            
        });
    },
    signup:(user)=>{
        return new Promise(async(resolve, reject)=>{
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
                    to: user.email,
                    subject: 'Bienvenue sur MLKA - Votre partenaire en bâtiments préfabriqués',
                    html:'Cher(e)' + user?.nom +" "+user?.prenom+ 
                    '<br/><br/>'+ 
                    '<p>Nous sommes ravis de vous accueillir chez MLKA, votre partenaire de confiance pour le suivi, la fourniture et l\'installation de bâtiments préfabriqués. Nous vous remercions de vous être inscrit(e) sur notre plateforme et de nous avoir choisi pour répondre à vos besoins en construction.<p/>'+
                    '<p>Chez MLKA, notre engagement est de vous offrir une expérience exceptionnelle à chaque étape de votre projet.</p>'+
                    '<p>Pour commencer votre projet avec MLKA, il vous suffit de vous connecter à notre plateforme avec vos identifiants. Si vous avez des projets en cours ou des demandes spécifiques, vous pouvez les ajouter directement depuis votre tableau de bord.</p>'+
                    '<p>Bienvenue chez MLKA, où la qualité et le professionnalisme sont au cœur de tout ce que nous faisons.</p>',
                };
                transporter.sendMail(message, (error, user)=>{
                    if(error){
                        console.log("erreur", error);
                    }
                    resolve(user);
                    transporter.close();
                });
                
            } catch (error) {
                console.log("Erreur mail", error);
                reject(error);
            }

            
        });
    },

}