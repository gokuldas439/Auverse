const db = require('../database/db');
var mongodb = require('mongodb');

module.exports={
    userSessionCheck:async(req,res,next)=>{
        if(req.session.login){
          const userId=req.session.userId;
          const user=await db.getdb().collection('users').findOne({_id:mongodb.ObjectId(userId)})
          
          if(user.passwordChangedAt){
            const oldtime=new Date(req.session.logintime);
            // console.log(oldtime<=user.passwordChangedAt);
            if(oldtime<=user.passwordChangedAt){
              req.session.destroy();
              res.set('Clear-Site-Data: "cookies", "storage", "executionContexts"');
              res.redirect('/login')
              
          }else{
            next();
          }
          }else{
            next();

          }
        }else{
            res.redirect('/login')
           
        }
    },


    sessionCheck:function sessionCheck(req, res, next) {
        if (req.session.login) {
          res.redirect('/');
        }
        else {
          next()
        }
      },

      adminSessionCheck:function(req,res,next){
        if(req.session.adminlogin){
          res.redirect('/adminhome');
        }
        else {
            next()
          }
        },


        adminHomeSession:(req,res,next)=>{
        if(req.session.adminlogin){
          next();
        }else{
          res.redirect('/adminlogin');

        }
        },
      
}