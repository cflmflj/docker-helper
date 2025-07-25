import React, { createContext, useContext, useState, useEffect } from 'react';
import { message } from 'antd';
import api from '../services/api';

const AuthContext = createContext();

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // 检查localStorage中是否有token
    const token = localStorage.getItem('token');
    if (token) {
      setIsAuthenticated(true);
    }
    setLoading(false);
  }, []);

  const login = async (token) => {
    try {
      const response = await api.post('/auth/login', { token });
      if (response.data.success) {
        localStorage.setItem('token', token);
        setIsAuthenticated(true);
        message.success('登录成功');
        return true;
      }
    } catch (error) {
      message.error(error.response?.data?.message || '登录失败');
      return false;
    }
  };

  const logout = async () => {
    try {
      await api.post('/auth/logout');
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      localStorage.removeItem('token');
      setIsAuthenticated(false);
      message.success('已退出登录');
    }
  };

  const changeToken = async (newToken) => {
    try {
      const response = await api.post('/auth/change-token', { token: newToken });
      if (response.data.success) {
        localStorage.setItem('token', newToken);
        message.success('Token修改成功');
        return true;
      }
    } catch (error) {
      message.error(error.response?.data?.message || 'Token修改失败');
      return false;
    }
  };

  const value = {
    isAuthenticated,
    login,
    logout,
    changeToken,
    loading
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}; 