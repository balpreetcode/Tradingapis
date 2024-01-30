import express from "express";
const app = express();
const PORT = process.env.PORT || 5000;
import cors from "cors";
import dotenv from "dotenv";

dotenv.config();
app.use(cors());

app.listen(PORT, () => {
  console.log(`Backend is running on port ${PORT}`);
});
app.get("/", (req, res) => {
  res.send("Welcome to the API!");
});

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

