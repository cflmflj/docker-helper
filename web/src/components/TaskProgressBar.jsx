import React from 'react';
import { Progress, Steps, Typography, Space } from 'antd';
import { 
  CheckCircleOutlined, 
  LoadingOutlined, 
  ClockCircleOutlined 
} from '@ant-design/icons';

const { Text } = Typography;

const TRANSFORM_STEPS = [
  { step: 1, name: "验证镜像", progress: 5 },
  { step: 2, name: "标准化处理", progress: 10 },
  { step: 3, name: "准备转换", progress: 15 },
  { step: 4, name: "拉取源镜像", progress: 60 },
  { step: 5, name: "标记镜像", progress: 70 },
  { step: 6, name: "推送镜像", progress: 95 },
  { step: 7, name: "清理资源", progress: 100 }
];

const TaskProgressBar = ({ progress }) => {
  if (!progress) {
    return (
      <div style={{ textAlign: 'center', padding: '20px 0' }}>
        <Text type="secondary">等待任务开始...</Text>
      </div>
    );
  }

  const { step = 1, step_name = "", message = "", progress: progressValue = 0 } = progress;

  // 生成步骤状态
  const getStepStatus = (stepIndex) => {
    const stepNumber = stepIndex + 1;
    if (stepNumber < step) return 'finish';
    if (stepNumber === step) return 'process';
    return 'wait';
  };

  // 生成步骤图标
  const getStepIcon = (stepIndex) => {
    const stepNumber = stepIndex + 1;
    if (stepNumber < step) return <CheckCircleOutlined />;
    if (stepNumber === step) return <LoadingOutlined spin />;
    return <ClockCircleOutlined />;
  };

  return (
    <div className="task-progress-bar">
      {/* 主进度条 */}
      <div style={{ marginBottom: 24 }}>
        <div style={{ marginBottom: 8 }}>
          <Space>
            <Text strong>步骤 {step}/7: {step_name}</Text>
            <Text type="secondary">{progressValue}%</Text>
          </Space>
        </div>
        <Progress 
          percent={progressValue} 
          status="active"
          strokeColor={{
            '0%': '#108ee9',
            '100%': '#87d068',
          }}
          size="default"
        />
        {message && (
          <div style={{ marginTop: 8 }}>
            <Text type="secondary" style={{ fontSize: '12px' }}>
              {message}
            </Text>
          </div>
        )}
      </div>

      {/* 详细步骤 */}
      <Steps
        direction="vertical"
        size="small"
        current={step - 1}
        items={TRANSFORM_STEPS.map((stepItem, index) => ({
          title: stepItem.name,
          status: getStepStatus(index),
          icon: getStepIcon(index),
          description: index === step - 1 ? message : undefined
        }))}
      />
    </div>
  );
};

export default TaskProgressBar; 