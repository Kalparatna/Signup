import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import SignupForm from './SignupForm';
import LoginForm from './LoginForm';

const App = () => {
  return (
    <Router>
      <Routes>
        {/* Default route for SignupForm */}
        <Route path="/" element={<SignupForm />} />

        {/* Route for LoginForm */}
        <Route path="/login" element={<LoginForm />} />
      </Routes>
    </Router>
  );
};

export default App;
