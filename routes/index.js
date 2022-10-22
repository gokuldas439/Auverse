const express = require('express');
const router = express.Router();
var mongodb = require('mongodb');
const db = require('../database/db');
const bcrypt = require('bcrypt');
const app = require('../app');
const productController = require('../controllers/productController');
const sessionControllers = require('../controllers/sessionControllers');
const loginOtpControllers= require('../controllers/loginOtpController');
// const { route } = require('./users');
const cloudinary=require('cloudinary')

const multer=require('multer')
const path=require('path')



upload = multer({
  storage: multer.diskStorage({}),
  fileFilter: (req, file, cb) => {
    let ext = path.extname(file.originalname);
    if (ext !== ".jpg" && ext !== ".jpeg" && ext !== ".png") {
      cb(new Error("File type is not supported"), false);
      return;
    }
    cb(null, true);
  }
})





// user signup....................................................................

router.get('/signup',sessionControllers.sessionCheck,productController.signup)

// user signup....................................................................

router.post('/signup',productController.signupUser)


// forgot the password,....................................
router.get('/forgotPassword',sessionControllers.sessionCheck,productController.forgotPassword)

// post router for forgot password....................................

router.post('/forgotPassword',sessionControllers.sessionCheck,loginOtpControllers.forgotPasswordLogin)


// otp submit route................................................................
router.post('/submitForgotOtp',loginOtpControllers.submitForgotPasswordOtp)


// otp resend route................................................................
router.post('/resendForgotOtp',loginOtpControllers.resendForgotPasswordOtp)

// route after submit is success   reset password..........................
router.get('/resetPassword',sessionControllers.sessionCheck,productController.resetPassword);

// route after submit is success   reset password..........................
router.post('/resetPassword',sessionControllers.sessionCheck,productController.resetUserPassword);


// user loginpage...................................................................

router.get('/login',sessionControllers.sessionCheck,productController.userLogin);

// user login validation............................................................

router.post('/login',productController.loginUserValidation)


// login with otp render.............................................................

router.get('/otplogin',sessionControllers.sessionCheck,productController.otplogin);



// router.get('/logging',productController.otplogin);

// otp login post method..............................................................
router.post('/otploginpage',loginOtpControllers.otpLogin)


// otp submit route................................................................
router.post('/submitOtp',loginOtpControllers.submitOtp)


// otp resend route................................................................
router.post('/resendOtp',loginOtpControllers.resendOtp)


// GET home page................................................................

router.get('/',sessionControllers.userSessionCheck,async(req,res)=> {
  try{
    // console.log(req.url)
    // console.log(new Date(req.session.logintime));
    const Products= await db.getdb().collection("products").find({}).limit(4).toArray()
          
     //to get wishlist products
     const wishlist = await db
     .getdb()
     .collection('wishlist')
     .findOne({ userId:mongodb.ObjectId(req.session.userId)});

   //if wishlist
   if (wishlist) {
     //assign wishlist true for wishlisted product
     if (wishlist.products.length > 0) {
       wishlist.products.forEach((item) => {
         const index = Products.findIndex(
           (product) => product._id.toString() === item.productId.toString()
         );
         console.log(index);
         if (index !== -1) {
          Products[index].wishlist = true;
           console.log(Products[index]);
         }
       });
     }
   }




    const banners=await db.getdb().collection('banners').find({}).toArray()
    const allcategory= await db.getdb().collection('categories').find({}).limit(4).toArray();
    res.render('index',{user:true,products:Products,banners:banners,allcategory});
  }catch(err){
console.log(err);
  }
});


// logout.........................................


router.get('/userLogout',async(req,res)=> {
  try{

    req.session.login=null;
  req.session.userId=null;
  res.redirect('/login')
}catch(err){
  console.log(err);
}

});
router.get('/adminLogout',async(req,res)=> {
  req.session.adminlogin = null;
  // req.session.email = null;
  res.redirect('/adminlogin')

});

// search..........................
router.post('/search',productController.search)

