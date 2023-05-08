const express = require('express');
const cors = require('cors');
const sqlite3 = require('sqlite3').verbose();
const bodyParser = require('body-parser');
const fs = require('fs');

const app = express();
const port = 4242;

app.use(cors());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

const db = new sqlite3.Database(':memory:', (err) => {
  if (err) {
    console.error(err.message);
  }
  console.log('Connected to the in-memory SQLite database.');
});

db.serialize(() => {
  db.run('CREATE TABLE simcity_oneliners (id INTEGER PRIMARY KEY, oneliner TEXT)');

  // read in prompts.txt and insert into database
  const oneliners = fs.readFileSync('prompts.txt').toString().split('\n');

  const placeholders = oneliners.map(() => '(?)').join(', ');
  const sql = `INSERT INTO simcity_oneliners (oneliner) VALUES ${placeholders}`;

  db.run(sql, oneliners, (err) => {
    if (err) {
      console.error('Error inserting data:', err);
    } else {
      console.log('Data inserted successfully');
    }
  });
});

function handlePagination(req, res) {
  const page = parseInt(req.query.page || req.body.page) || 1;
  const limit = parseInt(req.query.limit || req.body.limit) || 10;
  const offset = (page - 1) * limit;

  db.all('SELECT * FROM simcity_oneliners LIMIT ? OFFSET ?', [limit, offset], (err, rows) => {
    if (err) {
      res.status(500).send({ error: 'An error occurred while fetching data' });
    } else {
      res.json(rows);
    }
  });
}
app.get('/api/', handlePagination);
app.post('/api/', handlePagination);

app.listen(port, () => {
  console.log(`Paginated Goats API listening at http://localhost:${port}`);
});

