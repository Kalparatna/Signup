const express = require('express');
const mongoose = require('mongoose');
const bcrypt = require('bcrypt');
const cors = require('cors');
const jwt = require('jsonwebtoken');
const cloudinary = require('cloudinary').v2;
const multer = require('multer');

const app = express();

// Middleware
app.use(
  cors({
    origin: 'https://signup1-two.vercel.app', // Your frontend URL
    methods: ['GET', 'POST', 'PUT', 'DELETE'],
    credentials: true,
  })
);

app.use(express.json());

// Cloudinary Configuration
cloudinary.config({
  cloud_name: 'dpxx5upa0',  // Replace with your Cloudinary cloud name
  api_key: '149525395734734',  // Replace with your Cloudinary API key
  api_secret: 'gLkxqYnm44K4fUg7TbF0MKwEu08',  // Replace with your Cloudinary API secret
});

// MongoDB connection
const mongoURI = 'mongodb+srv://admin:admin%402023@cluster0.u3djt.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0';
mongoose
  .connect(mongoURI)
  .then(() => console.log('Connected to MongoDB Atlas'))
  .catch((err) => console.error('Connection error:', err));

// Define User Schema and Model (only once to avoid OverwriteModelError)
const userSchema = new mongoose.Schema({
  username: { type: String, required: true, unique: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  profileImage: { type: String },
});

// Use mongoose.models.User if already compiled to avoid overwriting
const User = mongoose.models.User || mongoose.model('User', userSchema);

// Multer is not needed for saving files on disk, so we skip it entirely
const storage = multer.memoryStorage();  // Store files in memory
const upload = multer({ storage: storage });

// Signup Route with image upload directly to Cloudinary
app.post('/signup', upload.single('image'), async (req, res) => {
  const { username, email, password, confirmPassword } = req.body;

  // Validate password
  const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?]).{8,}$/;
  if (!passwordRegex.test(password)) {
    return res.status(400).json({ message: 'Password does not meet complexity requirements.' });
  }

  if (password !== confirmPassword) {
    return res.status(400).json({ message: 'Passwords do not match.' });
  }

  try {
    // Upload image to Cloudinary from memory storage
    let profileImageUrl = null;
    if (req.file) {
      const result = await cloudinary.uploader.upload_stream(
        { resource_type: 'auto' }, // Let Cloudinary automatically detect the file type
        (error, result) => {
          if (error) {
            return res.status(500).json({ message: 'Image upload failed' });
          }
          profileImageUrl = result.secure_url;
        }
      );
      req.file.stream.pipe(result); // Upload file stream to Cloudinary
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const newUser = new User({ 
      username, 
      email, 
      password: hashedPassword, 
      profileImage: profileImageUrl 
    });
    await newUser.save();

    res.status(201).json({ success: true, message: 'User registered successfully!' });
  } catch (error) {
    if (error.code === 11000) {
      return res.status(400).json({ message: 'Username or email already exists.' });
    }
    res.status(500).json({ message: 'Internal server error.' });
  }
});

// Login Route
app.post('/login', async (req, res) => {
  const { username, password } = req.body;

  try {
    const user = await User.findOne({ username });
    if (!user) return res.status(400).json({ message: 'Invalid credentials' });

    const isPasswordCorrect = await bcrypt.compare(password, user.password);
    if (!isPasswordCorrect) return res.status(400).json({ message: 'Invalid credentials' });

    const token = jwt.sign(
      { userId: user._id, username: user.username },
      'mySuperSecretKey1234', // JWT secret key
      { expiresIn: '1h' }
    );
    res.status(200).json({ success: true, token });
  } catch (error) {
    res.status(500).json({ message: 'Internal server error' });
  }
});

// Vercel requires exporting the app for serverless functions
module.exports = app;
