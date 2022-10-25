const db = require('../database/db');
const bcrypt = require('bcrypt');
var mongodb = require('mongodb');
const cloudinary = require('cloudinary')
const Razorpay = require('razorpay');
const paypal = require('paypal-rest-sdk');
const easyinvoice = require('easyinvoice');
const crypto = require("crypto");
var fs = require('fs');
const { nanoid } = require('nanoid');
const XLSX = require('xlsx');
const nodemailer = require('nodemailer');
// const { render } = require('../app');
// const { ObjectID } = require('bson')

var instance = new Razorpay({
  key_id: process.env.YOUR_KEY_ID,
  key_secret: process.env.YOUR_KEY_SECRET,
});
// const multer=require('multer')
paypal.configure({
  'mode': 'sandbox', //sandbox or live
  'client_id': process.env.CLIENT_ID,
  'client_secret': process.env.CLIENT_SECRET
});

cloudinary.config({
  cloud_name: process.env.CLOUD_NAME,
  api_key: process.env.API_KEY,
  api_secret: process.env.API_SECRET
});






module.exports = {

  // admin home as dashboard rendering........................................................

  adminHome: async (req, res) => {
    try {
      const orderTotal = await db.getdb().collection('orders').countDocuments() ?? "0"
      const deliveredTotal = await db.getdb().collection('orders').countDocuments({ orderstatus: "Delivered" }) ?? "0"

      const AdminTotal = await db.getdb().collection('admin').countDocuments() ?? "0"
      const userTotal = await db.getdb().collection('users').countDocuments() ?? "0"
      const activeUsersTotal = await db.getdb().collection('users').countDocuments({ status: "Active" })
      const productsTotal = await db.getdb().collection('products').countDocuments() ?? '0'

      const agg = [
        {
          '$group': {
            '_id': null,
            'total': {
              '$sum': '$total'
            }
          }
        }
      ];
      const Revenue = await db.getdb().collection('orders').aggregate(agg).toArray()
      const totalRevenue = Revenue[0].total ?? "0"
      
      const orderStatus = await db.getdb().collection('orders').aggregate([
        {
          $group: {
            _id: '$orderstatus',
            status: {
              $sum: 1
            }
          }
        }
      ]).toArray()
      
      res.render('adminhome', { stylesheet: 'adminhome.css', admin: true, dashboard: "active", orderStatus, userTotal, AdminTotal, activeUsersTotal, orderTotal, productsTotal, deliveredTotal, totalRevenue });
    } catch (err) {
      
    }
  },
  // products page for admin........................................................................
  adminProducts: async (req, res) => {
    try {

      const agg = [
        {
          '$lookup': {
            'from': 'categories',
            'localField': 'categoryId',
            'foreignField': '_id',
            'as': 'category'
          }
        },
        {
          '$lookup': {
            'from': 'brands',
            'localField': 'brandId',
            'foreignField': '_id',
            'as': 'brand'
          }
        }

      ];
      const allProducts = await db.getdb().collection("products").aggregate(agg).toArray()
      

      // const allcategories= await db.getdb().collection("products").find({},{categoryId:1}).toArray()


      // const allbrands= await db.getdb().collection("brands").find({}).toArray()
      res.render('adminProducts', { stylesheet: 'adminProducts.css', admin: true, products: "active", productstable: allProducts });
    } catch (err) {
      
    }
  },

  // forgot password........................................
  forgotPassword:async(req,res)=>{
  try{
    res.render('forgotPassword', { stylesheet: "otplogin.css", login: "a", error: req.session.message, otpmessage: req.session.otpmessage })
    if (req.session.message) {
      req.session.message = null;
    } else if (req.session.otpmessage) {
      req.session.otpmessage = null;

    }


  }catch(err){
    
  }
  },

  
// reset password/........................................
resetPassword:async(req,res)=>{
  try{
      if(req.session.forgotpassword){
res.render('resetPassword',{ stylesheet: "otplogin.css", login: "a"})
      }else{
        res.redirect('/login')
      }

  }catch(err){
      
  }
},


// reset password post...........
resetUserPassword:async(req,res)=>{
  try {
    
    
    if(req.body.password === req.body.confirmpassword){
      // req.session.error="Passsword Doesn't match *"
      const password = req.body.password;
    const confirmpassword = req.body.confirmpassword;
    const userId = req.session.userId;
    const user = await db.getdb().collection('users').findOne({ _id: mongodb.ObjectId(userId) })
    

    if (user) {
      const hashedPassword = await bcrypt.hash(password, 12);
      const logintime = new Date();
      await db.getdb().collection('users').updateOne({ _id: mongodb.ObjectId(userId) }, { $set: { password: hashedPassword, passwordChangedAt: logintime } }, { upsert: true })
      req.session.login = true;
      const newlogintime = new Date();
      req.session.logintime = newlogintime;
      req.session.userId = user._id;
      res.json({
        status:'success'
      
      })
    } else {

    res.json({
      status:"UserInvalid",
      message:'invalid user *'
    })

    }
      
    }else{
      res.json({
        status:'invalid',
        message:"Passsword Doesn't match *"
      })

  
   
  }
  } catch (err) {
    
  }
},



// search..............
search:async(req,res)=>{
  try{
    // 
    let payload=req.body.e.trim()
    
    let search=await db.getdb().collection('products').find({name:{$regex:`.*${payload}.*`,$options:'i'}}).toArray()


    res.json({
  status:'success',
  search
})

  }catch(err){

  }
},

  //admin login page .....................................................................................

  adminLogin: (req, res) => {
    res.render('adminLogin', { stylesheet: 'adminlogin.css', login: "a", error: req.session.adminerror });
    if (req.session.adminerror) {
      req.session.adminerror = null;
    }
  },
  // user login...............................................................................................

  userLogin: async(req, res) => {
    const referral = await db.getdb().collection('referral').findOne({})

    res.render('userlogin', { stylesheet: 'userlogin.css', login: "a", loginerror: req.session.signinerror,referral });
    // req.session.login = null;
    req.session.panel = null;
    if (req.session.signinerror) {
      req.session.signinerror = null;
    }
  },


  // user products .......................................................................
  UserProductView: async (req, res) => {
    try {
      const productId = req.params.id;
      let userId;
      let pageNo;
      if (req.query?.p) {
        pageNo = req.query.p - 1 || 0;
      }else{
        pageNo=0
      }
      const limit = 6;
      let eligible;
      if(req.session.userId){
         userId=req.session.userId;       
        const agg = [
          {
            '$match': {
              'userId': mongodb.ObjectId(userId), 
              'product.productDetails._id': mongodb.ObjectId(productId),
              'orderstatus': 'Delivered'
            }
          }
        ];

        // check if order is delivered in user order- only delivered can review product
        const order=await db.getdb().collection('orders').aggregate(agg).toArray();
        
        // 
         
        //  chek if exists order....
        if(order.length>0){
          const userReview=await db.getdb().collection('reviews').findOne({productId:mongodb.ObjectId(productId),'reviews.userId':mongodb.ObjectId(userId)})
         
          // check if user already reviewed product..if so he cannot review again...
          if(userReview){
            eligible=false;
          }else{
            eligible=true;
          }
        }else{
          eligible=false;
        }  
      }else{
        
        eligible=false;
      }

      const allReview=await db.getdb().collection('reviews').findOne({productId:mongodb.ObjectId(productId)})
      
      let reviews;
      let page = [];
      if(allReview){
        if(allReview.reviews.length>0){
          reviews=true;
          let max = allReview.reviews.length / 6;
          let m = Math.ceil(max);
          
          for (let i = 1; i <= m; i++) {
            page.push(i);
          }
        }else{
          reviews=false;
        } 
      }else{
        reviews=false;
      }
     

      const agg = [
        { $match: { _id: mongodb.ObjectId(productId) } },
        {
          '$lookup': {
            'from': 'categories',
            'localField': 'categoryId',
            'foreignField': '_id',
            'as': 'category'
          }
        },
        {
          '$lookup': {
            'from': 'brands',
            'localField': 'brandId',
            'foreignField': '_id',
            'as': 'brand'
          }
        }

      ];
      const product = await db.getdb().collection("products").aggregate(agg).toArray()
      
      const allProducts = await db.getdb().collection("products").find({}).limit(4).toArray();


           
      const aggr = [
        {
          '$match': {
            'userId':mongodb.ObjectId(req.session.userId), 
            'products.productId':mongodb.ObjectId(productId)
          }
        }
      ];
      const singlewishlist=await db.getdb().collection('wishlist').aggregate(aggr).toArray()
     
      let iswishlist;
      //if singleWishlist
   if (singlewishlist.length>0) {
    //assign wishlist true for wishlisted product
    iswishlist=true;
  }else{
    iswishlist=false;
  }

  


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
         
         if (index !== -1) {
          allProducts[index].wishlist = true;
           
         }
       });
     }
   }




      res.render('viewProduct', { user: true, productsAll: allProducts, products: product,eligible,productId:product[0]._id,allReview,reviews,page,iswishlist});

    } catch (err) {
      
    }
  },

  // addd reviews........................
  addReview:async(req,res)=>{
    try{
      const productId=req.params.id;
     const userId=req.session.userId;
      
      const {
        star,
        name,
        email,
        title,
        review
      }=req.body
      const date=new Date();
      var month = date.getUTCMonth() + 1; //months from 1-12
      var day = date.getUTCDate();
      var year = date.getUTCFullYear();
      var newdate = day + "/" + month + "/" + year;
      const obj={
        userId:mongodb.ObjectId(userId),
        username:name,
        userEmail:email,
        reviewTitle:title,
        reviewDescription:review,
        rating:parseInt(star),
        createdOn:newdate,
        date:date,
      }
      const reviewlist=await db.getdb().collection('reviews').findOne({productId:mongodb.ObjectId(productId)});
      if(reviewlist){
        
        await db.getdb().collection('reviews').updateOne({productId:mongodb.ObjectId(productId)},{$set:{totalRating:0},$inc:{totalReviews:1},$push:{reviews:obj}})
      }else{
        await db.getdb().collection('reviews').insertOne({productId:mongodb.ObjectId(productId),totalRating:0,totalReviews:1,reviews:[obj]})
        
      }
      const newReviewlist=await db.getdb().collection('reviews').findOne({productId:mongodb.ObjectId(productId)});
    
      const count=newReviewlist.totalReviews
      
      const agg = [
        {
          '$match': {
            'productId': mongodb.ObjectId(productId)
          }
        }, {
          '$unwind': {
            'path': '$reviews'
          }
        }, {
          '$group': {
            '_id':  mongodb.ObjectId(productId), 
            'total': {
              '$sum': '$reviews.rating'
            }
          }
        }
      ];

      const totalRating=await db.getdb().collection('reviews').aggregate(agg).toArray();
      const finalRating=Math.round((totalRating[0].total)/count)
      await db.getdb().collection('reviews').updateOne({productId:mongodb.ObjectId(productId)},{$set:{totalRating:finalRating}})

      res.redirect('back')
    }catch(err){
      
    }
  },

  // user cart page.............................................................................

  userCart: async (req, res) => {
    try {

      const userId = req.session.userId;
      // 
      // const length=await db.getdb().collection('cart').findOne({userId:mongodb.ObjectId(userId)})
      // 
      // 

      // const total=length.products.length


      const cartItems = await db
        .getdb()
        .collection('cart')
        .aggregate([
          {
            '$match': {
              'userId': mongodb.ObjectId(userId)
            }
          }, {
            '$unwind': {
              'path': '$products',
              'preserveNullAndEmptyArrays': false
            }
          }, {
            '$lookup': {
              'from': 'products',
              'localField': 'products.productId',
              'foreignField': '_id',
              'as': 'product'
            }
          }, {
            '$project': {
              'userId': '$userId',
              'products': '$products',
              'product': {
                '$arrayElemAt': [
                  '$product', 0
                ]
              }
            }
          }, {
            '$group': {
              '_id': '$userId',
              'products': {
                '$push': {
                  'productDetails': '$product',
                  'count': '$products.quantity',
                  'subTotal': {
                    '$sum': {
                      '$multiply': [
                        '$products.quantity', '$product.offerprice'
                      ]
                    }
                  }
                }
              },
              'total': {
                '$sum': {
                  '$multiply': [
                    '$products.quantity', '$product.offerprice'
                  ]
                }
              }
            }
          }
        ])
        .toArray();

      // 


      // const cart=await db.getdb().collection('cart').findOne({},{userid:mongodb.ObjectId(userId)})
      if (!cartItems.length) {
        
        res.render('cart', { user: true, emptyCart: true, stylesheet: 'userCart.css', cartlogo: "0" })
      } else {
        if(req.session.stockErr){
          
          res.render('cart', { stylesheet: 'userCart.css', user: true, cartProducts: cartItems[0].products, carttotal: cartItems[0],stockErr:req.session.stockErr })
          req.session.stockErr=null;
        }else{
          res.render('cart', { stylesheet: 'userCart.css', user: true, cartProducts: cartItems[0].products, carttotal: cartItems[0] })
        }


      }

    } catch (err) {
      
    }

  },

  // /cart number show user common..........................................
  cartnumber: async (req, res) => {
    try {
      const userId = req.session.userId;
      // 
      const length = await db.getdb().collection('cart').findOne({ userId: mongodb.ObjectId(userId) })
      // 
      if (length) {
        const total = length.products.length
        if (total) {
          res.json({
            status: total,
          })
        } else {
          res.json({
            status: '0',
          })
        }

      } else {
        res.json({
          status: '0',
        })
      }


    } catch (err) {
      
    }
  },

  // cart count...................................................................

  changeQuantity: async (req, res, next) => {
    
    const user = req.session.userId;
    const product = req.body.productId;
    const count = parseInt(req.body.count);

    try {
      if (req.body.count == -1 && req.body.quantity == 1) {
        const prod = await db
          .getdb()
          .collection('cart')
          .updateOne(
            { userId: mongodb.ObjectId(user) },
            {
              $pull: { products: { productId: mongodb.ObjectId(product) } },
            }
          );


        // req.status = "removeProduct";
        res.json({
          status: 'removeProduct',
        })


      } else {
        const products = await db
          .getdb()
          .collection('cart')
          .updateOne(
            { userId: mongodb.ObjectId(user), "products.productId": mongodb.ObjectId(product) },
            {
              $inc: { "products.$.quantity": count },
            }
          );

        res.json({
          status: 'success',
        })


      }
      // next();
    } catch (err) {
      
    }
  },

  // //function to get the total amount of all products in the cart

  checkout: async (req, res) => {
    try {

      const userId = req.session.userId;
      const address = await db.getdb().collection('users').findOne({ _id: mongodb.ObjectId(userId) })
      let addresslist;
      if(address.addresses){
        if(address.addresses.length<1){
          addresslist=true;
        }else{
          addresslist=false; 
        }
      }else{
        addresslist=true;
      }
      // 
      // 
      const cartItems = await db
        .getdb()
        .collection('cart')
        .aggregate([
          {
            '$match': {
              'userId': mongodb.ObjectId(userId)
            }
          }, {
            '$unwind': {
              'path': '$products',
              'preserveNullAndEmptyArrays': false
            }
          }, {
            '$lookup': {
              'from': 'products',
              'localField': 'products.productId',
              'foreignField': '_id',
              'as': 'product'
            }
          }, {
            '$project': {
              'userId': '$userId',
              'products': '$products',
              'product': {
                '$arrayElemAt': [
                  '$product', 0
                ]
              }
            }
          }, {
            '$group': {
              '_id': '$userId',
              'products': {
                '$push': {
                  'productDetails': '$product',
                  'count': '$products.quantity',
                  'subTotal': {
                    '$sum': {
                      '$multiply': [
                        '$products.quantity', '$product.offerprice'
                      ]
                    }
                  }
                }
              },
              'total': {
                '$sum': {
                  '$multiply': [
                    '$products.quantity', '$product.offerprice'
                  ]
                }
              }
            }
          }
        ])
        .toArray();
      if (!cartItems[0]) {
        res.redirect('/cart')
      } else {
        let a=0
        const stockfinal=cartItems[0].products.find((product)=>{
          if(product.productDetails.stocks-product.count<0)
          return a++;
        })
        
        
        if(a>0){
          req.session.stockErr="The product or Product Quantity in your cart is Out of Stock..Please remove the Product to proceed.."
          res.redirect('/cart')
        }else{

       
        const wallet=await db.getdb().collection('wallet').findOne({userId:mongodb.ObjectId(userId)})
        const final=parseInt(wallet.walletBalance)-parseInt(cartItems[0].total);
        if(final>=0){
          res.render('checkout', { stylesheet: "checkout.css", user: true, productsjs: "a", carttotal: cartItems[0], addresses: address.addresses,final:true,addresslist});
          
        }else{
          res.render('checkout', { stylesheet: "checkout.css", user: true, productsjs: "a", carttotal: cartItems[0], addresses: address.addresses,addresslist});

        }
      }
      }
    } catch (err) {
      
    }
  },


  // apply coupon.....................................
  applyCoupon:async(req,res)=>{
    try{
      const userId=req.session.userId
      const coupon=req.body.coupon;
      
      const couponDetails=await db.getdb().collection('coupons').findOne({coupon:coupon})
      if(couponDetails){
        const user=await db.getdb().collection('coupons').findOne({coupon:coupon,'users.userId':mongodb.ObjectId(userId)})
       
        if(user){
          res.json({
            status:'used',
            message:'Coupon have been Already redeemed by user..',
          })


        }else{

        
        const date=new Date();
        
        
        if(date<new Date(couponDetails.expiresOn)){
          const discount=couponDetails.discount;
          res.json({
            status:'success',
            message:'Coupon Applied Successfully..',
            discount,
            coupon
          
          })
         
        }else{
          
          res.json({
            status:'Expired',
            message:'Coupon you have entered is Expired *'
          })
        }
      }
        // const discount=couponDetails.discount
      }else{
        
        res.json({
          status:'Invalid',
          message:'Coupon you have entered is Invalid *'
        })
      }

    }catch(err){
      
    }
  },

  // user save address..................................................................

  saveAddress: async (req, res) => {
    
    try {
      const obj = {
        address_id: mongodb.ObjectId(),
        firstname: req.body.firstname,
        lastname: req.body.lastname,
        state: req.body.state,
        address: req.body.address,

        city: req.body.city,
        pincode: req.body.pincode,
        email: req.body.email,
        number: req.body.number
      }
      
      const user = req.session.userId;
      await db.getdb().collection('users').updateOne({ _id: mongodb.ObjectId(user) }, { $push: { addresses: obj } }, { upsert: true })
      res.redirect('back')
    } catch (err) {
      
    }
  },

  // user account page.............................
  userAccount: async (req, res) => {
    try {
      const userId = req.session.userId;
      await db.getdb().collection('orders').deleteMany({orderstatus:'Pending'});
      const finalOrder = await db.getdb().collection('orders').find({ userId: mongodb.ObjectId(userId) }).toArray()
      if(finalOrder.length>0){

      
      let pageNo;
      if (req.query?.p) {
        pageNo = req.query.p - 1 || 0;
      }else{
        pageNo=0
      }
      const limit = 6;
      const order = await db.getdb().collection('orders').find({ userId: mongodb.ObjectId(userId) }).skip(pageNo * limit).limit(limit).sort({ "_id": -1 }).toArray()
      let max = finalOrder.length / 6;
      let m = Math.ceil(max);
      let page = [];
      for (let i = 1; i <= m; i++) {
        page.push(i);
      }
      res.render('userAccount', { user: true, orders: order ,page})
    }else{
      let emptyOrder=true
      res.render('userAccount', { user: true, emptyOrder})

    }
   
      // 
    } catch (err) {
      
    }
  },

  // single order details page in user side...........................................
  orderDetails: async (req, res) => {
    try {
      const userId = req.session.userId;
      const trackingId = req.params.id;
      const orderDetails = await db.getdb().collection('orders').findOne({ tracking_id: mongodb.ObjectId(trackingId) })
      

      const agg = [
        {
          '$match': {
            'tracking_id':mongodb.ObjectId(trackingId)
          }
        }, {
          '$unwind': {
            'path': '$product'
          }
        }, {
          '$match': {
            'product.cancelled': true
          }
        }, {
          '$project': {
            'subTotal': '$product.afterDiscountSubTotal', 
            'total': '$afterDicountTotal'
          }
        }, {
          '$group': {
            '_id': '$total', 
            'sum': {
              '$sum': '$subTotal'
            }
          }
        }
      ];
      const cancelled = await db
      .getdb()
      .collection('orders')
      .aggregate(agg).toArray();

      res.render('orderDetails', { user: true, orderDetails: orderDetails,cancelTotal:cancelled })
    } catch (err) {
      
    }
  },

  // user account addresses.............................................................

  userAddresses: async (req, res) => {
    try {
      const userId = req.session.userId;
      // 
      const addresslist = await db.getdb().collection('users').findOne({ _id: mongodb.ObjectId(userId) })
      // 
      res.render('userAddresses', { user: true, addresslist: addresslist.addresses })
    } catch (err) {
      
    }
  },

  // add adress in user account page..........................................

  addAddress: async (req, res) => {
    try {
      res.render('userAddAddress', { user: true })

    } catch (err) {
      
    }
  },

  // address edit (post method) option in useraccount page addresses...................................
  addUserAddress: async (req, res) => {
    try {
      const obj = {
        address_id: mongodb.ObjectId(),
        firstname: req.body.firstname,
        lastname: req.body.lastname,
        state: req.body.state,
        address: req.body.address,

        city: req.body.city,
        pincode: req.body.pincode,
        email: req.body.email,
        number: req.body.number
      }
      
      const user = req.session.userId;
      await db.getdb().collection('users').updateOne({ _id: mongodb.ObjectId(user) }, { $push: { addresses: obj } }, { upsert: true })
      res.redirect('/addresses')


    } catch (err) {
      
    }
  },

  editAddress: async (req, res) => {
    try {
      const userId = req.session.userId;
      const addressId = req.params.id;

      const agg = [
        {
          $match: {
            _id: mongodb.ObjectId(userId),
          },
        },
        {
          $unwind: {
            path: "$addresses",
          },
        },
        {
          $match: {
            "addresses.address_id": mongodb.ObjectId(addressId),
          },
        },
      ];
      const address = await db
        .getdb()
        .collection('users')
        .aggregate(agg)
        .toArray();

      res.render('userAddAddress', { user: true, address: address[0].addresses, editaddress: true })

    } catch (err) {
      
    }
  },

  // save the sdited address...............................................

  editSaveAddress: async (req, res) => {
    try {
      const userId = req.session.userId;
      const addressId = req.params.id;

      const saved = await db.getdb().collection('users').updateOne({ 'addresses.address_id': mongodb.ObjectId(addressId) }, {
        $set: {

          'addresses.$.firstname': req.body.firstname,
          'addresses.$.lastname': req.body.lastname,
          'addresses.$.state': req.body.state,
          'addresses.$.address': req.body.address,
          'addresses.$.city': req.body.city,
          'addresses.$.pincode': req.body.pincode,
          'addresses.$.email': req.body.email,
          'addresses.$.number': req.body.number
        }
      });

      res.redirect('/addresses')

    }
    catch (err) {
      
    }
  },

  // remove user adress in user page.........................................................

  removeUserAddress: async (req, res) => {
    try {

      // 
      const user = req.session.userId;
      const addressId = req.params.id;
      // 
      await db.getdb().collection('users').updateOne({ _id: mongodb.ObjectId(user) }, { $pull: { addresses: { address_id: mongodb.ObjectId(addressId) } } });
      res.redirect('/addresses')
    } catch (err) {
      
    }
  },


  // user wallet page.................................................

  userWallet: async (req, res) => {
    try {
      const deleted=await db.getdb().collection('wallet').find({'transactions.status':"pending"}).toArray();
      
      if (deleted.length>0){
        await db.getdb().collection('wallet').updateMany({},{$pull:{transactions:{status:"pending"}}});
      }
      
      const userId = req.session.userId;
      const wallet = await db.getdb().collection('wallet').findOne({ userId: mongodb.ObjectId(userId) })
      let pageNo;
      if (req.query?.p) {
        pageNo = req.query.p - 1 || 0;
      }else{
        pageNo=0
      }
      
      const limit = 6;
      const finalskip=pageNo*limit
      const agg = [
        {
          '$match': {
            'userId': mongodb.ObjectId(userId)
          }
        }, {
          '$unwind': {
            'path': '$transactions'
          }
        }, {
          '$sort': {
            'transactions.transactionId': -1
          }
        }, {
          '$skip': finalskip
        }, {
          '$limit': limit
        }, {
          '$group': {
            '_id': '$walletAmount', 
            'transactions': {
              '$push': '$transactions'
            }
          }
        }
      ];
      
      const transact=await db.getdb().collection('wallet').aggregate(agg).toArray()

      const aggr = [
        {
          '$match': {
            'userId':mongodb.ObjectId(userId)
          }
        }, {
          '$unwind': {
            'path': '$transactions'
          }
        }, {
          '$sort': {
            'transactions.transactionId': -1
          }
        }, {
          '$group': {
            '_id': '$walletAmount', 
            'transactions': {
              '$push': '$transactions'
            }
          }
        }
      ];

      const finaltransact=await db.getdb().collection('wallet').aggregate(aggr).toArray()

                      // to get number of page

let pagination;
if(finaltransact.length>0){
  if(finaltransact[0].transactions){
pagination=finaltransact[0].transactions.length / 6
  }else{
    pagination=0;
  }
}

    let max = pagination;
    let m = Math.ceil(max);
    let page = [];
    for (let i = 1; i <= m; i++) {
      page.push(i);
    }

      
      if (req.session.transferError) {
        res.render('userWallet', { user: true, wallet, transferError: req.session.transferError,transact,page });
        req.session.transferError = null;

      } else if (req.session.transfer) {
        res.render('userWallet', { user: true, wallet, transfer: req.session.transfer,transact,page });
        req.session.transfer = null
      }
      res.render('userWallet', { user: true, wallet,transact,page });

    } catch (err) {
      
    }
  },

  // user add money wallet page.................................................

  addMoneyWallet: async (req, res) => {
    try {

      const amount = parseInt(req.body.amount);
      const userId = req.session.userId;
      const reason = 'added wallet balance (razorpay)'
      var dateObj = new Date();
      var month = dateObj.getUTCMonth() + 1; //months from 1-12
      var day = dateObj.getUTCDate();
      var year = dateObj.getUTCFullYear();

      var newdate = day + "/" + month + "/" + year;
      const wallet = await db.getdb().collection('wallet').findOne({ userId: mongodb.ObjectId(userId) })
      if (wallet) {
        const transactionId = new mongodb.ObjectId();
        const result = await db.getdb().collection('wallet').updateOne({ userId: mongodb.ObjectId(userId) }, { $push: { transactions: { transactionId: transactionId, amount: amount,date:newdate,reason: reason, type: 'credited', status: "pending" } } })
        


        const orderid = transactionId.toString();
        
        req.session.transactionId = orderid;


        try {
          let Order = await instance.orders.create({
            amount: amount * 100,
            currency: "INR",
            receipt: transactionId.toString(),
          });
          

          res.json({
            Order,
          });
        } catch (err) {
          res.json({
            status: "error in payment",
          });
        }


      } else {
        res.json({
          status: "error in finding user wallet",
        });
      }
    } catch (err) {
      res.json({
        status: "error in finding route",
      });
    }
  },

  // verify wallet payment...................................................

  verifyWalletPayment: async (req, res) => {
    try {
      const userId = req.session.userId
      
      const details = req.body;
      const objId = req.body["order[Order][receipt]"];
      const amount = parseInt(req.body["order[Order][amount]"]) / 100;
      

      let hmac = crypto.createHmac("sha256", process.env.YOUR_KEY_SECRET);
      hmac.update(
        details["payment[razorpay_order_id]"] +
        "|" +
        details["payment[razorpay_payment_id]"]
      );
      hmac=hmac.digest('hex')
      
      if (hmac == details["payment[razorpay_signature]"]) {
        const result = await db
          .getdb()
          .collection('wallet')
          .updateOne(
            { userId: mongodb.ObjectId(userId), 'transactions.transactionId': mongodb.ObjectId(objId) },
            {
              $set: { 'transactions.$.status': "Confirmed" },
            }
          );
        const userwallet = await db.getdb().collection('wallet').findOne({ userId: mongodb.ObjectId(userId) })
        if (userwallet) {
          const beforeAmount = userwallet.walletBalance
          const afterAmount = beforeAmount + amount

          await db.getdb().collection('wallet').updateOne({ userId: mongodb.ObjectId(userId) }, { $set: { walletBalance: afterAmount } })
        }


        

        res.json({ status: true });
      } else {
        
        res.json({ status: false });
      }


    } catch (err) {
      console.log(err)
    }
  },

  // wallet fund transfer....................................
  transferWalletBalance: async (req, res) => {
    try {
      const userId = req.session.userId
      const trasfermail = (req.body.email).toLowerCase().trim();
      const amount = parseInt(req.body.amount);
      const user = await db.getdb().collection('users').findOne({ _id: mongodb.ObjectId(userId) })
      const transferUser = await db.getdb().collection('users').findOne({ email: trasfermail })
      // 
      // 
      // 
    
      var dateObj = new Date();
      var month = dateObj.getUTCMonth() + 1; //months from 1-12
      var day = dateObj.getUTCDate();
      var year = dateObj.getUTCFullYear();

      var newdate = day + "/" + month + "/" + year;
      if (transferUser) {
        const userwallet=await db.getdb().collection('wallet').findOne({userId:mongodb.ObjectId(user._id)});
        // 

        if(userwallet.walletBalance>=amount){

          
          await db.getdb().collection('wallet').updateOne({ userId: mongodb.ObjectId(transferUser._id) }, { $inc: { walletBalance: amount } })
          await db.getdb().collection('wallet').updateOne({ userId: mongodb.ObjectId(transferUser._id) }, { $push: { transactions: { transactionId: new mongodb.ObjectId(), amount: amount,date:newdate, reason: `Receieved from ${user.email}`, type: 'credited', status: "Confirmed" } } })
          
          await db.getdb().collection('wallet').updateOne({ userId: mongodb.ObjectId(userId) }, { $inc: { walletBalance: -(amount) } })
          await db.getdb().collection('wallet').updateOne({ userId: mongodb.ObjectId(userId) }, { $push: { transactions: { transactionId: new mongodb.ObjectId(), amount: amount,date:newdate, reason: `Transfered to ${trasfermail}`, type: 'debited', status: "Confirmed" } } })
          
          req.session.transfer = "Transfer Successful"
          res.redirect('/userWallet')
        }else{
          req.session.transferError = "Transfer amount is greater than wallet Balance *"
          res.redirect('/userWallet')

        }
      } else {
        req.session.transferError = "Recipient user doesn't exists *"
        res.redirect('/userWallet')
      }


    } catch (err) {
      
    }
  },


  // returning product.............................................................

  returnProduct: async (req, res) => {
    try {
      const productId = req.params.id;
      const trackingId=req.body.trackid;
      
      const orderlist = await db.getdb().collection('orders').findOne({ tracking_id: mongodb.ObjectId(trackingId) })
      
      const productCount = orderlist.product.length;

      await db.getdb().collection('orders').updateOne({ tracking_id: mongodb.ObjectId(trackingId), 'product.productDetails._id': mongodb.ObjectId(productId) }, { $set: { 'product.$.returned': true }})
      const order = await db.getdb().collection('orders').findOne({ tracking_id: mongodb.ObjectId(trackingId), 'product.productDetails._id': mongodb.ObjectId(productId) });
      
      
      
      const amount = order.product[0].afterDiscountSubTotal
      
      if (orderlist.payment.method != "COD") {
        var dateObj = new Date();
        var month = dateObj.getUTCMonth() + 1; //months from 1-12
        var day = dateObj.getUTCDate();
        var year = dateObj.getUTCFullYear();
  
        var newdate = day + "/" + month + "/" + year;
        await db.getdb().collection('wallet').updateOne({ userId: mongodb.ObjectId(userId) }, { $inc: { walletBalance: amount } })
        const reason=`refunded for return of a product order #${trackingId}`
        const transactionId = new mongodb.ObjectId();
        await db.getdb().collection('wallet').updateOne({ userId: mongodb.ObjectId(userId) }, { $push: { transactions: { transactionId: transactionId, amount: amount,date:newdate, reason: reason, type: 'credited', status: "Confirmed" } } })
        await db.getdb().collection('orders').updateOne({ tracking_id: mongodb.ObjectId(trackingId), 'product.productDetails._id': mongodb.ObjectId(productId) }, { $set: { 'product.$.refunded': true } })

      }else{
        
      }

      const agg = [
        {
          '$match': {
            'tracking_id': mongodb.ObjectId(trackingId),
          }
        }, {
          '$unwind': {
            'path': '$product'
          }
        }, {
          '$match': {
            'product.returned': true
          }
        }
      ];

      const returned = await db
        .getdb()
        .collection('orders')
        .aggregate(agg).toArray();
      const returnedProduct = returned.length;
      // 


      if (productCount === returnedProduct) {
        await db.getdb().collection('orders').updateOne({ tracking_id: mongodb.ObjectId(trackingId) }, { $set: { orderstatus: "Returned" } })
        res.redirect('/userAccount')
      } else {
        // i am here using the template literal method to pass the req.params.id (trackingid of order) to go back to same page....
        //  we can use just res.redirect('back') here....
        res.redirect(`/orderDetails/${trackingId}`)
      }

    } catch (err) {
      
    }
  },


  // user refer and earn page..........................................
  ReferAndEarn: async (req, res) => {
    try {
      const userId = req.session.userId;
      const referral = await db.getdb().collection('referral').findOne({})
      const userdetail = await db.getdb().collection('users').findOne({ _id: mongodb.ObjectId(userId) })
      res.render('ReferAndEarn', { user: true, userdetail,referral })

    } catch (err) {
      
    }
  },


  // user profile in user page.....................................

  userProfile: async (req, res) => {
    try {
      const user = req.session.userId
      const userdetail = await db.getdb().collection('users').findOne({ _id: mongodb.ObjectId(user) })
      res.render('userProfile', { user: true, user: userdetail })

    } catch (err) {
      
    }
  },

  // edit user profile in user account.................................................

  edituserProfile: async (req, res) => {
    try {
      const user = req.session.userId
      const userdetail = await db.getdb().collection('users').findOne({ _id: mongodb.ObjectId(user) })
      res.render('userProfile', { user: true, user: userdetail, edit: true })

    } catch (err) {
      
    }
  },


  // edit user profile in user account.................................................

  editUserDetails: async (req, res) => {
    try {
      const user = req.session.userId;
      const {
        name,
        email,
        number
      } = req.body
      await db.getdb().collection('users').updateOne({ _id: mongodb.ObjectId(user) }, { $set: { name, email, number } })
      res.redirect('/personalDetails')

    } catch (err) {
      
    }
  },
  // user password change in user account...............................................

  changePassword: async (req, res) => {
    try {
      res.render('userProfile', { user: true, password: true })
    } catch (err) {
      
    }
  },

  // user password change in user account post request...............................................

  changeuserPassword: async (req, res) => {
    try {
      const oldpassword = req.body.oldpassword;
      const newpassword = req.body.password;
      const userId = req.session.userId;
      const user = await db.getdb().collection('users').findOne({ _id: mongodb.ObjectId(userId) })

      const validation = await bcrypt.compare(oldpassword, user.password);

      if (validation) {
        const hashedPassword = await bcrypt.hash(newpassword, 12);
        const logintime = new Date();
        await db.getdb().collection('users').updateOne({ _id: mongodb.ObjectId(userId) }, { $set: { password: hashedPassword, passwordChangedAt: logintime } }, { upsert: true })
        req.session.login = true;
        const newlogintime = new Date();
        req.session.logintime = newlogintime;
        req.session.userId = user._id;
        res.redirect('/personalDetails')
      } else {

        res.redirect('back')

      }
    } catch (err) {
      
    }
  },

  // place order..................................................

  placeOrder: async (req, res) => {
    
    const addressId = req.body.address;
    const userId = req.session.userId;
    const userDetail=await db.getdb().collection('users').findOne({ _id: mongodb.ObjectId(userId) })
    try {
      //----------to get shipping address----------
      const agg = [
        {
          $match: {
            _id: mongodb.ObjectId(userId),
          },
        },
        {
          $unwind: {
            path: "$addresses",
          },
        },
        {
          $match: {
            "addresses.address_id": mongodb.ObjectId(addressId),
          },
        },
      ];
      const address = await db
        .getdb()
        .collection('users')
        .aggregate(agg)
        .toArray();

      
      // got the address of user..........................

      var dateObj = new Date();
      var month = dateObj.getUTCMonth() + 1; //months from 1-12
      var day = dateObj.getUTCDate();
      var year = dateObj.getUTCFullYear();

      var newdate = day + "/" + month + "/" + year;

      //-----------get cart items------------------



      const aggr = [
        {
          '$match': {
            'userId': mongodb.ObjectId(userId)
          }
        }, {
          '$unwind': {
            'path': '$products',
            'preserveNullAndEmptyArrays': false
          }
        }, {
          '$lookup': {
            'from': 'products',
            'localField': 'products.productId',
            'foreignField': '_id',
            'as': 'product'
          }
        }, {
          '$project': {
            'userId': '$userId',
            'products': '$products',
            'product': {
              '$arrayElemAt': [
                '$product', 0
              ]
            }
          }
        }, {
          '$group': {
            '_id': '$userId',
            'products': {
              '$push': {
                'productDetails': '$product',
                'count': '$products.quantity',
                'subTotal': {
                  '$sum': {
                    '$multiply': [
                      '$products.quantity', '$product.offerprice'
                    ]
                  }
                },
                'cancelled': false,
                'returned': false,
                'refunded': false
              }
            },
            'total': {
              '$sum': {
                '$multiply': [
                  '$products.quantity', '$product.offerprice'
                ]
              }
            }
          }
        }
      ]
      const cartItems = await db
        .getdb()
        .collection('cart')
        .aggregate(aggr).toArray();
      //   [
      //   {
      //     '$match': {
      //       'userId': mongodb.ObjectId(userId)
      //     }
      //   }, {
      //     '$unwind': {
      //       'path': '$products', 
      //       'preserveNullAndEmptyArrays': false
      //     }
      //   }, {
      //     '$lookup': {
      //       'from': 'products', 
      //       'localField': 'products.productId', 
      //       'foreignField': '_id', 
      //       'as': 'product'
      //     }
      //   }, {
      //     '$project': {
      //       'userId': '$userId', 
      //       'products': '$products', 
      //       'product': {
      //         '$arrayElemAt': [
      //           '$product', 0
      //         ]
      //       }
      //     }
      //   }, {
      //     '$group': {
      //       '_id': '$userId', 
      //       'products': {
      //         '$push': {
      //           'productDetails': '$product', 
      //           'count': '$products.quantity', 
      //           'subTotal': {
      //             '$sum': {
      //               '$multiply': [
      //                 '$products.quantity', '$product.offerprice'
      //               ]
      //             }
      //           }
      //         }
      //       },
      //       'total': {
      //         '$sum': {
      //           '$multiply': [
      //             '$products.quantity', '$product.offerprice'
      //           ]
      //         }
      //       }
      //     }
      //   }
      // ])

      
      
      let discAmount;
      let afterDisc;
      let discount;
      if (req.body.coupon) {
        const result = await db
          .getdb()
          .collection('coupons')
          .findOne({ coupon: req.body.coupon });

         discount = result.discount;
        
        
        // the price discount we get.....

        // const discountingPrice=Math.round(cartItems[0].total-(cartItems[0].total * discount / 100));

        discAmount = Math.round((cartItems[0].total * discount) / 100);

        afterDisc = cartItems[0].total - discAmount;
        // const productDiscount = Math.round(discAmount / cartItems[0].products.length);

        cartItems[0].products.forEach((item) => {
          item.afterDiscountSubTotal = Math.round(item.subTotal - (item.subTotal*discount/100));
        });




        

        //get user details
        const user = await db
          .getdb()
          .collection('users')
          .findOne({ _id:mongodb.ObjectId(userId) });


        const obj1 = {
          userId: user._id,
          email: user.email,
          name: user.name,
        };
        //updating coupon
        await db
          .getdb()
          .collection('coupons')
          .updateOne(
            { coupon: req.body.coupon },
            {
              $push: {
                users: obj1,
              },
            }
          );




      }else{
        cartItems[0].products.forEach((item) => {
          item.afterDiscountSubTotal =item.subTotal;
        });
      }

    

      

      if (req.body.payment === 'COD') {
        var paymentStatus = "Confirmed";
      }
      else if (req.body.payment === "wallet") {
        var paymentStatus = "Confirmed";
      }
       else if (req.body.payment === "paypal") {
        var paymentStatus = "Pending";
      }
       else {
        var paymentStatus = "Pending";
      }

      // 
      // if (cartItems[0].products.length > 1) {
      //   await Promise.all(
      //     cartItems[0].products.map(async (cartItem) => {
      //       const obj = {
      //         userId: mongodb.ObjectId(req.session.userId),
      //         tracking_id:new mongodb.ObjectId(),
      //         ordered_on: newdate,
      //         address: address[0].addresses,
      //         payment: {
      //           method: req.body.payment,
      //         },
      //         orderstatus: paymentStatus,
      //         product: cartItem.productDetails,
      //         quantity: cartItem.count,
      //         total: cartItem.subTotal,
      //       };
      //       return await db
      //       .getdb()
      //       .collection('orders')
      //       .insertOne(obj);
      //     })
      //   );
      // } 
      // else {
      //   // -----------creating order Single item-------------
      //   
      //   const obj = {
      //     userId: mongodb.ObjectId(req.session.userId),
      //     tracking_id:new mongodb.ObjectId(),
      //     ordered_on: newdate,
      //     address: address[0].addresses,

      //     payment: {
      //       method: req.body.payment,
      //     },
      //     orderstatus: paymentStatus,

      //     product: cartItems[0].products[0].productDetails,
      //     quantity: cartItems[0].products[0].count,
      //     total: cartItems[0].total,
      //   };

      //   var order = await db
      //     .getdb()
      //     .collection('orders')
      //     .insertOne(obj);
      // }
      let couponcode=req.body.coupon?req.body.coupon:null;
      

      

      const obj = {
        userId: mongodb.ObjectId(req.session.userId),
        tracking_id: new mongodb.ObjectId(),
        date:new Date(),
        ordered_on: newdate,
        address: address[0].addresses,
        payment: {
          method: req.body.payment,
        },
        orderstatus: paymentStatus,
        product: cartItems[0].products,
        total:cartItems[0].total,
        discountAmount:discAmount ?? 0,
        couponDiscount:discount ?? false,
        couponApplied:couponcode,
        afterDicountTotal: afterDisc ?? cartItems[0].total
      };
      


      if(req.body.payment === "wallet"){
        const wallet=await db.getdb().collection('wallet').findOne({userId:mongodb.ObjectId(userId)})
        if(!wallet){
          res.json({
            err:"Wallet Balance is Zero *"
          })
        }else if(wallet.walletBalance < (afterDisc || cartItems[0].total)){
          res.json({
            err:"wallet Balance is insufficient for Order *"
          })

        }else{
          const order = await db
          .getdb()
          .collection('orders')
          .insertOne(obj);
          const trackingId=await db.getdb().collection('orders').findOne({_id:mongodb.ObjectId(order.insertedId)})
          // deducting from wallet after purchase
          const totalWallet =wallet.walletBalance - Math.floor(afterDisc || cartItems[0].total);

        const objc = {
          transactionId: order.insertedId,
          amount:Math.floor(afterDisc || cartItems[0].total),
          date: newdate,          
          reason: `purchase of order #${trackingId.tracking_id} `,
          type: "Debited",
          status:"Confirmed"
        };

        await db
          .getdb()
          .collection('wallet')
          .updateOne(
            { userId:mongodb.ObjectId(userId) },
            {
              $set: { walletBalance: totalWallet },
              $push: {
                transactions: objc,
              },
            }
          );

          // delete cart.............

          const deleteCart = await db
          .getdb()
          .collection('cart')
          .deleteMany({ userId: mongodb.ObjectId(userId) });

          var transporter = nodemailer.createTransport({
            service: 'gmail',
            auth: {
              user: process.env.EMAIL,
              pass: process.env.PASSWORD
            }
          });
          
          var mailOptions = {
            from: process.env.EMAIL,
            to: userDetail.email,
            subject: 'Thanks for Purchasing from Auverse',
            text: `Hi ${userDetail.name}, thank you for purchasing from Auverse.
                    Your order ${trackingId.tracking_id} have been confirmed and will be delivered soon...`
            // html: '<h1>Hi Smartherd</h1><p>Your Messsage</p>'        
          };
          
          transporter.sendMail(mailOptions, function(error, info){
            if (error) {
              
            } else {
              
            }
          });

          req.session.order = true;
            res.json({
              status:"wallet"
            })
        }
       
       

      }else if (req.body.payment === "COD") {


        const order = await db.getdb().collection('orders').insertOne(obj);

        const orderid = order.insertedId.toString();
        req.session.orderId = orderid;
      
        var transporter = nodemailer.createTransport({
          service: 'gmail',
          auth: {
            user: process.env.EMAIL,
            pass: process.env.PASSWORD
          }
        });
        
        var mailOptions = {
          from: process.env.EMAIL,
          to: userDetail.email,
          subject: 'Thanks for Purchasing from Auverse',
          text: `Hi ${userDetail.name}, thank you for purchasing from Auverse.
                  Your order ${orderid} have been confirmed and will be delivered soon...`
          // html: '<h1>Hi Smartherd</h1><p>Your Messsage</p>'        
        };
        
        transporter.sendMail(mailOptions, function(error, info){
          if (error) {
            
          } else {
            
          }
        });

        
        const deleteCart = await db
          .getdb()
          .collection('cart')
          .deleteMany({ userId: mongodb.ObjectId(userId) });

        req.session.order = true;
        res.json({
          status: "codconfirmed"
        })

      }else if (req.body.payment === "razorpay") {
        const order = await db.getdb().collection('orders').insertOne(obj);
        // const orderid = order.insertedId.toString();
        // req.session.orderId = orderid;
        const orderid = order.insertedId.toString();
        
        req.session.orderId = orderid;
        
        let final;
        if(afterDisc <= cartItems[0].total){
          final=afterDisc;
        }else{
          final=cartItems[0].total
        }
        // res.redirect('/orderStatus')
        try {
          let Order = await instance.orders.create({
            amount: final * 100,
            currency: "INR",
            receipt: order.insertedId.toString(),
          });
          
          res.json({
            Order
          });
        } catch (err) {
          
        }

      } else if (req.body.payment === "paypal") {
        const order = await db.getdb().collection('orders').insertOne(obj);
        const orderid = order.insertedId.toString();
        req.session.orderId = orderid;
        try {
          const cartItems = await db
            .getdb()
            .collection('cart')
            .aggregate(aggr).toArray();

          // needed to change when have discount
          let final;
          if(afterDisc <= cartItems[0].total){
            final=afterDisc;
          }else{
            final=cartItems[0].total
          }
          let amount = final / 80;

          // creating json data for paypal

          const create_payment_json = {
            intent: "sale",
            payer: {
              payment_method: "paypal",
            },
            redirect_urls: {
              return_url: "http://localhost:3000/success",
              cancel_url: "http://localhost:3000/cancel",
            },
            transactions: [
              {
                item_list: {
                  items: [
                    {
                      name: "Red Sox Hat",
                      sku: req.session.userId,
                      price: Math.ceil(amount),
                      currency: "USD",
                      quantity: 1,
                    },
                  ],
                },
                amount: {
                  currency: "USD",
                  total: Math.ceil(amount),
                },
                description: "Hat for the best team ever",
              },
            ],
          };

          paypal.payment.create(create_payment_json, function (error, payment) {
            if (error) {
              

            } else {
              
              
              

              for (let i = 0; i < payment.links.length; i++) {
                if (payment.links[i].rel === "approval_url") {
                  res.json({ paypal: true, link: payment.links[i].href });
                }
              }
            }
          });


        } catch (err) {
          
        }

      }else{
        
      }


    } catch (err) {
      
    }

  },

  paypalsuccess: async (req, res) => {
    try {
      const userId = req.session.userId;
      const userDetail=await db.getdb().collection('users').findOne({_id:mongodb.ObjectId(userId)})
      const payerId = req.query.PayerID;
      const paymentId = req.query.paymentId;
      const orderId = req.session.orderId;
      
      const orderDetails = await db
        .getdb()
        .collection('orders')
        .findOne({ _id: mongodb.ObjectId(orderId) });
      
      let amount = Math.ceil(orderDetails.afterDicountTotal / 80);

      const execute_payment_json = {
        "payer_id": payerId,
        "transactions": [{
          "amount": {
            "currency": "USD",
            "total": amount
          }
        }]
      };

      paypal.payment.execute(paymentId, execute_payment_json, async function (error, payment) {
        if (error) {
          

        } else {
          
          

          const result = await db
            .getdb()
            .collection('orders')
            .updateOne(
              { _id: mongodb.ObjectId(orderId) },
              {
                $set: { orderstatus: "Confirmed" },
              }
            );

            var transporter = nodemailer.createTransport({
              service: 'gmail',
              auth: {
                user: process.env.EMAIL,
                pass: process.env.PASSWORD
              }
            });
            
            var mailOptions = {
              from: process.env.EMAIL,
              to: userDetail.email,
              subject: 'Thanks for Purchasing from Auverse',
              text: `Hi ${userDetail.name}, thank you for purchasing from Auverse.
                      Your order ${orderId} have been confirmed and will be delivered soon...`
              // html: '<h1>Hi Smartherd</h1><p>Your Messsage</p>'        
            };
            
            transporter.sendMail(mailOptions, function(error, info){
              if (error) {
                
              } else {
                
              }
            });


          req.session.orderId = null;
          const deleteCart = await db
            .getdb()
            .collection('cart')
            .deleteMany({ userId: mongodb.ObjectId(userId) });

          req.session.order = true;
          res.redirect('/orderStatus')


        }
      });
    } catch (err) {
      
    }
  },

  paypalcancel: async (req, res) => {
    try {
      res.redirect('/checkout')


    } catch (err) {

    }
  },

  // razorpay....................................

  verifyPayment: async (req, res) => {
    try {
      const userId = req.session.userId
      
      const details = req.body;
      const objId = req.body["order[Order][receipt]"];
      

      let hmac = crypto.createHmac("sha256", process.env.YOUR_KEY_SECRET);
      hmac.update(
        details["payment[razorpay_order_id]"] +
        "|" +
        details["payment[razorpay_payment_id]"]
      );
      
      if (hmac == details["payment[razorpay_signature]"]) {
        const result = await db
          .getdb()
          .collection('orders')
          .updateOne(
            { _id: mongodb.ObjectId(objId) },
            {
              $set: { orderstatus: "Confirmed" },
            }
          );

          const userDetail=await db.getdb().collection('users').findOne({_id:mongodb.ObjectId(userId)})

          var transporter = nodemailer.createTransport({
            service: 'gmail',
            auth: {
              user: process.env.EMAIL,
              pass: process.env.PASSWORD
            }
          });
          
          var mailOptions = {
            from: process.env.EMAIL,
            to: userDetail.email,
            subject: 'Thanks for Purchasing from Auverse',
            text: `Hi ${userDetail.name}, thank you for purchasing from Auverse.
                    Your order ${objId} have been confirmed and will be delivered soon...`
            // html: '<h1>Hi Smartherd</h1><p>Your Messsage</p>'        
          };
          
          transporter.sendMail(mailOptions, function(error, info){
            if (error) {
              
            } else {
              
            }
          });


        // ----------------------Deleting Cart Items-------------------
       
        const deleteCart = await db
          .getdb()
          .collection('cart')
          .deleteMany({ userId: mongodb.ObjectId(userId) });

        
        req.session.order = true;
        res.json({ status: true });
      } else {
        await db.getdb().collection('orders').deleteOne({_id:mongodb.ObjectId(objId)});

        
        res.json({ status: false });
      }

    } catch (err) {
      
    }
  },

  orderStatus: async (req, res) => {
    if (req.session.order) {
      res.render('orderStatus', { user: true })
      req.session.order = null;
    } else {
      res.redirect('/cart')

    }
  },

  // invoice generator..................................
  invoice: async (req, res) => {
    try {
      const trackingId = req.params.id;
      
      const orders = await db.getdb().collection('orders').findOne({ tracking_id: mongodb.ObjectId(trackingId) })
      
      const result = orders.product.filter(product => !product.cancelled).map(product => {
        const data = {
          quantity: product.count,
          description: product.productDetails.name,
          tax: 0,
          price: product.productDetails.price
        }
        return data;
      });
      

      res.json({
        status: 'success',
        result,
        orders
      })

    } catch (err) {
      
    }
  },

  userCancelOrder: async (req, res) => {
    try {
      const userId=req.session.userId;
      const trackingId = req.params.id;
      const agg = [
        {
          '$match': {
            'tracking_id': mongodb.ObjectId(trackingId)
          }
        }, {
          '$unwind': {
            'path': '$product'
          }
        }, {
          '$match': {
            'product.cancelled': false
          }
        }, {
          '$project': {
            'subTotal': '$product.afterDiscountSubTotal'
          }
        }, {
          '$group': {
            '_id': mongodb.ObjectId(trackingId), 
            'sum': {
              '$sum': '$subTotal'
            }
          }
        }
      ];

      
      var dateObj = new Date();
      var month = dateObj.getUTCMonth() + 1; //months from 1-12
      var day = dateObj.getUTCDate();
      var year = dateObj.getUTCFullYear();

      var newdate = day + "/" + month + "/" + year;

      const result=await db.getdb().collection('orders').aggregate(agg).toArray();
      
      const amount=result[0].sum;
      
      const orderlist = await db.getdb().collection('orders').findOne({ tracking_id: mongodb.ObjectId(trackingId) })
      if (orderlist.payment.method != "COD") {
        await db.getdb().collection('wallet').updateOne({ userId: mongodb.ObjectId(userId) }, { $inc: { walletBalance: amount } })
        await db.getdb().collection('orders').updateOne({ tracking_id: mongodb.ObjectId(trackingId) }, { $set: { orderstatus: "Cancelled" , 'product.$[].cancelled': true } })
        
        const reason=`refunded for cancellation of a product order #${trackingId}`
        const transactionId = new mongodb.ObjectId();
        await db.getdb().collection('wallet').updateOne({ userId: mongodb.ObjectId(userId) }, { $push: { transactions: { transactionId: transactionId, amount: amount,date:newdate, reason: reason, type: 'credited', status: "Confirmed" } } })
        res.redirect('/userAccount')
      } else{
        await db.getdb().collection('orders').updateOne({ tracking_id: mongodb.ObjectId(trackingId) }, { $set: { orderstatus: "Cancelled", 'product.$[].cancelled': true } })
        res.redirect('/userAccount')
      }
    } catch (err) {
      
    }
  },


  // user cancel single order..........................................
  userCancelSingleOrder: async (req, res) => {
    try {
      var dateObj = new Date();
      var month = dateObj.getUTCMonth() + 1; //months from 1-12
      var day = dateObj.getUTCDate();
      var year = dateObj.getUTCFullYear();

      var newdate = day + "/" + month + "/" + year;
      
      
      // const userId=req.session.userId
      const productId = req.params.id;
      const trackingId = req.body.trackid;
      const userId = req.session.userId
    
      const aggr = [
        {
          '$match': {
            'tracking_id': mongodb.ObjectId(trackingId)
          }
        }, {
          '$unwind': {
            'path': '$product'
          }
        }, {
          '$match': {
            'product.productDetails._id': mongodb.ObjectId(productId)
          }
        }, {
          '$project': {
            '_id': mongodb.ObjectId(trackingId), 
            'subtotal': '$product.afterDiscountSubTotal'
          }
        }, {
          '$group': {
            '_id': mongodb.ObjectId(trackingId), 
            'sum': {
              '$sum': '$subtotal'
            }
          }
        }
      ];
     
      const result=await db.getdb().collection('orders').aggregate(aggr).toArray()
      const amount=result[0].sum;
      const orderlist=await db.getdb().collection('orders').findOne({tracking_id:mongodb.ObjectId(trackingId)})
      if (orderlist.payment.method != "COD") {
        await db.getdb().collection('wallet').updateOne({ userId: mongodb.ObjectId(userId) }, { $inc: { walletBalance: amount } })
        const reason=`refunded for cancellation of a product order #${trackingId}`
        const transactionId = new mongodb.ObjectId();
        await db.getdb().collection('wallet').updateOne({ userId: mongodb.ObjectId(userId) }, { $push: { transactions: { transactionId: transactionId, amount: amount,date:newdate, reason: reason, type: 'credited', status: "Confirmed" } } })
        await db.getdb().collection('orders').updateOne({ tracking_id: mongodb.ObjectId(trackingId), 'product.productDetails._id': mongodb.ObjectId(productId) }, { $set: {'product.$.cancelled':true,'product.$.refunded': true } })
        
      }else{
        
        await db.getdb().collection('orders').updateOne({ tracking_id: mongodb.ObjectId(trackingId), 'product.productDetails._id': mongodb.ObjectId(productId) }, { $set: {'product.$.cancelled':true } })
      }

      const agg = [
        {
          '$match': {
            'tracking_id': mongodb.ObjectId(trackingId),
          }
        }, {
          '$unwind': {
            'path': '$product'
          }
        }, {
          '$match': {
            'product.cancelled': true
          }
        }
      ];

      const cancel = await db
        .getdb()
        .collection('orders')
        .aggregate(agg).toArray();
      const cancelledProduct = cancel.length;
      // 
      const count=await db.getdb().collection('orders').findOne({tracking_id: mongodb.ObjectId(trackingId)})
      const productCount=count.product.length;
      if (productCount === cancelledProduct) {
        await db.getdb().collection('orders').updateOne({ tracking_id: mongodb.ObjectId(trackingId) }, { $set: { orderstatus: "Cancelled" } })
        res.redirect('/userAccount')
      } else {
        // i am here using the template literal method to pass the req.params.id (trackingid of order) to go back to same page....
        //  we can use just res.redirect('back') here....
        res.redirect(`/orderDetails/${trackingId}`)
      }
    } catch (err) {
      
    }
  },

  wishlist: async (req, res) => {
    try {
      const userId = req.session.userId;

      const limit = 6;
      let pageNo;
      if (req.query?.p) {
        pageNo = req.query.p - 1 || 0;
      }else{
        pageNo=0;
      }
 const finalskip=pageNo*limit
      const agg=[
          {
            '$match': {
              'userId': mongodb.ObjectId(userId)
            }
          }, {
            '$unwind': {
              'path': '$products'
            }
          }, {
            '$lookup': {
              'from': 'products',
              'localField': 'products.productId',
              'foreignField': '_id',
              'as': 'product'
            }
          }, {
            '$project': {
              'userId': '$userId',
              'products': '$products',
              'product': {
                '$arrayElemAt': [
                  '$product', 0
                ]
              }
            }
          }, {
            '$group': {
              '_id': '$userId',
              'products': {
                '$push': {
                  'productDetails': '$product',
                }
              },
            }
          }
        ];
        const finalwishlistItems = await db
        .getdb()
        .collection('wishlist')
        .aggregate(agg)
        .toArray();

        const aggr = [
          {
            '$match': {
              'userId': mongodb.ObjectId(userId)
            }
          }, {
            '$unwind': {
              'path': '$products'
            }
          }, {
            '$lookup': {
              'from': 'products', 
              'localField': 'products.productId', 
              'foreignField': '_id', 
              'as': 'product'
            }
          }, {
            '$project': {
              'userId': '$userId', 
              'products': '$products', 
              'product': {
                '$arrayElemAt': [
                  '$product', 0
                ]
              }
            }
          }, {
            '$group': {
              '_id': '$userId', 
              'products': {
                '$push': {
                  'productDetails': '$product'
                }
              }
            }
          }, {
            '$skip': finalskip
          }, {
            '$limit': limit
          }
        ];

        const wishlistItems =await db
        .getdb()
        .collection('wishlist')
        .aggregate(aggr)
        .toArray();

                // to get number of page

    let max = finalwishlistItems.length / 9;
    let m = Math.ceil(max);
    let page = [];
    for (let i = 1; i <= m; i++) {
      page.push(i);
    }

      // 
      if (wishlistItems.length == 0) {
        res.render('wishlist', { user: true, wishlist: wishlistItems, empty: true })

      } else {

        res.render('wishlist', { user: true, wishlist: wishlistItems,page })
      }
    } catch (err) {
      
    }
  },

  // add to wishlist from user side...................................................

  addtoWishlist: async (req, res) => {
    try {
      const userId = req.session.userId
      const productId = req.params.id;
      let proObj = {
        productId: mongodb.ObjectId(productId),

      }

      const userwishlist = await db.getdb().collection('wishlist').findOne({ userId: mongodb.ObjectId(userId) })
      if (userwishlist) {
        const proExist = await db.getdb().collection('wishlist').findOne({ userId: mongodb.ObjectId(userId), 'products.productId': mongodb.ObjectId(productId) })
        

        if (!proExist) {
          const product = await db.getdb().collection('wishlist').updateOne({ userId: mongodb.ObjectId(userId) }, { $addToSet: { products: proObj } });
          // await db.getdb().collection('products').updateOne({_id:mongodb.ObjectId(productId)},{$set:{isWishlist:true}})
          
        } else {
          
          const product = await db.getdb().collection('wishlist').updateOne({ userId: mongodb.ObjectId(userId) }, { $pull: { products: proObj } });
          // await db.getdb().collection('products').updateOne({_id:mongodb.ObjectId(productId)},{$set:{isWishlist:false}})

        }
        res.redirect('back')

      } else {
        const proObj = {
          userId: mongodb.ObjectId(userId),
          products: [{ productId: mongodb.ObjectId(productId) }]
        };
        const upProd = await db.getdb().collection('wishlist').insertOne(proObj)
      }

      res.redirect('back')


    } catch (err) {
      
    }
  },

  // wishlist to cart and remove from wishlist..............................

  wishlistToCart: async (req, res) => {

    try {
      const productId = req.params.id
      const userId = req.session.userId
      let proObj = {
        productId: mongodb.ObjectId(productId),
        quantity: 1
      }
      let userCart = await db.getdb().collection('cart').findOne({ userId: mongodb.ObjectId(userId) });

      // if wishlist product exists in cart ..................................
      if (userCart) {
        const proExist = await db.getdb().collection('cart').find({ userId: mongodb.ObjectId(userId), products: { $elemMatch: { productId: mongodb.ObjectId(productId) } } }).toArray()

        // if product already not exists..........................................

        if (proExist.length === 0) {
          const product = await db.getdb().collection('cart').updateOne({ userId: mongodb.ObjectId(userId) }, { $push: { products: proObj } });
        }
        // if product already exists..........................................
        else {
          const filter = {
            userId: mongodb.ObjectId(userId),
            "products.productId": mongodb.ObjectId(productId)
          };
          const update = {
            $inc: { "products.$.quantity": 1 }
          };

          await db.getdb().collection('cart').updateOne(filter, update)

        }

        let proObject = {
          productId: mongodb.ObjectId(productId),

        }
        const resultwishlist = await db.getdb().collection('wishlist').updateOne({ userId: mongodb.ObjectId(userId) }, { $pull: { products: proObject } });
        await db.getdb().collection('products').updateOne({_id:mongodb.ObjectId(productId)},{$set:{isWishlist:false}})
        res.redirect('/cart')
        // if user cart doesnt exists.................................................
      } else {
        const proObj = {
          userId: mongodb.ObjectId(userId),
          products: [{ productId: mongodb.ObjectId(productId), quantity: 1 }]
        };
        const upProd = await db.getdb().collection('cart').insertOne(proObj)
      }


      let proObject = {
        productId: mongodb.ObjectId(productId),

      }

      const resultwishlist = await db.getdb().collection('wishlist').updateOne({ userId: mongodb.ObjectId(userId) }, { $pull: { products: proObject } });
      res.redirect('back')

    } catch (err) {
      
    }
  },



  // order status change admin...........................................

  ChangeOrderStatus: async (req, res) => {
    try {
      const trackingId = req.params.id;
      const status = req.body.orderStatus;

      if (req.body.orderStatus === "Cancelled") {
       const agg = [
  {
    '$match': {
      'tracking_id': new ObjectId(trackingId)
    }
  }, {
    '$unwind': {
      'path': '$product'
    }
  }, {
    '$match': {
      'product.cancelled': false
    }
  }, {
    '$project': {
      'subtotal': '$product.subTotal', 
      'userId': '$userId'
    }
  }, {
    '$group': {
      '_id': '$userId', 
      'sum': {
        '$sum': '$subtotal'
      }
    }
  }
];


var dateObj = new Date();
var month = dateObj.getUTCMonth() + 1; //months from 1-12
var day = dateObj.getUTCDate();
var year = dateObj.getUTCFullYear();

var newdate = day + "/" + month + "/" + year;

  
        const result=await db.getdb().collection('orders').aggregate(agg).toArray();
        const amount=result.sum;
        const orderlist = await db.getdb().collection('orders').findOne({ tracking_id: mongodb.ObjectId(trackingId) })
        if (orderlist.payment.method != "COD") {
          await db.getdb().collection('wallet').updateOne({ userId: mongodb.ObjectId(result._id) }, { $inc: { walletBalance: amount } })
          await db.getdb().collection('orders').updateOne({ tracking_id: mongodb.ObjectId(trackingId) }, { $set: { orderstatus: "Cancelled" , 'product.$[].cancelled': true } })
          
          const reason=`refunded for cancellation of a product order #${trackingId}`
          const transactionId = new mongodb.ObjectId();
          await db.getdb().collection('wallet').updateOne({ userId: mongodb.ObjectId(result._id) }, { $push: { transactions: { transactionId: transactionId, amount: amount,date:newdate, reason: reason, type: 'credited', status: "Confirmed" } } })
         
        } else{
          await db.getdb().collection('orders').updateOne({ tracking_id: mongodb.ObjectId(trackingId) }, { $set: { orderstatus: "Cancelled", 'product.$[].cancelled': true } })
          
        }

        const status = "Cancelled by Admin"
        const order = await db.getdb().collection('orders').updateOne({ tracking_id: mongodb.ObjectId(trackingId) }, { $set: { orderstatus: status } })
      } else {
        const order = await db.getdb().collection('orders').updateOne({ tracking_id: mongodb.ObjectId(trackingId) }, { $set: { orderstatus: status } })
      }
      res.redirect('/adminOrders')
    } catch (err) {
      
    }
  },

  // admin coupon page...........................................
  adminCoupons:async(req,res)=>{
    try{
      const coupons=await db.getdb().collection('coupons').find({}).toArray();
      
      res.render('adminCoupons',{ stylesheet: 'adminOrders.css', admin: true, coupons: "active", couponList: coupons })

    }catch(err){
      
    }
  },

  // add coupons...............................
  addCoupon:async(req,res)=>{
    try{
      

      var dateObj = new Date();
      var month = dateObj.getUTCMonth() + 1; //months from 1-12
      var day = dateObj.getUTCDate();
      var year = dateObj.getUTCFullYear();

      var newdate = month + "/" + day + "/" + year;

      const newdisc=parseInt(req.body.discount)
      
      if(req.body.discount<=0 || req.body.discount>=100){
        res.json({
          status:'discounterr'
        })
      }else if((new Date(req.body.expiresOn)-new Date())<0){
        res.json({
          status:"dateerr"
        })
      }else{
        const couponlist=await db.getdb().collection('coupons').findOne({coupon:req.body.coupon});
        if(couponlist){
          res.json({
            status:"couponExists"
          })
        }else{
          
          await db.getdb().collection('coupons').insertOne({coupon:req.body.coupon,discount:newdisc,createdOn:newdate,expiresOn:req.body.expiresOn,modifiedOn:newdate,users:[]});
          
         
          res.json({
            status:'success'
          })
        }
      }
      
    }catch(err){
      
    }
  },

