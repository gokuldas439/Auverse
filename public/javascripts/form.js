$(document).ready(function(){

    $("#gform").validate({
       rules: {
        name:{
            required:true,
        },
        price:{
            required:true,
        },
        offerprice:{
            required:true,
        },
        color:{
            required:true,
        },
        stocks:{
            required:true,
        },
        categoryId:{
            required:true,
        },
        brandId:{
            required:true,
        },
        rating:{
            required:true,
        },
        description:{
            required:true,
        },
        images:{
            required:true,
        }
    },
    messages: {
        name:{
            required:"Please enter Product name"
        },
        price: {
            required:"Please enter your subject"

        },
        offerprice:{
            required:"Please enter a valid mobile number",
            minlength:"Enter 10 digits",
            maxlength:"Enter 10 digits"
        },
        color:{
            required:"Enter a valid email address"
        },
        stocks:{
            required:"Enter a valid email address"
        },
        categoryId:{
            required:"Enter a valid email address"
        },
        brandId:{
            required:"Enter a valid email address"
        },
        rating:{
            required:"Enter your message"
           
        },
        description:{
            required:"Enter your message"
           
        },
        images:{
            required:"Enter your message"
           
        },

    },
    
});

let refreshPage = () => {
    window.location.reload();
}

});