// get products page................................................
router.get('/products',sessionControllers.userSessionCheck,async(req,res)=>{
  try{
    console.log({query:req.query})
     //pagination
     let pageNo;
     let isSort1;
     if (req.query?.p) {
       pageNo = req.query.p - 1 || 0;
     }else{
      pageNo=0
     }
     //sort by price
     let price = {};
     if (req.query?.sort) {
      const sort=parseInt(req.query.sort)
      if(sort === 1){
        isSort1=true
      }else{
        isSort1=false

      }
       price = {
        "offerprice": sort
       };
     }else{

     }
    console.log(req.query);


    const limit = 9;
    let dbQuery = {};

    // filter by search
     if(req.query.search){
      const text=req.query.search;
      let payload=text.trim()
      dbQuery={name:{$regex:`.*${payload}.*`,$options:'i'}};

      // category query...
     }else if(req.query.categoryId){
      const categoryId=req.query.categoryId
      dbQuery={categoryId:mongodb.ObjectId(categoryId)};
   

    //  without any queries....
    
  }else if(req.query.brandId){
    const brandId=req.query.brandId
    dbQuery={brandId:mongodb.ObjectId(brandId)};
 

  //  without any queries....
  
  }else if(req.query.price){
    const rangePrice=parseInt(req.query.price);
    dbQuery={price:{$lte:rangePrice}}
  }
  else{
      dbQuery={}
    }
    const finalProducts= await db.getdb().collection("products").find(dbQuery).toArray()
    const allProducts= await db.getdb().collection("products").find(dbQuery).skip(pageNo * limit).limit(limit).sort(price).toArray()
      
     //to get wishlist products
     const wishlist = await db
     .getdb()
     .collection('wishlist')
     .findOne({ userId:mongodb.ObjectId(req.session.userId)});

   //if wishlist
   if (wishlist) {
     //assign wishlist true for wishlisted product
     if (wishlist.products.length > 0) {
       wishlist.products.forEach((item) => {
         const index = allProducts.findIndex(
           (product) => product._id.toString() === item.productId.toString()
         );
         console.log(index);
         if (index !== -1) {
          allProducts[index].wishlist = true;
           console.log(allProducts[index]);
         }
       });
     }
   }





        // to get number of page

    let max = finalProducts.length / 9;
    let m = Math.ceil(max);
    let page = [];
    for (let i = 1; i <= m; i++) {
      page.push(i);
    }
    if(allProducts.length == 0){

      res.render('Products',  {user:true,products:allProducts,productsjs:"a",emptyProducts:true});
    }else{
      res.render('Products',  {user:true,products:allProducts,productsjs:"a",page,isSort1});
      
    }

  
}catch(err){
console.log(err);
}
});

// get view products page................................................

router.get('/products/view-product/:id',sessionControllers.userSessionCheck,productController.UserProductView)


router.post('/addReview/:id',sessionControllers.userSessionCheck,productController.addReview)


// user cart.................................................................

router.get('/cart',sessionControllers.userSessionCheck,productController.userCart)


// user cart number show in all page...............................
router.get('/cartnumber',sessionControllers.userSessionCheck,productController.cartnumber)

// user checkout......................................................................

router.get('/checkout',sessionControllers.userSessionCheck,productController.checkout)

// apply coupon.....................
router.post('/applyCoupon',sessionControllers.userSessionCheck,productController.applyCoupon)

// user save address.....................................................................

router.post('/saveAddress',productController.saveAddress)


router.post('/change',sessionControllers.userSessionCheck,productController.changeQuantity)


// router for placing order....................................
router.post('/placeOrder',sessionControllers.userSessionCheck,productController.placeOrder)

// router for sucess paypal order....................................
router.get('/success',productController.paypalsuccess)

// router verifying  order....................................
router.post('/verifyPayment',productController.verifyPayment)


// router for  order status....................................
router.get('/orderStatus',sessionControllers.userSessionCheck,productController.orderStatus);


// invoice generator...........................................

router.post('/invoice/:id',productController.invoice)

// user account page....................................................
router.get('/userAccount',sessionControllers.userSessionCheck,productController.userAccount);

// user order detail page ......................................................

