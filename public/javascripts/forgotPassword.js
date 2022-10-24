const resend=document.querySelector(".otpResendbutton");
const send=document.querySelector(".sendotp");
const buttondiv=document.querySelector(".buttonsInResend");
const expiresmsg=document.querySelector(".otpexpire");
const countdown=document.querySelector(".countdown");
const signbutton=document.querySelector(".signbutton");




const number=async(number)=>{
    try{
        const result = await axios({
            method:'POST',
            url:'/forgotPassword',
            data:{
                number
            }
         });
         send.disabled=true;
         send.classList.add("sendotpdisabled")
         signbutton.disabled=false;
         signbutton.classList.remove("signfade")
         expiresmsg.classList.remove("none")
         countdown.classList.remove("none")     
         document.querySelector(".otpsendspan").textContent="OTP has been sent...."
   

        const startingMinutes = 2;
        let time = startingMinutes * 60;
        const countdownEl=document.getElementById('countdown');
        const interval=setInterval(updateCountdown, 1000);
        function updateCountdown() 
        {
        const minutes = Math.floor(time / 60);
        let seconds=time % 60;
        seconds = seconds < 10 ? '0' + seconds: seconds;
        countdownEl.innerHTML = `${minutes}:${seconds}`;
        time--;
        if (time < 0) { 
             clearInterval(interval);
             resend.disabled=false;
             resend.classList.remove("resenddisabled");
             signbutton.disabled=true;
         signbutton.classList.add("signfade")
        }
    }

    }catch(err){
        
        document.querySelector(".otpsendspan").textContent=err.response.data.message;

    }
    
};



document.querySelector(".form").addEventListener('submit',e=>{
    e.preventDefault();
    const mobile=document.getElementById('number').value;
    const regExp=/^[6-9]\d{9}$/;
    if(regExp.test(mobile)){
        number(document.getElementById('number').value);
    }
    else{
        document.querySelector(".otpsendspan").textContent="Enter your valid mobileNumber *"
    }

   

});


const submit=async(number,code)=>{
    
    try{
        const result = await axios({
            method:'POST',
            url:'/submitForgotOtp',
            data:{
                number,
                code
            }            
         });
         
         
         window.location="/resetPassword"
        }catch(err){
            
        document.querySelector(".otpsubmitspan").textContent=err.response.data.message;

    }
}

document.querySelector(".submitform").addEventListener('submit',e=>{
    e.preventDefault();
    const mobile=document.getElementById('number').value;
    var otp=document.getElementById('otp').value;
    
    if(otp){
        
        
        submit(document.getElementById('number').value,document.getElementById('otp').value);
    }
    else{
        document.querySelector(".otpsendspan").textContent="Enter otp below *"
    }

   

});




const resendOtp=async(number)=>{
    try{
        const result = await axios({
            method:'POST',
            url:'/resendForgotOtp',
            data:{
                number
            }
         });
         resend.disabled=true;
         send.disabled=true;
         resend.classList.add("resenddisabled")
         signbutton.disabled=false;
         signbutton.classList.remove("signfade")
         expiresmsg.classList.remove("none")
         countdown.classList.remove("none")     
         document.querySelector(".otpsendspan").textContent="OTP has been sent...."
   

        const startingMinutes = 2;
        let time = startingMinutes * 60;
        const countdownEl=document.getElementById('countdown');
        const interval=setInterval(updateCountdown, 1000);
        function updateCountdown() 
        {
        const minutes = Math.floor(time / 60);
        let seconds=time % 60;
        seconds = seconds < 10 ? '0' + seconds: seconds;
        countdownEl.innerHTML = `${minutes}:${seconds}`;
        time--;
        if (time < 0) { 
             clearInterval(interval);
             resend.disabled=false;
             resend.classList.remove("resenddisabled");
             signbutton.disabled=true;
         signbutton.classList.add("signfade")
        }
    }

    }catch(err){
        
        document.querySelector(".otpsendspan").textContent=err.response.data.message;

    }
    
};


document.querySelector(".resendform").addEventListener('submit',e=>{
    e.preventDefault();
    const mobile=document.getElementById('number').value;
    const regExp=/^[6-9]\d{9}$/;
    if(regExp.test(mobile)){
        resendOtp(document.getElementById('number').value);
    }
    else{
        document.querySelector(".otpsendspan").textContent="Enter your valid mobileNumber *"
    }

   

});