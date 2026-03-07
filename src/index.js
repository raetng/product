const express = require('express');
const cors = require('cors');
const { Pool } = require('pg');

const app = express();
const PORT = process.env.PORT || 3001;

const pool = new Pool({
  host: process.env.DB_HOST || 'localhost',
  database: process.env.DB_NAME || 'ecommerce',
  user: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD || 'password',
  port: 5432,
});

app.use(cors());
app.use(express.json());

app.get('/health', (req, res) => res.json({ status: 'OK' }));

app.get('/products', async (req, res) => {
  const result = await pool.query('SELECT * FROM products');
  res.json(result.rows);
});

app.get('/products/:id', async (req, res) => {
  const result = await pool.query('SELECT * FROM products WHERE id = $1', [req.params.id]);
  if (result.rows.length === 0) return res.status(404).json({ error: 'Product not found' });
  res.json(result.rows[0]);
});

app.post('/products', async (req, res) => {
  const { name, price, description } = req.body;
  const result = await pool.query(
    'INSERT INTO products (name, price, description) VALUES ($1, $2, $3) RETURNING *',
    [name, price, description]
  );
  res.status(201).json(result.rows[0]);
});

app.listen(PORT, () => console.log(`product-service running on port ${PORT}`));

module.exports = app;
