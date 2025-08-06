var nodemailer = require('nodemailer');
var ObjectId = require('mongoose').Types.ObjectId;
var Conge = require('../models/conge.model').CongeModel;
var Agenda = require ('../models/agenda.model').AgendaModel;


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

    signup:(user,password)=>{
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
                    subject: 'Bienvenue sur MLKA GROUPE - Votre partenaire en bâtiments préfabriqués',
                    html:'Cher(e) ' + user?.nom +" "+user?.prenom+ 
                    '<br/><br/>'+ 
                    '<p>Nous sommes ravis de vous accueillir chez <b>MLKA GROUPE</b>, votre partenaire de confiance pour le suivi, la fourniture et l\'installation de bâtiments préfabriqués. Merci de votre inscription et de votre confiance en notre expertise.<p/>'+
                    '<p>Chez <b>MLKA GROUPE</b>, nous nous engageons à vous offrir une <b>expérience optimale</b> à chaque étape de votre projet.</p>'+
                    '<p><b>🌐 Accédez à nos plateformes dès maintenant :</b></p>'+
                    '<p>🔹 <a href="https://mlka-market.com/" target="_blank"><b>Accéder à la MarketPlace MLKA</b></a> – Trouvez, achetez et louez des modules en toute simplicité.</p>' +
                    '<p>🔹 <a href="https://mlka.app" target="_blank"><b>Gérez vos projets en temps réel</b></a> – Suivez l’avancement de vos chantiers et optimisez votre gestion.</p>' +
                    '<p>Pour commencer, connectez-vous à votre compte MLKA GROUPE avec vos identifiants :</p>'+
                    '<p> <b>📧 Adresse e-mail: '+user.email+'</b> </p>'+
                    '<p> <b>🔑 Mot de passe: '+password+'</b> </p>'+
                    '<p>Si vous avez des projets en cours ou des demandes spécifiques, ajoutez-les dès maintenant depuis votre tableau de bord.</p>'+
                    '<p>Bienvenue chez <b>MLKA GROUPE</b>, où la qualité et le professionnalisme sont au cœur de tout ce que nous faisons.</p>'+
                    '<p>À très bientôt !</p>'+
                    '<p><b>L\'équipe MLKA GROUPE</b></p>',
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

    signupParticulier:(user,password)=>{
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
                    subject: 'Bienvenue sur MLKA GROUPE - Votre partenaire en bâtiments préfabriqués',
                    html:'Cher(e) ' + user?.nom +" "+user?.prenom+ 
                    '<br/><br/>'+ 
                    '<p>Nous sommes ravis de vous accueillir chez <b>MLKA GROUPE</b>, votre partenaire de confiance pour le suivi, la fourniture et l\'installation de bâtiments préfabriqués. Merci de votre inscription et de votre confiance en notre expertise.<p/>'+
                    '<p>Que vous ayez un projet de construction, d’aménagement ou simplement une curiosité pour les bâtiments préfabriqués, vous êtes au bon endroit.</p>'+
                    '<p><b>🔐 Accédez dès maintenant à notre Marketplace pour consulter nos offres :</b></p>'+
                    '<p>🔹 <a href="https://mlka-market.com/" target="_blank"><b>MLKA MarketPlace</b></a> – Achetez, louez ou découvrez nos modules préfabriqués en quelques clics.</p>'+
                    '<p>Voici vos identifiants pour vous connecter :</p>'+
                    '<p> <b>📧 Adresse e-mail: '+user.email+'</b> </p>'+
                    '<p> <b>🔑 Mot de passe: '+password+'</b> </p>'+
                    '<p>Découvrez qui nous sommes, nos services et nos engagements sur notre site officiel :</p>'+
                    '<p>🌐 <a href="https://mlka-groupe.fr/" target="_blank"><b>www.mlka-groupe.fr</b></a></p>'+
                    '<p>Nous mettons tout en œuvre pour vous garantir une expérience simple, rapide et fiable.</p>'+
                    '<p style="margin-top: 20px;">Bienvenue dans la famille <b>MLKA GROUPE</b> ! Ensemble, concrétisons vos projets avec qualité et sérénité.</p>'+
                    '<p>À très bientôt !</p>'+
                    '<p><b>L\'équipe MLKA GROUPE</b></p>',
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

    signupParticulierSource:(user, source)=>{
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
                    subject: 'Bienvenue sur MLKA GROUPE - Votre partenaire en bâtiments préfabriqués',
                    html:'Cher(e) ' + user?.nom +" "+user?.prenom+ 
                    '<br/><br/>'+ 
                    '<p>Nous sommes ravis de vous accueillir chez <b>MLKA GROUPE</b>, votre partenaire de confiance pour le suivi, la fourniture et l\'installation de bâtiments préfabriqués. Merci de votre inscription et de votre confiance en notre expertise.<p/>'+
                    '<p>Que vous ayez un projet de construction, d’aménagement ou simplement une curiosité pour les bâtiments préfabriqués, vous êtes au bon endroit.</p>'+
                    '<p><b>🔐 Accédez dès maintenant à notre Marketplace pour consulter nos offres :</b></p>'+
                    '<p>🔹 <a href="https://mlka-market.com/" target="_blank"><b>MLKA MarketPlace</b></a> – Achetez, louez ou découvrez nos modules préfabriqués en quelques clics.</p>'+
                    '<p>Vous pouvez vous connecter directement avec votre compte '+source +' dont l\'adresse e-mail est : <b>'+user.email+'</b>.</p>' +
                    '<p>Découvrez qui nous sommes, nos services et nos engagements sur notre site officiel :</p>'+
                    '<p>🌐 <a href="https://mlka-groupe.fr/" target="_blank"><b>www.mlka-groupe.fr</b></a></p>'+
                    '<p>Nous mettons tout en œuvre pour vous garantir une expérience simple, rapide et fiable.</p>'+
                    '<p style="margin-top: 20px;">Bienvenue dans la famille <b>MLKA GROUPE</b> ! Ensemble, concrétisons vos projets avec qualité et sérénité.</p>'+
                    '<p>À très bientôt !</p>'+
                    '<p><b>L\'équipe MLKA GROUPE</b></p>',
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

    mailconge:(user)=>{
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
                    to: "m.minthe@mlka.fr;s.mbaye@mlka.fr",
                    subject: 'Demande de congé',
                    html:'Cher(e) Malick'+'<br/><br/>'+ 
                    '<p>Vous avez reçu une demande de congé de '+user.nom+' '+user.prenom+'.<p/>'+
                    '<p>Veuillez vous connecter dans l\'application MLKA pour valider la demande. <span><a href="https://mlka.app/login">Cliquez ici</a></span></p>'+
                    '<p>Merci.</p>'+
                    '<p>Cordialement.</p>',
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

    mailValidationconge:(idConge)=>{
        return new Promise(async(resolve, reject)=>{
            try {

                let msg="";
                let conge = await Conge.findOne({_id:idConge}).populate('user');

                if(conge?.status=='Refusée'){

                    msg='Cher(e) '+conge?.user?.nom+' '+conge?.user?.prenom+'<br/><br/>'+ 
                        '<p>Votre demande de congé est refusée suite à un motif :<b>'+conge?.motif+'</b><p/>'+
                        '<p>Merci.</p>'+
                        '<p>Cordialement.</p>'

                }else{
                    msg='Cher(e) '+conge?.user?.nom+' '+conge?.user?.prenom+'<br/><br/>'+ 
                    '<p>Votre demande de congé est validée. Veuillez vous connecter sur la plateforme pour plus de détails.<p/>'+
                    '<p>Merci.</p>'+
                    '<p>Cordialement.</p>'
                }

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
                    to: conge?.user?.email,
                    subject: 'Demande de congé',
                    html:msg,
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
    
    mailCodeAuthentication:(user, code)=>{
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
                    subject: 'Votre code d’authentification MLKA APP',
                    html:'Bonjour ' + user?.nom +" "+user?.prenom+ 
                    '<br/><br/>'+ 
                    '<p>Voici votre code d’authentification :</p>' +
                    '<p style="font-size: 24px; font-weight: bold; color: #2c3e50; margin: 20px 0;">' + code + '</p>' +
                    '<p>Ce code est personnel et valable pendant <b>10 minutes</b>.</p>' +
                    '<br/>' +
                    '<p>Si vous n\'êtes pas à l’origine de cette demande, vous pouvez ignorer cet e-mail.</p>' +
                    '<br/>' +
                    '<p>À très bientôt !</p>'+
                    '<p><b>L\'équipe MLKA GROUPE</b></p>',
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


     mailPlanning:(idAgenda)=>{
        return new Promise(async(resolve, reject)=>{
            try {

                let duree;
                let agenda = await Agenda.findOne({_id:idAgenda}).populate('assigne');
                if(agenda.isDay){
                    const start = new Date(agenda.start);
                    const end = new Date(agenda.end);
                    const diffTime = end - start; // Différence en millisecondes
                    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1; // +1 pour inclure le jour de début
                    duree = `${diffDays} jour(s) complet(s)`;
                }else{
                    const dateStart = new Date(agenda.start);
                    const dateEnd = new Date(agenda.end);

                    // Séparer les heures et minutes
                    const [hStart, mStart] = agenda.heure_start.split(':').map(Number);
                    const [hEnd, mEnd] = agenda.heure_end.split(':').map(Number);

                    // Fixer les heures dans les dates
                    dateStart.setHours(hStart, mStart, 0);
                    dateEnd.setHours(hEnd, mEnd, 0);

                    const diffTime = dateEnd - dateStart; // ms
                    const diffHours = Math.floor(diffTime / (1000 * 60 * 60));
                    const diffMinutes = Math.floor((diffTime % (1000 * 60 * 60)) / (1000 * 60));

                    duree = `${diffHours}h ${diffMinutes}min`;
                }

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

                agenda?.assigne.forEach(user=>{

                    //console.log("User", user);

                    let message = {
                        to:user?.email,
                        subject: 'Planning de travail',
                        html:'Cher(e) '+user.nom+' '+user.prenom+' '+'<br/><br/>'+ 
                        '<p>Vous avez été assigné à l\'agenda '+agenda.title+' pour une durée '+duree+'.<p/>'+
                        '<p>Merci.</p>'+
                        '<p>Cordialement.</p>',
                    };
                    transporter.sendMail(message, (error, user)=>{
                        if(error){
                            console.log("erreur", error);
                        }
                        resolve(user);
                        transporter.close();
                    });

                });
                
            } catch (error) {
                console.log("Erreur mail", error);
                reject(error);
            }

            
        });
    },

}