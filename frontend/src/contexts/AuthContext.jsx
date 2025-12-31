import { createContext, useContext, useState, useEffect } from 'react';
import axios from 'axios';
import api from '../services/api';

const AuthContext = createContext(null);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(localStorage.getItem('token'));
  const [loading, setLoading] = useState(true);

  // Token is now handled by api.js interceptors
  // No need to set axios.defaults here

  // Verify token on mount
  useEffect(() => {
    const verifyToken = async () => {
      if (!token) {
        setLoading(false);
        return;
      }

      try {
        const response = await api.get('/auth/verify');
        if (response.data.valid) {
          setUser(response.data.user);
        } else {
          // Token invalid, clear it
          setToken(null);
          setUser(null);
          localStorage.removeItem('token');
        }
      } catch (error) {
        console.error('Token verification failed:', error);
        // Only clear token if it's actually invalid (401), not network errors
        if (error.response?.status === 401) {
          setToken(null);
          setUser(null);
          localStorage.removeItem('token');
        }
      } finally {
        setLoading(false);
      }
    };

    verifyToken();
  }, []);

  const login = async (username, password, rememberMe = false) => {
    try {
      const response = await axios.post('/api/auth/login', {
        username,
        password,
        rememberMe
      });

      const { token: newToken, user: userData } = response.data;

      setToken(newToken);
      setUser(userData);
      localStorage.setItem('token', newToken);

      return { success: true };
    } catch (error) {
      return {
        success: false,
        error: error.response?.data?.message || 'Login failed'
      };
    }
  };

  const logout = async () => {
    try {
      await axios.post('/api/auth/logout');
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      setToken(null);
      setUser(null);
      localStorage.removeItem('token');
    }
  };

  const value = {
    user,
    token,
    login,
    logout,
    isAuthenticated: !!user,
    loading
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
