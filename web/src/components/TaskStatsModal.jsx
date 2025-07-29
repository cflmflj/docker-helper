import React, { useState, useEffect } from 'react';
import { Modal, Tabs, Table, Card, Row, Col, Statistic, Spin, Empty } from 'antd';
import { 
  BarChartOutlined, 
  LineChartOutlined, 
  PieChartOutlined,
  CheckCircleOutlined,
  CloseCircleOutlined,
  ClockCircleOutlined
} from '@ant-design/icons';
import api from '../services/api';

const { TabPane } = Tabs;

const TaskStatsModal = ({ visible, onClose }) => {
  const [loading, setLoading] = useState(false);
  const [stats, setStats] = useState(null);

  // 获取详细统计数据
  const fetchDetailedStats = async () => {
    setLoading(true);
    try {
      const response = await api.get('/history/detailed-stats');
      if (response.data.success) {
        setStats(response.data.data);
      }
    } catch (error) {
      console.error('获取详细统计失败:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (visible) {
      fetchDetailedStats();
    }
  }, [visible]);

  // 日期统计表格列定义
  const dateColumns = [
    {
      title: '日期',
      dataIndex: 'date',
      key: 'date',
      width: 120,
    },
    {
      title: '总任务数',
      dataIndex: 'total',
      key: 'total',
      width: 100,
      align: 'center',
    },
    {
      title: '成功',
      dataIndex: 'success',
      key: 'success',
      width: 80,
      align: 'center',
      render: (value) => (
        <span style={{ color: '#52c41a' }}>
          <CheckCircleOutlined style={{ marginRight: 4 }} />
          {value}
        </span>
      ),
    },
    {
      title: '失败',
      dataIndex: 'failed',
      key: 'failed',
      width: 80,
      align: 'center',
      render: (value) => (
        <span style={{ color: '#ff4d4f' }}>
          <CloseCircleOutlined style={{ marginRight: 4 }} />
          {value}
        </span>
      ),
    },
    {
      title: '平均耗时(秒)',
      dataIndex: 'avg_duration',
      key: 'avg_duration',
      width: 120,
      align: 'center',
      render: (value) => value ? Math.round(value) : '--',
    },
  ];

  // 仓库统计表格列定义
  const registryColumns = [
    {
      title: '仓库地址',
      dataIndex: 'registry',
      key: 'registry',
      ellipsis: true,
    },
    {
      title: '总任务数',
      dataIndex: 'total',
      key: 'total',
      width: 100,
      align: 'center',
    },
    {
      title: '成功',
      dataIndex: 'success',
      key: 'success',
      width: 80,
      align: 'center',
      render: (value) => (
        <span style={{ color: '#52c41a' }}>
          <CheckCircleOutlined style={{ marginRight: 4 }} />
          {value}
        </span>
      ),
    },
    {
      title: '失败',
      dataIndex: 'failed',
      key: 'failed',
      width: 80,
      align: 'center',
      render: (value) => (
        <span style={{ color: '#ff4d4f' }}>
          <CloseCircleOutlined style={{ marginRight: 4 }} />
          {value}
        </span>
      ),
    },
    {
      title: '成功率',
      key: 'success_rate',
      width: 100,
      align: 'center',
      render: (_, record) => {
        const rate = record.total > 0 ? Math.round((record.success / record.total) * 100) : 0;
        return `${rate}%`;
      },
    },
  ];

  // 失败统计表格列定义
  const failureColumns = [
    {
      title: '失败原因',
      dataIndex: 'error_msg',
      key: 'error_msg',
      ellipsis: true,
    },
    {
      title: '出现次数',
      dataIndex: 'count',
      key: 'count',
      width: 100,
      align: 'center',
      render: (value) => (
        <span style={{ color: '#ff4d4f' }}>
          <CloseCircleOutlined style={{ marginRight: 4 }} />
          {value}
        </span>
      ),
    },
  ];

  // 格式化平均耗时
  const formatAvgDuration = (seconds) => {
    if (!seconds || seconds === 0) return '0分钟';
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    if (minutes === 0) return `${remainingSeconds}秒`;
    if (remainingSeconds === 0) return `${minutes}分钟`;
    return `${minutes}分${remainingSeconds}秒`;
  };

  return (
    <Modal
      title={
        <span>
          <BarChartOutlined style={{ marginRight: 8 }} />
          详细统计信息
        </span>
      }
      open={visible}
      onCancel={onClose}
      footer={null}
      width={1000}
      style={{ top: 20 }}
    >
      <Spin spinning={loading}>
        {stats ? (
          <Tabs defaultActiveKey="overview" size="large">
            {/* 概览统计 */}
            <TabPane 
              tab={
                <span>
                  <BarChartOutlined />
                  概览统计
                </span>
              } 
              key="overview"
            >
              <Row gutter={[16, 16]}>
                <Col span={8}>
                  <Card size="small">
                    <Statistic
                      title="总任务数"
                      value={stats.date_stats?.reduce((sum, item) => sum + item.total, 0) || 0}
                      prefix={<BarChartOutlined />}
                    />
                  </Card>
                </Col>
                <Col span={8}>
                  <Card size="small">
                    <Statistic
                      title="总成功数"
                      value={stats.date_stats?.reduce((sum, item) => sum + item.success, 0) || 0}
                      prefix={<CheckCircleOutlined />}
                      valueStyle={{ color: '#52c41a' }}
                    />
                  </Card>
                </Col>
                <Col span={8}>
                  <Card size="small">
                    <Statistic
                      title="总失败数"
                      value={stats.date_stats?.reduce((sum, item) => sum + item.failed, 0) || 0}
                      prefix={<CloseCircleOutlined />}
                      valueStyle={{ color: '#ff4d4f' }}
                    />
                  </Card>
                </Col>
              </Row>
              
              <div style={{ marginTop: 16 }}>
                <Card title="最近30天任务趋势" size="small">
                  <Table
                    dataSource={stats.date_stats || []}
                    columns={dateColumns}
                    pagination={false}
                    size="small"
                    scroll={{ y: 300 }}
                  />
                </Card>
              </div>
            </TabPane>

            {/* 仓库统计 */}
            <TabPane 
              tab={
                <span>
                  <PieChartOutlined />
                  仓库统计
                </span>
              } 
              key="registry"
            >
              <Card title="各仓库使用情况" size="small">
                <Table
                  dataSource={stats.registry_stats || []}
                  columns={registryColumns}
                  pagination={false}
                  size="small"
                  scroll={{ y: 400 }}
                />
              </Card>
            </TabPane>

            {/* 失败分析 */}
            <TabPane 
              tab={
                <span>
                  <CloseCircleOutlined />
                  失败分析
                </span>
              } 
              key="failure"
            >
              <Card title="常见失败原因" size="small">
                {stats.failure_stats && stats.failure_stats.length > 0 ? (
                  <Table
                    dataSource={stats.failure_stats}
                    columns={failureColumns}
                    pagination={false}
                    size="small"
                    scroll={{ y: 400 }}
                  />
                ) : (
                  <Empty description="暂无失败记录" />
                )}
              </Card>
            </TabPane>
          </Tabs>
        ) : (
          <Empty description="暂无统计数据" />
        )}
      </Spin>
    </Modal>
  );
};

export default TaskStatsModal; 