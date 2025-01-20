const express = require('express');
const mongoose = require('mongoose');
const bcrypt = require('bcrypt');
const cors = require('cors');
const jwt = require('jsonwebtoken');
const cloudinary = require('cloudinary').v2; // Import Cloudinary SDK
const multer = require('multer'); // For handling file uploads

const app = express();

// Middleware
app.use(
  cors({
    origin: 'https://signup1-two.vercel.app', // Updated frontend URL
    methods: ['GET', 'POST', 'PUT', 'DELETE'],
    credentials: true,
  })
);
app.use(express.json());

// Cloudinary Configuration (hardcoded credentials)
cloudinary.config({
  cloud_name: 'dpxx5upa0', // Cloudinary Cloud Name
  api_key: '149525395734734', // Cloudinary API Key
  api_secret: 'gLkxqYnm44K4fUg7TbF0MKwEu08', // Cloudinary API Secret
});

// MongoDB connection (hardcoded URI)
const mongoURI = 'mongodb+srv://admin:admin%402023@cluster0.u3djt.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0';
mongoose
  .connect(mongoURI)
  .then(() => console.log('Connected to MongoDB Atlas'))
  .catch((err) => console.error('Connection error:', err));

// Define User Schema (Ensure the model is not overwritten)
const userSchema = new mongoose.Schema({
  username: { type: String, required: true, unique: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  profileImage: { type: String }, // Store the URL of the uploaded image
});

// Ensure the model is not overwritten
const User = mongoose.models.User || mongoose.model('User', userSchema);

// Image upload setup using multer
const upload = multer({ dest: 'uploads/' });

// Signup Route with image upload
app.post('/signup', upload.single('image'), async (req, res) => {
  const { username, email, password, confirmPassword } = req.body;

  // Validate password (complexity check)
  const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?]).{8,}$/;
  if (!passwordRegex.test(password)) {
    return res.status(400).json({ message: 'Password does not meet complexity requirements.' });
  }

  // Validate password confirmation
  if (password !== confirmPassword) {
    return res.status(400).json({ message: 'Passwords do not match.' });
  }

  try {
    // Upload image to Cloudinary
    let profileImageUrl = null;
    if (req.file) {
      const result = await cloudinary.uploader.upload(req.file.path); // Upload image
      profileImageUrl = result.secure_url; // Get the image URL
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Save user to the database
    const newUser = new User({
      username,
      email,
      password: hashedPassword,
      profileImage: profileImageUrl,
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
    // Find user by username
    const user = await User.findOne({ username });
    if (!user) return res.status(400).json({ message: 'Invalid credentials' });

    // Compare password with hashed password
    const isPasswordCorrect = await bcrypt.compare(password, user.password);
    if (!isPasswordCorrect) return res.status(400).json({ message: 'Invalid credentials' });

    // Generate JWT token
    const token = jwt.sign(
      { userId: user._id, username: user.username },
      'mySuperSecretKey1234', // JWT Secret Key (hardcoded)
      { expiresIn: '1h' }
    );
    res.status(200).json({ success: true, token });
  } catch (error) {
    res.status(500).json({ message: 'Internal server error' });
  }
});

// Listen on port
const PORT = 5000;
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