// edit coupon....................\
editCoupon:async(req,res)=>{
  try{
    couponId=req.params.id;
    const{
      discount,
      expiresOn
    }=req.body

    var dateObj = new Date();
    var month = dateObj.getUTCMonth() + 1; //months from 1-12
    var day = dateObj.getUTCDate();
    var year = dateObj.getUTCFullYear();

    var newdate = month + "/" + day + "/" + year;

    const newdisc=parseInt(discount)
    await db.getdb().collection('coupons').updateOne({_id:mongodb.ObjectId(couponId)},{$set:{discount:newdisc,expiresOn:expiresOn,modifiedOn:newdate}})
    res.redirect('/adminCoupons')
  }catch(err){

  }
},

// delete coupon..............
deleteCoupon:async(req,res)=>{
  try{
    couponId=req.params.id;
    await db.getdb().collection('coupons').deleteOne({_id:mongodb.ObjectId(couponId)})
    res.redirect('/adminCoupons')

  }catch(err){
    
  }
},

  //   login with otp..............................................................

  otplogin: (req, res) => {

    res.render('otplogin', { stylesheet: "otplogin.css", login: "a", error: req.session.message, otpmessage: req.session.otpmessage })
    if (req.session.message) {
      req.session.message = null;
    } else if (req.session.otpmessage) {
      req.session.otpmessage = null;

    }

  },

  // add to cart..........................................................

  addtoCart: async (req, res) => {
    try {


      const productId = req.params.id
      const userId = req.session.userId
      let proObj = {
        productId: mongodb.ObjectId(productId),
        quantity: 1
      }
      let userCart = await db.getdb().collection('cart').findOne({ userId: mongodb.ObjectId(userId) });

      // if usercart exists..................................
      if (userCart) {
        const proExist = await db.getdb().collection('cart').find({ userId: mongodb.ObjectId(userId), products: { $elemMatch: { productId: mongodb.ObjectId(productId) } } }).toArray()

        // if product already not exists..........................................

        if (proExist.length === 0) {
          const product = await db.getdb().collection('cart').updateOne({ userId: mongodb.ObjectId(userId) }, { $push: { products: proObj } });
          res.json({
            status:"addedtoCart"
          })


        }
        // if product already exists..........................................
        else {
          const filter = {
            userId: mongodb.ObjectId(userId),
            "products.productId": mongodb.ObjectId(productId)
          };
          const update = {
            $inc: { "products.$.quantity": 1 }
          };

          await db.getdb().collection('cart').updateOne(filter, update)
          res.json({
            status:"addedtoCart"
          })

        }

        // if user cart doesnt exists.................................................
      } else {
        const proObj = {
          userId: mongodb.ObjectId(userId),
          products: [{ productId: mongodb.ObjectId(productId), quantity: 1 }]
        };
        const upProd = await db.getdb().collection('cart').insertOne(proObj)
        res.json({
          status:"addedtoCart"
        })
      }
    } catch (err) {
      
      res.json({
        status:"error"
      })
    }
  },



  // remove product ffrom cart..........................................................

  removeCart: async (req, res) => {
    try {
      const productId = req.params.id
      const userId = req.session.userId
      let userCart = await db.getdb().collection('cart').findOne({ userId: mongodb.ObjectId(userId) });
      if (userCart) {
        const proExist = await db.getdb().collection('cart').updateOne({ userId: mongodb.ObjectId(userId) }, { $pull: { products: { productId: mongodb.ObjectId(productId) } } })
        res.redirect("/cart")

      }
    } catch (err) {
      
    }

  },

  signup:async(req,res)=>{
    const referral = await db.getdb().collection('referral').findOne({})
    if (req.session.err) {
      res.render('userSignup',{ stylesheet: 'userlogin.css', login: "a",signuperror: req.session.err,referral })
      req.session.err = null;
    }else{
      res.render('userSignup',{ stylesheet: 'userlogin.css', login: "a",referral })

    }
  },



  //   sigup the user...................................................................

  signupUser: async (req, res) => {
    try{
    if (!req.body.name ||!req.body.number || !req.body.email || !req.body.password || !req.body.confirmPassword) {
      // req.session.panel = "right-panel-active"
      req.session.err = "All Fields are required *";
      res.redirect('/signup');
    }else if(req.body.number){
      const regExp=/^[6-9]\d{9}$/;
      if(!regExp.test(req.body.number)){
        // req.session.panel = "right-panel-active"
      req.session.err = "Use Indian number to signup *";
      res.redirect('/signup');
    }
    else {
      
        const result = await db.getdb().collection("users").findOne({ email: req.body.email });
        if (result) {
          // req.session.panel = "right-panel-active";
          req.session.err = "User already exists *";
          res.redirect('/signup');
        } else {
          const {
            name,
            email,
            number,
            password,
            confirmPassword
          } = req.body;
          const lowerEmail = email.toLowerCase().trim();
          
          if(password===confirmPassword)
          {

            const referalId = nanoid(8);
            const hashedPassword = await bcrypt.hash(password, 12);
           await db.getdb().collection('users').insertOne({ name, email: lowerEmail, number: number, password: hashedPassword, status: "Active", referral: { referralId: referalId, referralCount: 0, totalReward: 0 } });
           const user = await db.getdb().collection('users').findOne({ email: lowerEmail });
           req.session.login = true;
           req.session.logintime = new Date();
           req.session.userId = user._id;
           const walletId = await db.getdb().collection('wallet').insertOne({ userId: mongodb.ObjectId(user._id), walletBalance: 0, transactions: [] })
           
           if (req.body.referralcode) {
            const referralcode = req.body.referralcode;
            const referreduser = await db.getdb().collection('users').findOne({ 'referral.referralId': referralcode });
            
            if (referreduser) {
              const bonus = await db.getdb().collection('referral').findOne({})
              
              const referralBonus = bonus.bonus;
              await db.getdb().collection('users').updateOne({ 'referral.referralId': referralcode }, { $inc: { 'referral.referralCount': 1, 'referral.totalReward': referralBonus }});
              
      var dateObj = new Date();
      var month = dateObj.getUTCMonth() + 1; //months from 1-12
      var day = dateObj.getUTCDate();
      var year = dateObj.getUTCFullYear();

      var newdate = day + "/" + month + "/" + year;

              await db.getdb().collection('wallet').updateOne({ userId: mongodb.ObjectId(referreduser._id) }, { $inc: { walletBalance: referralBonus } })
              await db.getdb().collection('wallet').updateOne({ userId: mongodb.ObjectId(referreduser._id) }, { $push: { transactions: { transactionId: new mongodb.ObjectId(), amount: referralBonus,date:newdate, reason: `Bonus for referring ${lowerEmail}`, type: 'credited', status: "Confirmed" } } })


              await db.getdb().collection('wallet').updateOne({ _id: mongodb.ObjectId(walletId.insertedId) }, { $inc: { walletBalance: referralBonus } })
              await db.getdb().collection('wallet').updateOne({ _id: mongodb.ObjectId(walletId.insertedId) },{ $push: { transactions: { transactionId: new mongodb.ObjectId(), amount: referralBonus,date:newdate, reason: "Bonus for signingup using Referralcode", type: 'credited', status: "Confirmed" } } })
              
              
            } 
            res.redirect('/');             
          }
            
            else{
              res.redirect('/');
            }

          }else{
            // req.session.panel = "right-panel-active";
            req.session.err = "passwords doesn't match *";
            res.redirect('/signup');
          }
        }
      } 
    }
  }
  catch (err) {
  console.log(err)
  }
},
  // login user...................................................................................


  loginUserValidation: async (req, res) => {
    try {
      if (!req.body.email || !req.body.password) {
        
        req.session.signinerror = "Enter Your Email and Password *";
        res.redirect('/login');

      }
      else {
        const checkLowerEmail = (req.body.email).toLowerCase().trim();
        const password = req.body.password;
        const result = await db.getdb().collection('users').findOne({ email: checkLowerEmail })
        if (result) {

          const validation = await bcrypt.compare(password, result.password);
          if (validation) {
            if (result.status == "Blocked") {
              req.session.signinerror = "User Account is Blocked by Admin * ";
              res.redirect('/login');
            } else {
              
              req.session.login = true;
              req.session.logintime = new Date();
              req.session.userId = result._id;
              res.redirect('/');
            }
          } else {
            req.session.signinerror = "Invalid Credentials";
            res.redirect('/login');


          }

        } else {
          req.session.signinerror = "Invalid Credentials";
          res.redirect('/login');
          // 
          // res.render('index', { loginerror: "Invalid Credentials" })

        }
      }
    }
    catch (err) {
      
      res.render('login', { loginerror: err.message })

    }
  },


  // admin login page........................................................

  adminLoginCheck: async (req, res) => {
    try {
      if (!req.body.email || !req.body.password) {

        req.session.adminerror = "Email and Password are required*";
        res.redirect('/adminlogin')

      } else {
        
        const adminLowerEmail = (req.body.email).toLowerCase().trim();
        const password = req.body.password;
        
        const validAdmin = await db.getdb().collection('admin').findOne({ email: adminLowerEmail });
        if (validAdmin) {
          const validation = await bcrypt.compare(password, validAdmin.password);
          if (validation) {
            
            req.session.adminlogin = true;
            req.session.email = adminLowerEmail;
            res.redirect('/adminhome');
          }

          else {
            req.session.adminerror = "Invalid Admin Credentials *";
            res.redirect('/adminlogin')

          }

        } else {
          req.session.adminerror = "Invalid Admin Credentials *";
          res.redirect('/adminlogin')
        }


      }
    } catch (err) {
      
    }

  },

  // admin users render page.............................................................

  adminUsers: async (req, res) => {
    try {

      const userslist = await db.getdb().collection("users").find({}).toArray()

      res.render('adminusers', { stylesheet: 'adminUsers.css', admin: true, customers: "active", usertable: userslist })
    } catch (err) {

    }
  },

  // admin sales report render page.............................................................

  adminSales: async (req, res) => {
    try {
      if(req.session.start && req.session.end){
     const start=req.session.start
     const end=req.session.end
        const agg = [
          {
            '$unwind': {
              'path': '$product'
            }
          }, {
            '$match': {
              'date': {
                '$gte':new Date(start), 
                '$lte':new Date(end)
              }
            }
          }, {
            '$project': {
              '_id': 0, 
              'productName': '$product.productDetails.name', 
              'Quantity': '$product.count', 
              'Ordered_On': '$ordered_on',
              'SubTotal': '$product.afterDiscountSubTotal'
            }
          }
        ];
        const sales=await db.getdb().collection('orders').aggregate(agg).toArray();
        
        // req.session.end=null;
        // req.session.start=null;
        res.render('adminSales', { stylesheet: 'adminUsers.css', admin: true, sales: "active",sales,start,end})
        
      }else{
        const agg = [
          {
            '$unwind': {
              'path': '$product'
            }
          }, {
            '$project': {
              '_id': 0, 
              'productName': '$product.productDetails.name', 
              'Quantity': '$product.count', 
              'SubTotal': '$product.afterDiscountSubTotal', 
              'Ordered_On': '$ordered_on'
            }
          }
        ];
        const sales=await db.getdb().collection('orders').aggregate(agg).toArray();
        


        res.render('adminSales', { stylesheet: 'adminUsers.css', admin: true, sales: "active",sales})
        // req.session.sales=null;
      }
    } catch (err) {
      
    }
  },

  salesReport:async(req,res)=>{
    try{
      
      const start=new Date(req.body.startdate)
      const end=new Date(req.body.enddate)
      

      
req.session.start=start
req.session.end=end
// 
res.redirect('/adminSales')
// const convertJsonToExcel = (res) => {

//   const workSheet = XLSX.utils.json_to_sheet(sales);
//   const workBook = XLSX.utils.book_new();

//   XLSX.utils.book_append_sheet(workBook, workSheet, "SalesReport")
//   // Generate buffer
//   XLSX.write(workBook, { bookType: 'xlsx', type: "buffer" })

//   // Binary string
//   XLSX.write(workBook, { bookType: "xlsx", type: "binary" })

//   XLSX.writeFile(workBook, "SalesReport.xlsx")

// res.sendFile(process.cwd() + '/SalesReport.xlsx')
// }
// convertJsonToExcel(res)

    }catch(err){
      
    }
  },

  // admin offer render page.............................................................

  adminOffers: async (req, res) => {
    try {

      const categories = await db.getdb().collection('categories').find({}).toArray()
      const categoriestable = await db.getdb().collection('categories').find({ discount: { $gt: 0 } }).toArray()
      const products = await db.getdb().collection('products').find({}).toArray()
      const productstable = await db.getdb().collection('products').find({ productDiscount: { $gt: 0 } }).toArray()

      res.render('adminOffers', { stylesheet: 'adminUsers.css', admin: true, offers: "active", categories, categoriestable, products, productstable })
    } catch (err) {
      
    }
  },

  // admin offer add category render page.............................................................

  addCategoryOffer: async (req, res) => {
    try {
      if (req.body.category && req.body.discount) {
        const categoryId = req.body.category;
        const discount = parseInt(req.body.discount);
        await db.getdb().collection('categories').updateOne({ _id: mongodb.ObjectId(categoryId) }, { $set: { discount: discount } })
        //updating discount percentage for category wise products
        await db
          .getdb()
          .collection('products')
          .updateMany(
            { categoryId: mongodb.ObjectId(categoryId) },
            {
              $set: { categoryDiscount: discount },
            }
          );


        const products = await db.getdb().collection('products').find({ categoryId: mongodb.ObjectId(categoryId) }).toArray()

        //calculating discount amount and updating the discount product

        const updatedProduct = await products.map(async (product) => {
          if (product.categoryDiscount >= product.productDiscount) {
            product.offerprice = Math.floor(product.price - (product.price * product.categoryDiscount) / 100);
          } else {
            product.offerprice = Math.floor(product.price - (product.price * product.productDiscount) / 100);
          }
          //updating products
          
          return await db
            .getdb()
            .collection('products')
            .updateOne({ _id: mongodb.ObjectId(product._id) }, { $set: { offerprice: product.offerprice } });
        });


        res.redirect('/adminOffers');
      }
    } catch (err) {
      
    }
  },

  // admin delete offer category page.............................................................

  deleteCategoryOffer: async (req, res) => {
    try {
      const categoryId = req.params.id;
      await db.getdb().collection('categories').updateOne({ _id: mongodb.ObjectId(categoryId) }, { $set: { discount: 0 } })
      //updating discount percentage for category wise products
      await db
        .getdb()
        .collection('products')
        .updateMany(
          { categoryId: mongodb.ObjectId(categoryId) },
          {
            $set: { categoryDiscount: 0 },
          }
        );


      const products = await db.getdb().collection('products').find({ categoryId: mongodb.ObjectId(categoryId) }).toArray()

      //calculating discount amount and updating the discount product

      const updatedProduct = await products.map(async (product) => {
        if (product.categoryDiscount >= product.productDiscount) {
          product.offerprice = Math.floor(product.price - (product.price * product.categoryDiscount) / 100);
        } else {
          product.offerprice = Math.floor(product.price - (product.price * product.productDiscount) / 100);
        }
        //updating products
        // 
        return await db
          .getdb()
          .collection('products')
          .updateOne({ _id: mongodb.ObjectId(product._id) }, { $set: { offerprice: product.offerprice } });
      });


      res.redirect('/adminOffers')
    } catch (err) {
      
    }
  },


  // delete product offer in admin side................................................

  deleteProductOffer: async (req, res) => {
    try {
      const productId = req.params.id;
      await db.getdb().collection('products').updateOne({ _id: mongodb.ObjectId(productId) }, { $set: { productDiscount: 0 } })
      const products = await db.getdb().collection('products').find({ _id: mongodb.ObjectId(productId) }).toArray()
      if (products[0].length > 1) {
        let offerprice;
        //calculating discount amount and updating the discount product
        if (products[0].categoryDiscount >= products[0].productDiscount) {
          offerprice = Math.floor(products[0].price - (products[0].price * products[0].categoryDiscount) / 100);
        } else {
          offerprice = Math.floor(products[0].price - (products[0].price * products[0].productDiscount) / 100);
        }
        //updating products
        // 
        await db.getdb().collection('products').updateOne({ _id: mongodb.ObjectId(productId) }, { $set: { offerprice: offerprice } });



        res.redirect('/adminOffers');
      } else {
        res.redirect('/adminOffers');

      }


    } catch (err) {
      
    }
  },






  // add product offer router on admin side.......................

  addProductOffer: async (req, res) => {
    try {
      
      if (req.body.product && req.body.productdiscount) {
        const productId = req.body.product;
        const discount = parseInt(req.body.productdiscount);
        await db.getdb().collection('products').updateOne({ _id: mongodb.ObjectId(productId) }, { $set: { productDiscount: discount } })
        const products = await db.getdb().collection('products').find({ _id: mongodb.ObjectId(productId) }).toArray()
        

        let offerprice;
        //calculating discount amount and updating the discount product
        if (products[0].categoryDiscount >= products[0].productDiscount) {
          offerprice = Math.floor(products[0].price - (products[0].price * products[0].categoryDiscount) / 100);
        } else {
          offerprice = Math.floor(products[0].price - (products[0].price * products[0].productDiscount) / 100);
        }
        //updating products
        
        await db.getdb().collection('products').updateOne({ _id: mongodb.ObjectId(productId) }, { $set: { offerprice: offerprice } });



        res.redirect('/adminOffers');
      }


    } catch (err) {
      
    }
  },





  // users status changer by admin..................................................................

  statusChanger: async (req, res) => {

    const statusid = req.params.id;
    try {
      const user = await db.getdb().collection('users').findOne({ _id: mongodb.ObjectId(statusid) });
      if (user.status == "Blocked") {
        await db.getdb().collection('users').updateOne({ _id: mongodb.ObjectId(statusid) }, { $set: { status: "Active" } });
        res.redirect('/adminUsers')
      } else {
        await db.getdb().collection('users').updateOne({ _id: mongodb.ObjectId(statusid) }, { $set: { status: "Blocked" } });
        res.redirect('/adminUsers')

      }
    } catch (err) {
      
    }
  },


  // admin categories render page...............................................................

  adminCategories: async (req, res) => {
    try{

      const categorieslist = await db.getdb().collection("categories").find({}).toArray()
      if (req.session.categoryError) {
        res.render("adminCategories", { stylesheet: 'adminCategories.css', admin: true, categories: "active", categoriestable: categorieslist, categoryError: req.session.categoryError })
      req.session.categoryError = null;
    } else {
      
      res.render("adminCategories", { stylesheet: 'adminCategories.css', admin: true, categories: "active", categoriestable: categorieslist })
    }
  }catch(err){
    
  }

  },

  // edit category by admin .........................................................................

  editCategories: async (req, res) => {
    try {



      if (!req.body.category || !req.body.description) {
        res.redirect("/adminCategories")
      }
      else {
        const editedCategory = req.body.category
        const description = req.body.description
        const categoryid = req.params.id;
        await db.getdb().collection('categories').updateOne({ _id: mongodb.ObjectId(categoryid) }, { $set: { category: editedCategory, description: description } });

        res.redirect("/adminCategories")

      }

    } catch (err) {
      

    }
  },


  // add category by admin..............................................................................

  addCategories: async (req, res) => {
    try {

      if (!req.body.category || !req.body.description) {
        res.redirect("/adminCategories")
      }
      else {
        const NewCategory = req.body.category
        const description = req.body.description
        await db.getdb().collection('categories').insertOne({ category: NewCategory, description: description, categoryDiscount: 0 });
        res.redirect("/adminCategories")

      }

    } catch (err) {
      

    }
  },


  // delete categories..............................................................................

  deleteCategories: async (req, res) => {
    try {

      const deleteid = req.params.id;
      const result = await db.getdb().collection('products').find({ categoryId: mongodb.ObjectId(deleteid) }).toArray()
      if (result.length) {
        req.session.categoryError = 'Cannot Delete Category since Products contains this Category *'
        res.redirect('/adminCategories')
      } else {

        await db.getdb().collection('categories').deleteOne({ _id: mongodb.ObjectId(deleteid) });

      }
      res.redirect('/adminCategories')
    } catch (err) {
      
    }
  },


  // admin brand listing page.......................................................................

  adminBrands: async (req, res) => {
    try {
      const brandslist = await db.getdb().collection("brands").find({}).toArray()
      res.render("adminBrands", { stylesheet: 'adminCategories.css', admin: true, brands: "active", brandstable: brandslist })


    } catch (err) {
      
    }
  },

  // edit brand in admin side..................................................................

  editBrands: async (req, res) => {
    try {
      if (!req.body.brand || !req.body.description) {
        res.redirect("/adminBrands")
      }
      else {
        const editedBrand = req.body.brand
        const description = req.body.description
        const brandid = req.params.id;
        await db.getdb().collection('brands').updateOne({ _id: mongodb.ObjectId(brandid) }, { $set: { brand: editedBrand, description: description } });

        res.redirect("/adminBrands")

      }

    } catch (err) {
      

    }
  },


  // add brand in admin side..................................................................

  addBrands: async (req, res) => {
    try {

      if (!req.body.brand || !req.body.description) {
        res.redirect("/adminBrands")
      }
      else {
        const NewBrand = req.body.brand
        const description = req.body.description
        await db.getdb().collection('brands').insertOne({ brand: NewBrand, description: description });
        res.redirect("/adminBrands")

      }

    } catch (err) {
      

    }
  },


  // delete  brand in admin side................................................

  deleteBrands: async (req, res) => {
    try {

      const deleteid = req.params.id;
      await db.getdb().collection('brands').deleteOne({ _id: mongodb.ObjectId(deleteid) });
      res.redirect('/adminBrands')
    } catch (err) {
      
    }
  },

  // add product admin side post..............................................................
  addSingleProduct:async(req,res)=>{

    try{
      // 
      
    const files = req.files;
    // 
    const urls =  await Promise.all(files.map(async (file) => {
      const { path } = file;
  //  main line for uploading..........
      const result = await cloudinary.uploader.upload(file.path)
  
    // 
      // 
      return result.secure_url;
    }));
  // 
    const {
      name,
      price,
      offerprice,
      color,
      stocks,
      categoryId,
      brandId,
      description,
      images
          }=req.body;
        const newprice=parseInt(price)
        const newofferprice=parseInt(offerprice)
        const newstock=parseInt(stocks)
        const newrating=0;
         
          const categoryOffer=await db.getdb().collection('categories').findOne({_id:mongodb.ObjectId(categoryId)})
          if(categoryOffer.discount){
           const finalofferprice = Math.floor(newprice - (newprice * categoryOffer.discount ) / 100);
  
           await db.getdb().collection("products").insertOne({name:name,price:newprice,offerprice:finalofferprice,color:color,stocks:newstock,categoryId:mongodb.ObjectId(categoryId),brandId:mongodb.ObjectId(brandId),rating:newrating,description:description,images:urls,productDiscount:0,categoryDiscount:categoryOffer.discount})
           res.redirect('/adminProducts')
  
          }else{
  
            await db.getdb().collection("products").insertOne({name:name,price:newprice,offerprice:newprice,color:color,stocks:newstock,categoryId:mongodb.ObjectId(categoryId),brandId:mongodb.ObjectId(brandId),rating:newrating,description:description,images:urls,productDiscount:0,categoryDiscount:0})
            res.redirect('/adminProducts')
  
          }
        }
        catch(err){
          
        }
  },


  // delete the products admin side............................................................

  deleteProducts: async (req, res) => {
    try {

      const deleteid = req.params.id;
      await db.getdb().collection('products').updateOne({ _id: mongodb.ObjectId(deleteid)},{$set:{isDeleted:true,stocks:0}});
      res.redirect('/adminProducts')
    } catch (err) {
      
    }
  },

  // edit products...............................................................................
  editProducts: async (req, res) => {
    try {

      const productId = req.params.id;


const agg = [
  {
    '$match': {
      '_id': mongodb.ObjectId(productId),
    }
  }, {
    '$lookup': {
      'from': 'categories', 
      'localField': 'categoryId', 
      'foreignField': '_id', 
      'as': 'category'
    }
  }, {
    '$lookup': {
      'from': 'brands', 
      'localField': 'brandId', 
      'foreignField': '_id', 
      'as': 'brand'
    }
  }
];


      const Product = await db.getdb().collection("products").aggregate(agg).toArray()
      
      categoryId = Product.categoryId
      brandId = Product.brandId
      
      const allcategories = await db.getdb().collection("categories").find({}).toArray()
      // 
      const allbrands = await db.getdb().collection("brands").find({}).toArray()
      res.render('adminEditProduct', { stylesheet: 'adminEditProduct.css', admin: true, products: "active", productDetails: Product, categoriestable: allcategories, brandstable: allbrands });
    } catch (err) {
      
    }
  },

