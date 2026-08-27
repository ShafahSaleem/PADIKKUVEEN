import React, { createContext, useState, useEffect } from 'react';
import api from '../services/api';

export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  // Initialize from localStorage
  const [user, setUser] = useState(() => {
    try {
      const storedUser = localStorage.getItem('user');
      return storedUser ? JSON.parse(storedUser) : null;
    } catch {
      return null;
    }
  });
  const [token, setToken] = useState(() => localStorage.getItem('token'));

  const login = async (email, password) => {
    const response = await api.post('/auth/login', { email, password });
    const { token: receivedToken, user: loggedUser } = response.data;
    setToken(receivedToken);
    setUser(loggedUser);
    localStorage.setItem('token', receivedToken);
    localStorage.setItem('user', JSON.stringify(loggedUser));
    return { token: receivedToken, user: loggedUser };
  };

  const googleLogin = async (credential) => {
    const response = await api.post('/auth/google', { credential });
    const { token: receivedToken, user: loggedUser } = response.data;
    setToken(receivedToken);
    setUser(loggedUser);
    localStorage.setItem('token', receivedToken);
    localStorage.setItem('user', JSON.stringify(loggedUser));
    return { token: receivedToken, user: loggedUser };
  };

  const logout = () => {
    setToken(null);
    setUser(null);
    localStorage.removeItem('token');
    localStorage.removeItem('user');
  };

  // Set auth header and sync fresh user profile
  useEffect(() => {
    if (token) {
      api.defaults.headers.common['Authorization'] = `Bearer ${token}`;
      // Fetch updated profile to ensure latest name and avatar are present
      api
        .get('/auth/profile')
        .then((res) => {
          if (res.data?.user) {
            setUser(res.data.user);
            localStorage.setItem('user', JSON.stringify(res.data.user));
          }
        })
        .catch((err) => {
          console.warn('Failed to sync user profile:', err);
        });
    } else {
      delete api.defaults.headers.common['Authorization'];
    }
  }, [token]);

  return (
    <AuthContext.Provider value={{ user, token, login, googleLogin, logout }}>
      {children}
    </AuthContext.Provider>
  );
};
