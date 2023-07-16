require('dotenv').config();
const mysql = require('mysql2');
const stripe = require('stripe')(process.env.STRIPE_SECRET_TEST);

const connection = mysql.createConnection({
   host: process.env.MYSQL_HOST,
   user: process.env.MYSQL_USER,
   password: process.env.MYSQL_PASSWORD,
   database: process.env.MYSQL_DATABASE,
});

connection.connect((error) => {
   if (error) throw error;
});

async function getProducts() {
   const products = await stripe.products.list({
      limit: 100,
   });
   const productsWithPrices = await addPrices(products.data);
   const add                = await insertIntoDatabase(productsWithPrices);
}

async function insertIntoDatabase(products) {
   var inserts = new Promise((resolve, reject) => {
      products.forEach(async function(value,i) {
         const row = [ value.id, value.name, value.description, value.default_price, value.price ];
         connection.query("INSERT INTO products VALUES (?) ON DUPLICATE KEY UPDATE name=VALUES(name), description=VALUES(description), default_price=VALUES(default_price), price=VALUES(price)",
            [row], function (error, result) {
               if (error) throw error;
               console.log('Row inserted successfully!');
               if ( i === products.length-1 ) {
                  resolve();
               }
           });
      });
   });

   inserts.then(() => {
      process.exit(); // Cheese?
   });
}

async function addPrices(products) {
   for(let i = 0; i < products.length; i++) {
      const price = await stripe.prices.retrieve(
         products[i].default_price
      );
      products[i].price = price.unit_amount;
   }
   return products;
}

getProducts();
