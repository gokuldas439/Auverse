
// const SERVICE_ID = "VA3f07ff3c106e6f29bf1024bd27562aaf"
// const ACCOUNT_SID = "ACc549972786a17289d4c0d13b5c50cb04"
// const AUTH_TOKEN = "95ec37421a6a6525a2fe3b9cedbeaedb"




// const SERVICE_ID ='VAc768ef70ff8625f11ad7fa8e04ebd823'
// const ACCOUNT_SID ='AC6f2af60f871c2ec0f2f0656671f7293c'
// const AUTH_TOKEN ='297e0492e17700a21cb0af6b34dc9dd1'
const db = require('../database/db');
const twilio = require('twilio');
const client = new twilio( process.env.ACCOUNT_SID, process.env.AUTH_TOKEN);

module.exports = {

    // otp login...............................................................................

    otpLogin: async (req, res) => {
        try {
            
            const numbercheck=await db.getdb().collection("users").findOne({number:req.body.number})
            if(numbercheck){

                
                
                const result = await client
                .verify
                .services(process.env.SERVICE_ID)
                .verifications
                .create({
                    to: `+91${req.body.number}`,
                    channel: "sms"
                    
                });
                
                res.json({
                    status:'sucesss',
                })
            }else{
                res.status(500).json({
                    status:'failed',
                    message:"Entered Number is not an Auverse user *"
                      })
            }
        }
         catch (err) {
            
res.status(500).json({
    status:'failed',
    message:"Too many Requests. Please try again after sometime...."
})
        }
    },

    // otp verification.................................................................................

    submitOtp: async (req, res) => {
        try {
            
            
            const data = await client
                .verify
                .services(process.env.SERVICE_ID)
                .verificationChecks
                .create({
                    to: `+91${req.body.number}`,
                    code: req.body.code

                })

            if (data.status =="approved") {
                req.session.login=true;
                req.session.logintime=new Date();
                const user=await db.getdb().collection('users').findOne({number:req.body.number})
                req.session.userId=user._id;

                res.json({
                    status:'sucesss'
                })
                // res.redirect('/')
                // window.location="/"
            } else {
                res.status(400).json({
                    status:'failed',
                    message:'Invalid OTP'
                })
                
            } 

        } catch (err) {
            
            res.status(500).json({
            status:'failed',
            message:err.message
            })
        }
    },



    resendOtp: async (req, res) => {
        try {
            
            const numbercheck=await db.getdb().collection("users").findOne({number:req.body.number})
            if(numbercheck){

                
                
                const result = await client
                .verify
                .services(process.env.SERVICE_ID)
                .verifications
                .create({
                    to: `+91${req.body.number}`,
                    channel: "sms"
                    
                });
                
                res.json({
                    status:'sucesss',
                })
            }else{
                res.status(500).json({
                    status:'failed',
                    message:"Entered Number is not an Auverse user *"
                      })
            }
        }
         catch (err) {
            
res.status(500).json({
    status:'failed',
    message:"Too many Requests. Please try again after sometime...."
})
        }
    },


// forgot password.....................................................
forgotPasswordLogin: async (req, res) => {
    try {
        
        const numbercheck=await db.getdb().collection("users").findOne({number:req.body.number})
        if(numbercheck){

            
            
            const result = await client
            .verify
            .services(process.env.SERVICE_ID)
            .verifications
            .create({
                to: `+91${req.body.number}`,
                channel: "sms"
                
            });
            
            res.json({
                status:'sucesss',
            })
        }else{
            res.status(500).json({
                status:'failed',
                message:"Entered Number is not an Auverse user *"
                  })
        }
    }
     catch (err) {
        
res.status(500).json({
status:'failed',
message:"Too many Requests. Please try again after sometime...."
})
    }
},

submitForgotPasswordOtp: async (req, res) => {
    try {
        
        
        const data = await client
            .verify
            .services(process.env.SERVICE_ID)
            .verificationChecks
            .create({
                to: `+91${req.body.number}`,
                code: req.body.code

            })

        if (data.status =="approved") {
            req.session.forgotpassword=true;
            // req.session.logintime=new Date();
            const user=await db.getdb().collection('users').findOne({number:req.body.number})
            req.session.userId=user._id;

            res.json({
                status:'sucesss'
            })
            // res.redirect('/')
            // window.location="/"
        } else {
            res.status(400).json({
                status:'failed',
                message:'Invalid OTP'
            })
            
        } 

    } catch (err) {
        
        res.status(500).json({
        status:'failed',
        message:err.message
        })
    }
},




resendForgotPasswordOtp: async (req, res) => {
    try {
        
        const numbercheck=await db.getdb().collection("users").findOne({number:req.body.number})
        if(numbercheck){

            
            
            const result = await client
            .verify
            .services(process.env.SERVICE_ID)
            .verifications
            .create({
                to: `+91${req.body.number}`,
                channel: "sms"
                
            });
            
            res.json({
                status:'sucesss',
            })
        }else{
            res.status(500).json({
                status:'failed',
                message:"Entered Number is not an Auverse user *"
                  })
        }
    }
     catch (err) {
        
res.status(500).json({
status:'failed',
message:"Too many Requests. Please try again after sometime...."
})
    }
},










}