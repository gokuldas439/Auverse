async function changeQuantity(offerPrice,productId,count){
  const price=parseInt(offerPrice)
const quantity =parseInt(document.getElementById(productId).value)
count=parseInt(count)
console.log(count)
 console.log(quantity)
const result=await axios({
    method:'POST',
      url:'/change',
      data:{
        productId,
        count,
        quantity
      },
   });
   console.log({status:result.data.status});
       if(result.data.status=="removeProduct"){
          location.reload();
        }else{
          document.getElementById(productId).value=quantity+count
          
          document.getElementsByClassName(productId)[0].textContent=`Rs. ${((quantity+count)*price).toLocaleString()}`;
          console.log("end")
          const total=document.querySelectorAll('.totalprice')
          let sum=0;
          for(i=0;i<total.length;i++){
            console.log(total[i].innerHTML.slice(4));
            sum=parseInt(total[i].innerHTML.slice(4).replace(',',''))+sum;
          }
          // console.log(sum);
          document.getElementById('totalspan').textContent=`Rs. ${sum.toLocaleString()}`;
          document.getElementById('overall').textContent=`Rs. ${sum.toLocaleString()}`;
  
  }
}
