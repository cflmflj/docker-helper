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
  Badge,
  Modal
} from 'antd';
import { 
  LogoutOutlined, 
  SettingOutlined, 
  UserOutlined, 
  BellOutlined,
  DashboardOutlined,
  RocketOutlined
} from '@ant-design/icons';
import { useAuth } from '../contexts/AuthContext';
import { useTask } from '../contexts/TaskContext';
import { useNavigate } from 'react-router-dom';
import TaskCreateForm from '../components/TaskCreateForm';
import CurrentTaskCard from '../components/CurrentTaskCard';
import TaskQueueCard from '../components/TaskQueueCard';
import TaskStatsCard from '../components/TaskStatsCard';
import RecentHistoryCard from '../components/RecentHistoryCard';
import HistoryList from '../components/HistoryList';
import TokenChangeModal from '../components/TokenChangeModal';
import './Dashboard.css';

const { Header, Content, Footer } = Layout;
const { Title, Text } = Typography;

const Dashboard = () => {
  const [tokenModalVisible, setTokenModalVisible] = useState(false);
  const [historyModalVisible, setHistoryModalVisible] = useState(false);
  const [collapsed, setCollapsed] = useState(false);
  
  const { isAuthenticated, logout, loading } = useAuth();
  const { tasks, createTask, cancelTask, changePriority } = useTask();
  const navigate = useNavigate();

  useEffect(() => {
    if (!loading && !isAuthenticated) {
      navigate('/login');
    }
  }, [isAuthenticated, loading, navigate]);

  const handleLogout = () => {
    logout();
  };

  // 处理任务提交
  const handleTaskSubmit = async (taskData) => {
    await createTask(taskData);
  };

  // 处理任务取消
  const handleCancelTask = async (taskId) => {
    await cancelTask(taskId);
  };

  // 处理优先级调整
  const handlePriorityChange = async (taskId, direction) => {
    await changePriority(taskId, direction);
  };

  // 显示历史记录弹窗
  const showHistoryModal = () => {
    setHistoryModalVisible(true);
  };

  // 关闭历史记录弹窗
  const closeHistoryModal = () => {
    setHistoryModalVisible(false);
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
                {/* 任务创建表单 */}
                <Card 
                  title={
                    <Space>
                      <RocketOutlined style={{ color: '#1890ff' }} />
                      <span>新建转换任务</span>
                    </Space>
                  }
                  className="function-card create-task-card"
                  size="small"
                >
                  <TaskCreateForm onTaskSubmit={handleTaskSubmit} />
                </Card>

                {/* 当前执行任务 */}
                {tasks.current && (
                  <CurrentTaskCard 
                    task={tasks.current}
                    onCancel={handleCancelTask}
                  />
                )}

                {/* 任务队列 */}
                {tasks.queue && tasks.queue.length > 0 && (
                  <TaskQueueCard 
                    queue={tasks.queue}
                    onPriorityChange={handlePriorityChange}
                    onRemove={handleCancelTask}
                  />
                )}
              </Space>
            </Col>

            {/* 右侧信息展示区 */}
            <Col xs={24} lg={8}>
              <Space direction="vertical" size="large" style={{ width: '100%' }}>
                {/* 任务统计 */}
                <TaskStatsCard stats={tasks.stats} />
                
                {/* 最近历史 */}
                <RecentHistoryCard 
                  recent={tasks.recent}
                  onViewAll={showHistoryModal}
                />
              </Space>
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

      {/* 历史记录弹窗 */}
      <Modal
        title="转换历史记录"
        open={historyModalVisible}
        onCancel={closeHistoryModal}
        footer={null}
        width={800}
        style={{ top: 20 }}
      >
        <HistoryList />
      </Modal>
    </Layout>
  );
};

export default Dashboard; 