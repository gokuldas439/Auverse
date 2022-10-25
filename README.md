
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
- Cancel & Return Order
- Invoice for the Products Delivered

### Admins
- Dashboard with Donut & Bar chart Representation
- Sales report with downloadable CSV, Excel & PDF
- Product CRUD operations
- Category CRUD operations
- Brand CRUD operations
- User Details with user Status Changer
- Users Order Details with Order Status Changer
- Product & Category Offer Management
- Coupon CRUD operations
- Banner CRUD operations

## License

[SSL](https://choosealicense.com/licenses/SSL/)


## Screenshots

![App Screenshot](https://awesomescreenshot.s3.amazonaws.com/image/3519975/33732289-503827608a54af3fd43df9bba8726007.png?X-Amz-Algorithm=AWS4-HMAC-SHA256&X-Amz-Credential=AKIAJSCJQ2NM3XLFPVKA%2F20221025%2Fus-east-1%2Fs3%2Faws4_request&X-Amz-Date=20221025T090344Z&X-Amz-Expires=28800&X-Amz-SignedHeaders=host&X-Amz-Signature=ead1742763282c1999c44e1761243faa57580ac744b01d529f3204720f650a64)

