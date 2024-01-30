const express = require('express');
const app = express();
const port = 3000;

// Route for 'long'
app.get('/long', (req, res) => {
  res.json({ message: 'This is the long API response.' });
});

// Route for 'short'
app.get('/short', (req, res) => {
  res.json({ message: 'This is the short API response.' });
});

// Route for 'long close'
app.get('/longclose', (req, res) => {
  res.json({ message: 'This is the long close API response.' });
});

// Route for 'short close'
app.get('/shortclose', (req, res) => {
  res.json({ message: 'This is the short close API response.' });
});

app.listen(port, () => {
  console.log(`Server is listening on port ${port}`);
});
