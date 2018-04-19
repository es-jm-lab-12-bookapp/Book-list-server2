'use strict';

// Application dependencies
require('dotenv').config();
const express = require('express');
const cors = require('cors');
const pg = require('pg');

// Application Setup
const app = express();
const PORT = process.env.PORT;
const CLIENT_URL = process.env.CLIENT_URL;

// Database Setup
const client = new pg.Client(process.env.DATABASE_URL);
client.connect();
client.on('error', err => console.error(err));

// Application Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use((req,res,next) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Headers', 'Origin,X-Requested-With,content-type');
  next();
});

// API Endpoints
app.get('/api/v1/books', (req, res) => {
  client.query(`
  SELECT book_id, title, author, image_url, isbn FROM books;`)
    .then(results => res.send(results.rows))
    .catch(console.error);
});

app.get('/api/v1/books:id', (req, res) => {
  client.query(`
    SELECT book_id, title, author, imague_url, isbn, description FROM books WHERE book_id = request.params.id;
  `).then(results => res.send(results.rows)).catch(console.error);
});

app.post('/api/v1/books', (req, res) => {
  client.query(`
    INSERT INTO books (title, author, image_url, isbn, description) 
    VALUES ($1, $2, $3, $4, $5);`,
    [
      req.body.title,
      req.body.author,
      req.body.image_url,
      req.body.isbn,
      req.body.description
    ],
    function(err) {
      if (err) console.error(err);
      res.send('New book yay!');
    }
  );
});



app.get('*', (req, res) => res.redirect(CLIENT_URL));
app.listen(PORT, () => console.log(`Listening on port: ${PORT}`));
