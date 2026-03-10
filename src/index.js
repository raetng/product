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
  try {
    const result = await pool.query('SELECT * FROM products ORDER BY id');
    res.json(result.rows);
  } catch (err) {
    console.error('Failed to fetch products:', err.message);
    res.status(500).json({ error: 'Failed to fetch products' });
  }
});

app.get('/products/:id', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM products WHERE id = $1', [req.params.id]);
    if (result.rows.length === 0) return res.status(404).json({ error: 'Product not found' });
    res.json(result.rows[0]);
  } catch (err) {
    console.error('Failed to fetch product:', err.message);
    res.status(500).json({ error: 'Failed to fetch product' });
  }
});

app.post('/products', async (req, res) => {
  const { name, price, description } = req.body;
  if (!name || typeof name !== 'string' || name.trim().length === 0) {
    return res.status(400).json({ error: 'Name is required' });
  }
  if (price == null || isNaN(price) || Number(price) <= 0) {
    return res.status(400).json({ error: 'Price must be a positive number' });
  }
  try {
    const result = await pool.query(
      'INSERT INTO products (name, price, description) VALUES ($1, $2, $3) RETURNING *',
      [name.trim(), Number(price), description || '']
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error('Failed to create product:', err.message);
    res.status(500).json({ error: 'Failed to create product' });
  }
});

app.listen(PORT, () => console.log(`product-service running on port ${PORT}`));

module.exports = app;
