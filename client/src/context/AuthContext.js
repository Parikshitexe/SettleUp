import { createContext, useState, useEffect } from 'react';
import axios from 'axios';
import config from '../config';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(localStorage.getItem('token'));
  const [loading, setLoading] = useState(true);

  // Set axios default header when token changes
  useEffect(() => {
    if (token) {
      axios.defaults.headers.common['x-auth-token'] = token;
      loadUser();
    } else {
      delete axios.defaults.headers.common['x-auth-token'];
      setLoading(false);
    }
  }, [token]);

  // Load user data
  const loadUser = async () => {
    try {
      const res = await axios.get(`${config.API_URL}/api/auth/user`);
      setUser(res.data);
      setLoading(false);
    } catch (error) {
      console.error('Load user error:', error.response?.data);
      localStorage.removeItem('token');
      setToken(null);
      setLoading(false);
    }
  };

  // Register user
  const register = async (formData) => {
    try {
      
      const res = await axios.post(`${config.API_URL}/api/auth/register`, formData);
      localStorage.setItem('token', res.data.token);
      setToken(res.data.token);
      setUser(res.data.user);
      return { success: true };
    } catch (error) {
      console.error('Registration error details:', error.response?.data);
      return {
        success: false,
        error: error.response?.data?.msg || error.response?.data?.errors?.[0]?.msg || 'Registration failed'
      };
    }
  };

  // Login user
  const login = async (formData) => {
    try {
      const res = await axios.post(`${config.API_URL}/api/auth/login`, formData);
      localStorage.setItem('token', res.data.token);
      setToken(res.data.token);
      setUser(res.data.user);
      return { success: true };
    } catch (error) {
      return {
        success: false,
        error: error.response?.data?.msg || 'Login failed'
      };
    }
  };

  // Logout user
  const logout = () => {
    localStorage.removeItem('token');
    setToken(null);
    setUser(null);
  };

  // Update user profile
  const updateProfile = async (profileData) => {
    try {
      const res = await axios.put(`${config.API_URL}/api/user/profile`, profileData);
      setUser(res.data);
      return { success: true };
    } catch (error) {
      return {
        success: false,
        error: error.response?.data?.msg || 'Failed to update profile'
      };
    }
  };

  // Change password
  const changePassword = async (passwordData) => {
    try {
      await axios.put(`${config.API_URL}/api/user/change-password`, passwordData);
      return { success: true };
    } catch (error) {
      return {
        success: false,
        error: error.response?.data?.msg || 'Failed to change password'
      };
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        loading,
        register,
        login,
        logout,
        updateProfile,
        changePassword,
        loadUser
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export default AuthContext;