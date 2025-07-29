import React, { useState, useEffect } from 'react';
import { Card, Form, Input, Button, Typography, message } from 'antd';
import { LockOutlined } from '@ant-design/icons';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import './Login.css';

const { Title, Text } = Typography;

const Login = () => {
  const [loading, setLoading] = useState(false);
  const { login, isAuthenticated } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (isAuthenticated) {
      navigate('/dashboard');
    } else {
      // 如果未认证，确保清理任何可能残留的无效token
      const token = localStorage.getItem('token');
      if (token) {
        console.log('检测到未认证状态但存在token，清理中...');
        localStorage.removeItem('token');
        // 清理可能存在的认证cookie
        document.cookie = 'auth_token=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;';
      }
    }
  }, [isAuthenticated, navigate]);

  const onFinish = async (values) => {
    setLoading(true);
    const success = await login(values.token);
    if (success) {
      navigate('/dashboard');
    }
    setLoading(false);
  };

  return (
    <div className="login-container">
      <div className="login-wrapper">
        <Card className="login-card">
          <div className="login-header">
            <Title level={2} className="login-title">
              🐳 Docker镜像转换服务
            </Title>
            <Text type="secondary">
              请输入Token进行登录
            </Text>
          </div>
          
          <Form
            name="login"
            className="login-form"
            onFinish={onFinish}
            autoComplete="off"
            size="large"
          >
            <Form.Item
              name="token"
              rules={[
                {
                  required: true,
                  message: '请输入Token!',
                },
              ]}
            >
              <Input.Password
                prefix={<LockOutlined className="site-form-item-icon" />}
                placeholder="请输入Token"
                autoComplete="current-password"
              />
            </Form.Item>

            <Form.Item>
              <Button
                type="primary"
                htmlType="submit"
                className="login-form-button"
                loading={loading}
                block
              >
                登录
              </Button>
            </Form.Item>
          </Form>

          <div className="login-footer">
            <Text type="secondary" className="login-hint">
              默认Token: docker-transformer
            </Text>
          </div>
        </Card>
      </div>
    </div>
  );
};

export default Login; 