router.get('/orderDetails/:id',sessionControllers.userSessionCheck,productController.orderDetails)

// user address page for user account.................................................

router.get('/addresses',sessionControllers.userSessionCheck,productController.userAddresses);

// user add address page.........................................................................

router.get('/addAddress',sessionControllers.userSessionCheck,productController.addAddress);
// user edit address page.........................................................................

router.get('/editAddress/:id',sessionControllers.userSessionCheck,productController.editAddress);

// user edit address page saving .........................................................................

router.post('/editAddress/:id',sessionControllers.userSessionCheck,productController.editSaveAddress);

// user add address page.........................................................................

router.post('/addUserAddress',sessionControllers.userSessionCheck,productController.addUserAddress);

// user add address page.........................................................................

router.get('/removeAddress/:id',sessionControllers.userSessionCheck,productController.removeUserAddress);

// user personal details page in user account..........................................................
router.get('/personalDetails',sessionControllers.userSessionCheck,productController.userProfile);

// user edit personal details page in user account..........................................................
router.get('/editUserDetails',sessionControllers.userSessionCheck,productController.edituserProfile);

// user edit (post) personal details page in user account..........................................................
router.post('/editUserDetails',sessionControllers.userSessionCheck,productController.editUserDetails);

// user password change option.............................................
router.get('/changePassword',sessionControllers.userSessionCheck,productController.changePassword);

// user password change (post) option.............................................

router.post('/changePassword',sessionControllers.userSessionCheck,productController.changeuserPassword);

// user add to cart.................................................................

router.get('/addtoCart/:id',sessionControllers.userSessionCheck,productController.addtoCart)

// user remove from cart.................................................................

router.get('/removeCart/:id',sessionControllers.userSessionCheck,productController.removeCart);


// user cancel their order..............................

router.post('/userCancelOrder/:id',sessionControllers.userSessionCheck,productController.userCancelOrder)

// user cancel single order........................................................

router.post('/userCancelSingleOrder/:id',sessionControllers.userSessionCheck,productController.userCancelSingleOrder)


// wishlist in userside...............................................

router.get('/wishlist',sessionControllers.userSessionCheck,productController.wishlist)


// add to wishlist user side........................................................

router.get('/addtoWishlist/:id',sessionControllers.userSessionCheck,productController.addtoWishlist);

// adding the product from wishlist to cart and reving the product from wishlist.................................

router.get('/wishlistToCart/:id',sessionControllers.userSessionCheck,productController.wishlistToCart);



//user wallet router


router.get('/userWallet',sessionControllers.userSessionCheck,productController.userWallet);

//user add money wallet router


router.post('/addMoneyWallet',sessionControllers.userSessionCheck,productController.addMoneyWallet);

//user add money verify wallet router
router.post('/verifyWalletPayment',sessionControllers.userSessionCheck,productController.verifyWalletPayment);

//user wallet transfer  router
router.post('/transferWalletBalance',sessionControllers.userSessionCheck,productController.transferWalletBalance);


// returning product...........................................

router.post('/returnProduct/:id',sessionControllers.userSessionCheck,productController.returnProduct)



// refer and earn...............................................................................
router.get('/ReferAndEarn',sessionControllers.userSessionCheck,productController.ReferAndEarn)














// admin homepage or dashboard route............................................

router.get('/adminHome',sessionControllers.adminHomeSession,productController.adminHome);


// products page for admin......................................................

router.get('/adminProducts',sessionControllers.adminHomeSession,productController.adminProducts);

// userlist page for admin................................................

router.get('/adminUsers',sessionControllers.adminHomeSession,productController.adminUsers)


// admin offers page for admin................................................

router.get('/adminSales',sessionControllers.adminHomeSession,productController.adminSales)

router.post('/salesReport',sessionControllers.adminHomeSession,productController.salesReport)

// admin offers page for admin................................................

router.get('/adminOffers',productController.adminOffers)

// admin offer category offer adding section............................................

router.post('/addCategoryOffer',productController.addCategoryOffer)

// add admin offer route for category......................................

