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

    // 监听来自API拦截器的认证失效事件
    const handleAuthLogout = (event) => {
      console.log('收到认证失效事件:', event.detail);
      setIsAuthenticated(false);
      // 不显示消息，因为可能是页面刷新或导航过程中的正常情况
    };

    window.addEventListener('auth-logout', handleAuthLogout);

    // 清理事件监听器
    return () => {
      window.removeEventListener('auth-logout', handleAuthLogout);
    };
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
      // 清理所有认证相关的存储
      localStorage.removeItem('token');
      
      // 清理可能存在的认证cookie
      document.cookie = 'auth_token=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;';
      
      // 更新认证状态
      setIsAuthenticated(false);
      
      message.success('已退出登录');
      
      // 确保跳转到登录页
      setTimeout(() => {
        window.location.href = '/login';
      }, 500);
    }
  };

  const changeToken = async (newToken) => {
    try {
      // 检查是否已登录
      const currentToken = localStorage.getItem('token');
      if (!currentToken) {
        message.error('未找到当前Token，请重新登录');
        return false;
      }

      const requestData = { 
        new_token: newToken 
      };
      
      // 调试信息
      console.log('发送的请求数据:', requestData);
      console.log('当前Token长度:', currentToken?.length);
      console.log('新Token长度:', newToken?.length);

      const response = await api.post('/auth/change-token', requestData);
      if (response.data.success) {
        // 更新localStorage中的token
        localStorage.setItem('token', newToken);
        
        // 确保认证状态正确
        setIsAuthenticated(true);
        
        message.success('Token修改成功');
        
        console.log('Token修改成功，新token已保存');
        return true;
      }
    } catch (error) {
      console.error('Token修改错误:', error);
      console.error('错误响应:', error.response?.data);
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