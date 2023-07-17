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
   for ( const product of productsWithPrices ) {
      await insertIntoDatabase(product);
   }
   process.exit();
}

async function insertIntoDatabase(value) {
   const row = [ value.id, value.name, value.description, value.default_price, value.price ];
   await connection.promise().query("INSERT INTO products VALUES (?) ON DUPLICATE KEY UPDATE name=VALUES(name), description=VALUES(description), default_price=VALUES(default_price), price=VALUES(price)", [row]);
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