router.get('/deleteCategoryOffer/:id',productController.deleteCategoryOffer);

// add admin offer route for category......................................

router.get('/deleteProductOffer/:id',productController.deleteProductOffer);









// router to add the product offer............................................

router.post('/addProductOffer',productController.addProductOffer)


// admin login page route.......................................................

router.get('/adminlogin',sessionControllers.adminSessionCheck,productController.adminLogin);


// admin login check.................................................................

router.post('/adminlogin',productController.adminLoginCheck);


// admin user block..............................................................

router.get("/statusUser/:id",sessionControllers.adminHomeSession,productController.statusChanger)


// admin category listing......................................................................

router.get('/adminCategories',sessionControllers.adminHomeSession,productController.adminCategories)


// admin category edit .....................................................................

router.post("/editCategory/:id",sessionControllers.adminHomeSession,productController.editCategories)

// add category by admin...................................................................

router.post('/addCategory',sessionControllers.adminHomeSession,productController.addCategories)


// delete category.....................................................................................
router.get("/deleteCategory/:id",sessionControllers.adminHomeSession,productController.deleteCategories)


// admin brand page..........................................................................

router.get('/adminBrands',sessionControllers.adminHomeSession,productController.adminBrands)

// admin category edit .....................................................................

router.post("/editBrand/:id",sessionControllers.adminHomeSession,productController.editBrands)

// add category by admin...................................................................

router.post('/addBrand',sessionControllers.adminHomeSession,productController.addBrands)


// delete category.....................................................................................
router.get("/deleteBrand/:id",sessionControllers.adminHomeSession,productController.deleteBrands)



// add products................................................................................
router.get('/addProducts',sessionControllers.adminHomeSession,async(req,res)=>{
  try{
    const allcategories= await db.getdb().collection("categories").find({}).toArray()
    const allbrands= await db.getdb().collection("brands").find({}).toArray()
    res.render('adminAddProducts',{ stylesheet: 'adminAddProducts.css',admin:true,products:"active",categoriestable:allcategories,brandstable:allbrands})
  }
catch(err){
  console.log(err);
}  

}) 

router.post('/addProducts',sessionControllers.adminHomeSession,upload.array('images',4),productController.addSingleProduct)



// delete products route........................................................

router.get("/deleteProduct/:id",sessionControllers.adminHomeSession,productController.deleteProducts)


// edit products route........................................................

router.get("/editProduct/:id",sessionControllers.adminHomeSession,productController.editProducts)


// edit post request of products admin side...................................................

router.post('/editProducts/:id',sessionControllers.adminHomeSession,upload.array('images',4),productController.editSingleProduct)





// banner admin..............................................
router.get('/adminBanners',sessionControllers.adminHomeSession,productController.adminBanners)


// add banner..........................................................................

router.post('/addBanner',sessionControllers.adminHomeSession,upload.single('image'),productController.addBanner)

// edit banner...........................................................................

router.post('/editBanner/:id',sessionControllers.adminHomeSession,upload.single('image'),productController.editBanner)


// delete banneradmin.......................................................................


router.get('/deleteBanner/:id',sessionControllers.adminHomeSession,productController.deleteBanner)


// admin user order page....................................................................

router.get('/adminOrders',sessionControllers.adminHomeSession,productController.adminOrders)
// admin user order page....................................................................

router.get('/adminViewOrder/:id',sessionControllers.adminHomeSession,productController.adminViewOrder)


// admin side users order status change...........................................

router.post('/ChangeOrderStatus/:id',sessionControllers.adminHomeSession,productController.ChangeOrderStatus)


// admin coupons...............................................................
router.get('/adminCoupons',sessionControllers.adminHomeSession,productController.adminCoupons)

// add coupon post.......................
router.post('/addCoupon',sessionControllers.adminHomeSession,productController.addCoupon)

// edit coupon............................
router.post('/editCoupon/:id',sessionControllers.adminHomeSession,productController.editCoupon)

// delete coupon
router.get('/deleteCoupon/:id',sessionControllers.adminHomeSession,productController.deleteCoupon)




module.exports = router;
