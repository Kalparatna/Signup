import React, { useState } from 'react';
import axios from 'axios';
import { Link } from 'react-router-dom';
import './SignupForm.css';

const SignupForm = () => {
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    password: '',
    confirmPassword: '',
    image: null,
  });

  const [isSuccess, setIsSuccess] = useState(false);
  const [error, setError] = useState('');

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };

  const handleFileChange = (e) => {
    setFormData({ ...formData, image: e.target.files[0] });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    const { username, email, password, confirmPassword, image } = formData;

    if (!image) {
      return setError('Please upload an image.');
    }

    const data = new FormData();
    data.append('username', username);
    data.append('email', email);
    data.append('password', password);
    data.append('confirmPassword', confirmPassword);
    data.append('image', image);

    try {
      const response = await axios.post('https://signup-henna-pi.vercel.app/signup', data, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });

      console.log("Server response:", response); // Log server response

      if (response.data.success) {
        setIsSuccess(true);
        setError('');
        setTimeout(() => setIsSuccess(false), 3000);
      }
      
    } catch (error) {
      console.error("Error during signup:", error);
      setError(error.response?.data?.message || 'An error occurred.');
    }
  };

  const closePopup = () => {
    setIsSuccess(false);
  };

  return (
    <div className="main">
      <input type="checkbox" id="chk" aria-hidden="true" />
      <div className="signup">
        <form onSubmit={handleSubmit}>
          <label htmlFor="chk" aria-hidden="true">Sign Up</label>
          <input
            type="text"
            name="username"
            placeholder="Username"
            value={formData.username}
            onChange={handleChange}
            required
          />
          <input
            type="email"
            name="email"
            placeholder="Email"
            value={formData.email}
            onChange={handleChange}
            required
          />
          <input
            type="password"
            name="password"
            placeholder="Password"
            value={formData.password}
            onChange={handleChange}
            required
          />
          <input
            type="password"
            name="confirmPassword"
            placeholder="Confirm Password"
            value={formData.confirmPassword}
            onChange={handleChange}
            required
          />
          <input
            type="file"
            name="image"
            accept="image/*"
            onChange={handleFileChange}
            required
          />
          <button type="submit">Signup</button>
        </form>
        {error && <p className="error">{error}</p>}
        <p>
          <Link to="/login">Already have an account?</Link>
        </p>
      </div>

      {/* Popup Modal */}
      <div className={`popup ${isSuccess ? 'show' : ''}`}>
        <div className="popup-content">
          <div className="icon">✔</div>
          <h2>Signup Successful!</h2>
          <p>Your account has been created successfully. Please login to continue.</p>
          <button onClick={closePopup}>Close</button>
        </div>
      </div>
    </div>
  );
};

export default SignupForm;
