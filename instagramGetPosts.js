const axios = require('axios');
const mysql = require('mysql2');
require('dotenv').config();

const token  = process.env.INSTAGRAM_TOKEN;
const userid = process.env.INSTAGRAM_USERID;

const connection = mysql.createConnection({
   host: process.env.MYSQL_HOST,
   user: process.env.MYSQL_USER,
   password: process.env.MYSQL_PASSWORD,
   database: process.env.MYSQL_DATABASE,
});

connection.connect((error) => {
   if (error) throw error;
   console.log('Connected to MySQL database!');
});

async function getMediaList() {
   const url = 'https://graph.instagram.com/' + userid + '/media?access_token=' + token;

   const response = await axios.get(url).catch(function (error) {
      if (error.response) {
         throw error;
      }
   });

   let posts = [];
   response.data.data.forEach(function (v) {
      posts.push(v.id);
   });

   for (let i = 0; i < posts.length; i++) {
      const media_url = 'https://graph.instagram.com/' + posts[i] + '?access_token=' + token + '&fields=media_url,media_type,permalink,caption,timestamp,thumbnail_url';
      const media_response = await axios.get(media_url);
      const media = [
         media_response.data.id,
         media_response.data.media_url,
         media_response.data.media_type,
         media_response.data.thumbnail_url,
         media_response.data.caption,
         media_response.data.permalink,
         media_response.data.timestamp
      ];
      console.log(media_response.data.thumbnail_url);

      connection.query("INSERT INTO instagram_feed VALUES (?) ON DUPLICATE KEY UPDATE media_url=VALUES(media_url), media_type=VALUES(media_type), thumbnail_url=VALUES(thumbnail_url), caption=VALUES(caption), permalink=VALUES(permalink), timestamp=VALUES(timestamp)",
         [media], function (error, result) {
            if (error) throw error;
            console.log('Row inserted successfully!');
         });

   }

}

getMediaList();
