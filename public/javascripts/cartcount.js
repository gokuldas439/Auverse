const getCartCount = async () => {
    
    const result = await axios({
        method: 'GET', url: '/cartnumber'
    });
    
    document.getElementById('cartnumber').dataset.cartItems=result.data.status;
};
getCartCount();