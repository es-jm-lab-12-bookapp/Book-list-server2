'use strict';

// Application dependencies
require('dotenv').config();
const fs = require('fs');
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

app.get('/api/v1/books/:id', (req, res) => {
  client.query(`
    SELECT * FROM books 
    WHERE book_id=$1;`
    ,
    [
      req.params.id
    ])
    .then(results => res.send(results.rows))
    .catch(console.error);
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



function loadBooks() {
  client.query(`
    SELECT COUNT(*) FROM books;
  `).then(result => {
    if(!parseInt(result.rows[0].count)) {
      fs.readFile('../book-list-client2/data/books.json', 'utf8', (err, fd) => {
        JSON.parse(fd).forEach(element => {
          client.query(`
            INSERT INTO books
            (author,title,isbn,image_url,description)
            VALUES($1,$2,$3,$4,$5);
        `,
            [
              element.author,
              element.title,
              element.isbn,
              element.image_url,
              element.description
            ]).catch(console.error);
        });
      });
    }
  });
}
function loadDB() {
  client.query(`
    CREATE TABLE IF NOT EXISTS books(
        book_id SERIAL PRIMARY KEY,
        author VARCHAR(255),
        title VARCHAR(255),
        isbn VARCHAR(255),
        image_url VARCHAR(255),
        description TEXT
    );
  `).then(loadBooks);
}


loadDB();
app.get('*', (req, res) => res.redirect(CLIENT_URL));
app.listen(PORT, () => console.log(`Listening on port: ${PORT}`));
