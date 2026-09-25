import React from 'react';
import Login from './Login.jsx';

/**
 * Register Page
 * Wraps the unified authentication page with initialMode="signup".
 * Both /login and /register provide a seamless experience with instant toggle switcher.
 */
export const Register = () => {
  return <Login initialMode="signup" />;
};

export default Register;
