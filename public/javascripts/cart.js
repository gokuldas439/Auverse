async function changeQuantity(offerPrice,productId,count){
  const price=parseInt(offerPrice)
const quantity =parseInt(document.getElementById(productId).value)
count=parseInt(count)

 
const result=await axios({
    method:'POST',
      url:'/change',
      data:{
        productId,
        count,
        quantity
      },
   });
   
       if(result.data.status=="removeProduct"){
          location.reload();
        }else{
          document.getElementById(productId).value=quantity+count
          
          document.getElementsByClassName(productId)[0].textContent=`Rs. ${((quantity+count)*price).toLocaleString()}`;
          
          const total=document.querySelectorAll('.totalprice')
          let sum=0;
          for(i=0;i<total.length;i++){
            
            sum=parseInt(total[i].innerHTML.slice(4).replace(',',''))+sum;
          }
          // 
          document.getElementById('totalspan').textContent=`Rs. ${sum.toLocaleString()}`;
          document.getElementById('overall').textContent=`Rs. ${sum.toLocaleString()}`;
  
  }
}
