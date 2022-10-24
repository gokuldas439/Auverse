const headtog=document.querySelector(".header_toggle");


headtog.addEventListener('click',()=>{
    const elem=document.getElementById("nav-bar");
    
    if(elem.className=="l-navbar show"){
        elem.className="l-navbar"
        headtog.className="header_toggle"
    }else{
        elem.className="l-navbar show";
        headtog.className="header_toggle body-pd"
    }
 })






let refreshPage = () => {
    window.location.reload();
}
