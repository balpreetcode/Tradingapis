import express from "express";
const app = express();
const PORT = process.env.PORT || 5001;
import cors from "cors";
import dotenv from "dotenv";
import { initializeApp } from "firebase/app";
import { getFirestore, doc, setDoc, getDoc } from "firebase/firestore";

dotenv.config();
app.use(cors());

app.listen(PORT, () => {
  console.log(`Backend is running on port ${PORT}`);
});

const firebaseConfig = {
  apiKey: "AIzaSyBpJ259fUt9afgnFOEabtjoKbEwbFm_gZ8",
  authDomain: "vrchat-2f58c.firebaseapp.com",
  projectId: "vrchat-2f58c",
  storageBucket: "vrchat-2f58c.appspot.com",
  messagingSenderId: "315680730497",
  appId: "1:315680730497:web:acd9cd885946d0bc33cc80",
  measurementId: "G-JFJVFZS1H3"
};

const firebaseApp = initializeApp(firebaseConfig);
const db = getFirestore(firebaseApp);

app.get("/", (req, res) => {
  res.send("Welcome to the API!");
});

app.post('/add', async (req, res) => {
  const docRef = doc(db, 'users', 'user1');
  await setDoc(docRef, {
    name: 'John Doe',
    email: 'john.doe@example.com',
    age: 30
  });
  res.send('Data added to Firebase');
});

app.get('/get/:id', async (req, res) => {
  const { id } = req.params; // Extract the id from the request parameters
  const docRef = doc(db, 'users', id); // Use the id to get the document reference
  const docSnap = await getDoc(docRef);

  if (!docSnap.exists()) {
    res.status(404).send('No such document!');
  } else {
    res.send(docSnap.data());
  }
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

export default app;