// edit single products admin side post page.......................................

editSingleProduct:async(req,res)=>{
  try{
    const productId=req.params.id;
    const Product= await db.getdb().collection("products").findOne({_id:mongodb.ObjectId(productId)})
    const oldimages=Product.images;
    // 
  
    const files = req.files;
    
    const urls =  await Promise.all(files.map(async (file) => {
      const { path } = file;
  //  main line for uploading..........
      const result = await cloudinary.uploader.upload(file.path)
  
    // 
  
      return result.secure_url;
    }));
  // 
  oldimages.splice(0,urls.length,...urls)
    let {
      name,
      price,
      offerprice,
      color,
      stocks,
      categoryId,
      brandId,
      description,
      images
          }=req.body;
  
  
        const newprice=Number(price)
        
        const newofferprice=Number(offerprice)
        const newstock=Number(stocks)
        const newrating=0;
  
  const productOffer=await db.getdb().collection('products').findOne({_id:mongodb.ObjectId(productId)})
  
  const categoryOffer=await db.getdb().collection('categories').findOne({_id:mongodb.ObjectId(categoryId)})
        
        
let final;
  if(categoryOffer.discount || productOffer.productDiscount)
  {
    if (categoryOffer.discount >= productOffer.productDiscount) {
      final = Math.floor(newprice - (newprice * categoryOffer.discount) / 100);
    } else {
      final = Math.floor(newprice - (newprice * productOffer.productDiscount) / 100);
    }
  
    await db.getdb().collection("products").updateOne({_id:Product._id},{$set:{name:name,price:newprice,offerprice:final,color:color,stocks:newstock,categoryId:mongodb.ObjectId(categoryId),brandId:mongodb.ObjectId(brandId),rating:newrating,description:description,images:oldimages}})
    res.redirect('/adminProducts')
  
  }else{
    await db.getdb().collection("products").updateOne({_id:Product._id},{$set:{name:name,price:newprice,offerprice:newprice,color:color,stocks:newstock,categoryId:mongodb.ObjectId(categoryId),brandId:mongodb.ObjectId(brandId),rating:newrating,description:description,images:oldimages}})
            res.redirect('/adminProducts')
  
  }
  
  
  }catch(err){
    
  }
  },

