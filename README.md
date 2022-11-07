
# Auverse Ecommerce

This is my first full Stack project which is a fully functional Ecommerce platform.
## Acknowledgements

 - [My Linkedin profile](https://www.linkedin.com/in/gokuldas439)
 - [Live Project Link](www.auverse.tech)


## API Reference
 #### Get all Products -

```http
  GET /products
```
#### Response:

| Parameter | Description                |
| :-------- | :------------------------- |
| `200` | **OK** |

#### Get Single Product Details -

```http
  GET /products/view-product/:id
```

| Parameter | Type     | Description                       |
| :-------- | :------- | :-------------------------------- |
| `id`      | `string` | **Required**. Id of the Product |

#### Response:

| Parameter | Description                |
| :-------- | :------------------------- |
| `200` | **OK** |

 
[.....(see full API Documentation)](https://docs.google.com/document/d/1dLKbfY2BZGqWafMHu5885ZZPJndNMTeQAVLPvR4bjNs/edit?usp=sharing)




## Link


www.auverse.tech
## Environment Variables

To run this project, you will need to add the following environment variables to your .env file

#### TWILIO :
`ACCOUNT_SID`
`AUTH_TOKEN`
`SERVICE_ID`
#### NODEMAILER :
`EMAIL`
`PASSWORD`
#### CLOUDINARY :
`CLOUD_NAME`
`API_KEY`
`API_SECRET`
#### RAZORPAY :
`YOUR_KEY_ID`
`YOUR_KEY_SECRET`
#### PAYPAL :
`CLIENT_ID`
`CLIENT_SECRET`
#### MONGODB :
`MONGODB_LINK`






## Deployment

###  Run Locally
Clone the project :

```bash
  https://github.com/gokuldas439/Auverse.git
```

Go to the project directory :

```bash
  cd Auverse
```

install dependencies :

```bash
  npm install
```

*ADD .env file to the folder*


#### Start the server :

```bash
  npm start
```


## Features

### Users
- Login with OTP
- Password Recovery
- Edit User Details
- User-Friendly Navigation
- Cart & Wishlist for Users
- Search Products
- Product Sort & Filter
- Product & Category Offers
- Users can Review and Rate the Products
- Coupon Codes
- Referral reward
- Wallet
- Add Balance to Wallet using Payment Gateway
- P2P Wallet transfer
- Multiple payment options on Purchasing Products(Razorpay, PayPal, COD & Wallet)
- Email Notification on Product Purchases
- Cancel & Return Orders
- Invoice for the Products Delivered

### Admins
- Dashboard with doughnut & Bar chart Representation
- Sales report with downloadable CSV, Excel & PDF
- Product CRUD operations
- Category CRUD operations
- Brand CRUD operations
- Refferal Bonus CRUD operations
- User Details with user Status Changer
- Users Order Details with Order Status Changer
- Product & Category Offer Management
- Coupon CRUD operations
- Banner CRUD operations

## License

[unlicense](https://choosealicense.com/licenses/unlicense/)


## Screenshots

![App Screenshot](https://res.cloudinary.com/gokuldas/image/upload/v1667656543/Auverse_4_ycaexk.png)

##

![App Screenshot](https://res.cloudinary.com/gokuldas/image/upload/v1667793727/Auverse_5_fufohw.png)

##

![App Screenshot](https://res.cloudinary.com/gokuldas/image/upload/v1667793727/Auverse_6_ii2apo.png)

##
