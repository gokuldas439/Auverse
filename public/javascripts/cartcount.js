const getCartCount = async () => {
    console.log('fsfd'); 
    const result = await axios({
        method: 'GET', url: 'http://localhost:3000/cartnumber'
    });
    console.log(result.data);
    document.getElementById('cartnumber').dataset.cartItems=result.data.status;
};
getCartCount();