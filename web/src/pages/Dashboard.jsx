import React, { useState, useEffect } from 'react';
import { 
  Layout, 
  Card, 
  Typography, 
  Button, 
  message, 
  Spin, 
  Row, 
  Col, 
  Space, 
  Divider,
  Avatar,
  Dropdown,
  Badge
} from 'antd';
import { 
  LogoutOutlined, 
  SettingOutlined, 
  UserOutlined, 
  BellOutlined,
  DashboardOutlined,
  HistoryOutlined,
  RocketOutlined
} from '@ant-design/icons';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import TransformForm from '../components/TransformForm';
import TransformStatus from '../components/TransformStatus';
import HistoryList from '../components/HistoryList';
import TokenChangeModal from '../components/TokenChangeModal';
import './Dashboard.css';

const { Header, Content, Footer } = Layout;
const { Title, Text } = Typography;

const Dashboard = () => {
  const [transformStatus, setTransformStatus] = useState({
    status: 'idle', // idle, running, success, error
    message: '',
    progress: ''
  });
  const [tokenModalVisible, setTokenModalVisible] = useState(false);
  const [refreshHistory, setRefreshHistory] = useState(0);
  const [collapsed, setCollapsed] = useState(false);
  
  const { isAuthenticated, logout, loading } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!loading && !isAuthenticated) {
      navigate('/login');
    }
  }, [isAuthenticated, loading, navigate]);

  const handleLogout = () => {
    logout();
  };

  const handleTransformComplete = () => {
    // 转换完成后刷新历史记录
    setRefreshHistory(prev => prev + 1);
  };

  // 用户菜单
  const userMenuItems = [
    {
      key: 'settings',
      icon: <SettingOutlined />,
      label: '修改Token',
      onClick: () => setTokenModalVisible(true)
    },
    {
      type: 'divider',
    },
    {
      key: 'logout',
      icon: <LogoutOutlined />,
      label: '退出登录',
      onClick: handleLogout
    }
  ];

  if (loading) {
    return (
      <div className="loading-container">
        <Spin size="large" tip="加载中...">
          <div style={{ height: '200px' }}></div>
        </Spin>
      </div>
    );
  }

  if (!isAuthenticated) {
    return null;
  }

  return (
    <Layout className="dashboard-layout">
      {/* 标准的Header布局 */}
      <Header className="dashboard-header">
        <div className="header-content">
          <div className="header-left">
            <div className="logo">
              <RocketOutlined className="logo-icon" />
              <Title level={4} className="logo-text">
                Docker镜像转换服务
              </Title>
            </div>
          </div>
          
          <div className="header-right">
            <Space size="middle">
              <Badge count={0} showZero={false}>
                <Button 
                  type="text" 
                  icon={<BellOutlined />} 
                  className="header-action-btn"
                />
              </Badge>
              
              <Dropdown 
                menu={{ items: userMenuItems }}
                placement="bottomRight"
                trigger={['click']}
              >
                <Button type="text" className="user-info">
                  <Space>
                    <Avatar size="small" icon={<UserOutlined />} />
                    <Text className="username">管理员</Text>
                  </Space>
                </Button>
              </Dropdown>
            </Space>
          </div>
        </div>
      </Header>

      {/* 主要内容区域 */}
      <Content className="dashboard-content">
        <div className="content-container">
          {/* 页面标题区域 */}
          <div className="page-header">
            <div className="page-header-content">
              <Space align="center">
                <DashboardOutlined className="page-icon" />
                <div>
                  <Title level={3} className="page-title">控制台</Title>
                  <Text type="secondary">Docker镜像转换管理平台</Text>
                </div>
              </Space>
            </div>
          </div>

          <Divider style={{ margin: '24px 0' }} />

          {/* 主要功能区域 */}
          <Row gutter={[24, 24]}>
            {/* 左侧主要操作区 */}
            <Col xs={24} lg={16}>
              <Space direction="vertical" size="large" style={{ width: '100%' }}>
                {/* 镜像转换卡片 */}
                <Card 
                  title={
                    <Space>
                      <RocketOutlined style={{ color: '#1890ff' }} />
                      <span>镜像转换</span>
                    </Space>
                  }
                  className="function-card transform-card"
                  size="small"
                >
                  <TransformForm 
                    onStatusChange={setTransformStatus}
                    onComplete={handleTransformComplete}
                  />
                </Card>

                {/* 执行状态卡片 */}
                <Card 
                  title={
                    <Space>
                      <Badge 
                        status={
                          transformStatus.status === 'running' ? 'processing' :
                          transformStatus.status === 'success' ? 'success' :
                          transformStatus.status === 'error' ? 'error' : 'default'
                        }
                      />
                      <span>执行状态</span>
                    </Space>
                  }
                  className="function-card status-card"
                  size="small"
                >
                  <TransformStatus status={transformStatus} />
                </Card>
              </Space>
            </Col>

            {/* 右侧历史记录区 */}
            <Col xs={24} lg={8}>
              <Card 
                title={
                  <Space>
                    <HistoryOutlined style={{ color: '#52c41a' }} />
                    <span>转换历史</span>
                  </Space>
                }
                className="function-card history-card"
                size="small"
                style={{ height: 'fit-content' }}
              >
                <HistoryList refreshTrigger={refreshHistory} />
              </Card>
            </Col>
          </Row>
        </div>
      </Content>

      {/* Footer */}
      <Footer className="dashboard-footer">
        <div className="footer-content">
          <Text type="secondary">
            Docker镜像转换服务 ©2025 Created with ❤️
          </Text>
          <Space split={<Divider type="vertical" />}>
            <Text type="secondary">版本 1.0.0</Text>
            <Text type="secondary">帮助文档</Text>
            <Text type="secondary">问题反馈</Text>
          </Space>
        </div>
      </Footer>

      {/* Token修改模态框 */}
      <TokenChangeModal
        visible={tokenModalVisible}
        onClose={() => setTokenModalVisible(false)}
      />
    </Layout>
  );
};

export default Dashboard; 