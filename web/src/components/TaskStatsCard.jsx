import React, { useState } from 'react';
import { Card, Space, Statistic, Row, Col, Button } from 'antd';
import { 
  DashboardOutlined, 
  ClockCircleOutlined,
  CheckCircleOutlined,
  CloseCircleOutlined,
  ThunderboltOutlined,
  BarChartOutlined
} from '@ant-design/icons';
import TaskStatsModal from './TaskStatsModal';

const TaskStatsCard = ({ stats, onViewDetails }) => {
  const [modalVisible, setModalVisible] = useState(false);
  
  const {
    total = 0,
    running = 0,
    queued = 0,
    success = 0,
    failed = 0,
    avgDuration = 0
  } = stats || {};

  // 格式化平均时长
  const formatAvgDuration = (seconds) => {
    if (!seconds || seconds === 0) return '0分钟';
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    if (minutes === 0) return `${remainingSeconds}秒`;
    if (remainingSeconds === 0) return `${minutes}分钟`;
    return `${minutes}分${remainingSeconds}秒`;
  };

  // 计算成功率
  const getSuccessRate = () => {
    if (total === 0) return 0;
    return Math.round((success / total) * 100);
  };

  const handleViewDetails = () => {
    setModalVisible(true);
  };

  return (
    <>
      <Card 
        title={
          <Space>
            <DashboardOutlined style={{ color: '#722ed1' }} />
            <span>任务概览</span>
          </Space>
        }
        className="function-card stats-card"
        size="small"
        extra={
          <Button 
            size="small" 
            type="link" 
            icon={<BarChartOutlined />}
            onClick={handleViewDetails}
          >
            详细统计
          </Button>
        }
      >
        <div className="stats-content">
          {/* 主要统计 */}
          <Row gutter={[16, 16]}>
            <Col span={12}>
              <Statistic
                title="总任务数"
                value={total}
                prefix={<DashboardOutlined style={{ color: '#722ed1' }} />}
                valueStyle={{ fontSize: '20px', fontWeight: 'bold' }}
              />
            </Col>
            <Col span={12}>
              <Statistic
                title="成功率"
                value={getSuccessRate()}
                suffix="%"
                prefix={<CheckCircleOutlined style={{ color: '#52c41a' }} />}
                valueStyle={{ 
                  fontSize: '20px', 
                  fontWeight: 'bold',
                  color: getSuccessRate() >= 90 ? '#52c41a' : getSuccessRate() >= 70 ? '#faad14' : '#ff4d4f'
                }}
              />
            </Col>
          </Row>

          {/* 状态分布 */}
          <div style={{ marginTop: 16, marginBottom: 16 }}>
            <Row gutter={[8, 8]}>
              <Col span={6}>
                <div style={{ textAlign: 'center', padding: '8px 0' }}>
                  <div style={{ fontSize: '16px', fontWeight: 'bold', color: '#1890ff' }}>
                    {running}
                  </div>
                  <div style={{ fontSize: '11px', color: '#666' }}>
                    <ThunderboltOutlined style={{ marginRight: 2 }} />
                    执行中
                  </div>
                </div>
              </Col>
              <Col span={6}>
                <div style={{ textAlign: 'center', padding: '8px 0' }}>
                  <div style={{ fontSize: '16px', fontWeight: 'bold', color: '#faad14' }}>
                    {queued}
                  </div>
                  <div style={{ fontSize: '11px', color: '#666' }}>
                    <ClockCircleOutlined style={{ marginRight: 2 }} />
                    队列中
                  </div>
                </div>
              </Col>
              <Col span={6}>
                <div style={{ textAlign: 'center', padding: '8px 0' }}>
                  <div style={{ fontSize: '16px', fontWeight: 'bold', color: '#52c41a' }}>
                    {success}
                  </div>
                  <div style={{ fontSize: '11px', color: '#666' }}>
                    <CheckCircleOutlined style={{ marginRight: 2 }} />
                    成功
                  </div>
                </div>
              </Col>
              <Col span={6}>
                <div style={{ textAlign: 'center', padding: '8px 0' }}>
                  <div style={{ fontSize: '16px', fontWeight: 'bold', color: '#ff4d4f' }}>
                    {failed}
                  </div>
                  <div style={{ fontSize: '11px', color: '#666' }}>
                    <CloseCircleOutlined style={{ marginRight: 2 }} />
                    失败
                  </div>
                </div>
              </Col>
            </Row>
          </div>

          {/* 平均耗时 */}
          <div style={{ 
            backgroundColor: '#f6f6f6', 
            padding: '12px', 
            borderRadius: '6px',
            textAlign: 'center'
          }}>
            <div style={{ fontSize: '14px', color: '#666', marginBottom: 4 }}>
              平均执行时间
            </div>
            <div style={{ fontSize: '18px', fontWeight: 'bold', color: '#1890ff' }}>
              {total > 0 ? formatAvgDuration(avgDuration) : '--'}
            </div>
          </div>
        </div>
      </Card>

      {/* 详细统计弹窗 */}
      <TaskStatsModal 
        visible={modalVisible}
        onClose={() => setModalVisible(false)}
      />
    </>
  );
};

export default TaskStatsCard; 