// admin banner.............................................................................

  adminBanners: async (req, res) => {
    const allbanners = await db.getdb().collection("banners").find({}).toArray()

    res.render('adminBanners', { stylesheet: 'adminCategories.css', admin: true, banners: "active", bannerstable: allbanners })
  },

  // admin add banner.........................................................................

  addBanner: async (req, res) => {
    try {
      const name = req.body.banner
      const description = req.body.description
      const image = req.body.image
      if (!req.body.banner) {
        res.redirect("/adminBanners")
      }
      else {
        const file = req.file;
        

        const { path } = file;
        //  main line for uploading..........
        const result = await cloudinary.uploader.upload(file.path)
        const image = result.secure_url;


        await db.getdb().collection('banners').insertOne({ banner: name, description: description, image: image });
        res.redirect("/adminBanners")

      }

    } catch (err) {
      

    }
  },

  // edit banner/....................................................

  editBanner: async (req, res) => {
    try {
      const banner = req.body.banner
      const description = req.body.description
      // const image=req.body.banner
      // 
      if (!req.body.banner || !req.body.description) {
        res.redirect("/adminBanners")
      }
      else {
        const file = req.file;
        

        const { path } = file;
        //  main line for uploading..........
        const result = await cloudinary.uploader.upload(file.path)
        const image = result.secure_url;
        const bannerid = req.params.id;
        await db.getdb().collection('banners').updateOne({ _id: mongodb.ObjectId(bannerid) }, { $set: { banner: banner, description: description, image: image } });

        res.redirect("/adminBanners")

      }

    } catch (err) {
      

    }
  },


  // admin banner delete /....................................................

  deleteBanner: async (req, res) => {
    try {
      const deleteid = req.params.id;
      await db.getdb().collection('banners').deleteOne({ _id: mongodb.ObjectId(deleteid) });
      res.redirect('/adminBanners')
    } catch (err) {
      
    }
  },



  // user order management in admin side...................................

  adminOrders: async (req, res) => {
    try {
      await db.getdb().collection('orders').deleteMany({orderstatus:'Pending'});
      const orders = await db.getdb().collection('orders').find({}).sort({ _id: -1 }).toArray()
      res.render('adminOrders', { stylesheet: 'adminOrders.css', admin: true, orders: "active", ordersList: orders })

    } catch (err) {
      
    }
  },

  // admin view single order details of user.,.......

  adminViewOrder:async(req,res)=>{
    try{
      
      const trackingId = req.params.id;
      const orderDetails = await db.getdb().collection('orders').findOne({ tracking_id: mongodb.ObjectId(trackingId) })
      
      res.render('adminViewOrder', { stylesheet: 'adminOrders.css', admin: true, orders: "active", orderDetails: orderDetails })

      
    }catch(err){
      
    }
  },



}












