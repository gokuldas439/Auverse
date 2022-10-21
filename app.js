const createError = require('http-errors');
const express = require('express');
const path = require('path');
const cookieParser = require('cookie-parser');
const logger = require('morgan');
require('dotenv').config();
const db= require('./database/db');
const hbs=require('express-handlebars')
const indexRouter = require('./routes/index');
const usersRouter = require('./routes/users');
const session = require('express-session');
const app = express();
const multer = require("multer");
const upload = multer({ dest: "uploads/" });
const helpers=require('handlebars-helpers')();
const Handlebars = require('handlebars');
const Razorpay = require('razorpay');
const XLSX = require('xlsx');



// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'hbs');
app.engine('hbs',hbs.engine({extname:'hbs',defaultLayout:'layout',layoutsDir:__dirname+'/views/layout/',partialsDir:__dirname+'/views/partials/',helpers:helpers}))

Handlebars.registerHelper("inc", (value)=>
{
    return parseInt(value) + 1;
});
Handlebars.registerHelper("sub", (value1,value2)=>
{
    return parseInt(value1) - parseInt(value2);
});
Handlebars.registerHelper( "when",function(operand_1, operator, operand_2, options) {
  var operators = {
   'eq': function(l,r) { return l == r; },
   'noteq': function(l,r) { return l != r; },
   'gt': function(l,r) { return Number(l) > Number(r); },
   'or': function(l,r) { return l || r; },
   'and': function(l,r) { return l && r; },
   '%': function(l,r) { return (l % r) === 0; }
  }
  , result = operators[operator](operand_1,operand_2);

  if (result) return options.fn(this);
  else  return options.inverse(this);
});

Handlebars.registerHelper('toLocaleString', function(number) {
  return number.toLocaleString()
})


app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));
app.use(session({secret:"key",saveUninitialized:false,resave:false,cookie:{maxAge:6000000}}))
app.use((req, res, next) => {
  res.set('Cache-Control', 'no-cache, private, no-store, must-revalidate, max-stale=0, post-check=0, pre-check=0');
  next();
});
app.use(async function(req,res,next){
  res.locals.allCategories =await db.getdb().collection('categories').find({}).toArray();
  res.locals.localBrands =await db.getdb().collection('brands').find({}).toArray();
  next();
});


app.use('/', indexRouter);
app.use('/users', usersRouter);

// catch 404 and forward to error handler
app.use(function(req, res, next) {
  next(createError(404));
});

// error handler
app.use(function(err, req, res, next) {
  // set locals, only providing error in development
  res.locals.message = err.message;
  res.locals.error = req.app.get('env') === 'development' ? err : {};

  // render the error page
  res.status(err.status || 500);
  res.render('error');
});

db.initdb((err,db)=>{
  if(err){
    console.log(err);
  }else{
    console.log('db connected');
  }
  
  }) 

module.exports = app;
