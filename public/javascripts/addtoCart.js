async function addtoCart(id){
    console.log(id);
   const result=await axios({
   method:'get',
      url: `/addtoCart/${id}`,
   });
     console.log({status:result});
     if(result.data.status == "addedtoCart"){

         const cartnumber = await axios({
             method: 'GET', url: '/cartnumber'
            });
            console.log(cartnumber.data);
            document.getElementById('cartnumber').dataset.cartItems=cartnumber.data.status;
            Toastify({
                text: "Product has been added to cart",
                duration: 3000,
                newWindow: true,
                close: true,
                gravity: "bottom", // `top` or `bottom`
                position: "center", // `left`, `center` or `right`
                stopOnFocus: true, // Prevents dismissing of toast on hover
                style: {
                  background: "black",
                }, // Callback after click
              }).showToast();
        }else{

        }
    };
 