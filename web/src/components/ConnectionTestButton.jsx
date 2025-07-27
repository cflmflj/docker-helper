import React, { useState } from 'react';
import { Button, message, Tooltip } from 'antd';
import { WifiOutlined, LoadingOutlined, CheckCircleOutlined, CloseCircleOutlined } from '@ant-design/icons';
import api from '../services/api';

const ConnectionTestButton = ({ 
  registryURL, 
  username, 
  password,
  onTestResult,
  size = 'default',
  type = 'default',
  style = {}
}) => {
  const [testing, setTesting] = useState(false);
  const [lastResult, setLastResult] = useState(null);

  const handleTest = async () => {
    // 验证输入
    if (!registryURL || !registryURL.trim()) {
      message.warning('请输入仓库地址');
      return;
    }
    
    if (!username || !username.trim()) {
      message.warning('请输入用户名');
      return;
    }
    
    if (!password || !password.trim()) {
      message.warning('请输入密码');
      return;
    }

    setTesting(true);
    setLastResult(null);
    
    try {
      const response = await api.post('/registry/test', {
        registry_url: registryURL.trim(),
        username: username.trim(),
        password: password
      });

      if (response.data.success) {
        const result = response.data.data;
        setLastResult(result);
        
        if (result.success) {
          const successMsg = `连接成功! 响应时间: ${result.response_time}ms${result.can_push ? ', 具有推送权限' : ', 无推送权限'}`;
          message.success(successMsg);
          
          // 调用回调函数
          onTestResult && onTestResult({
            success: true,
            canPush: result.can_push,
            responseTime: result.response_time,
            registryType: result.registry_type
          });
        } else {
          message.error(`连接失败: ${result.error}`);
          onTestResult && onTestResult({
            success: false,
            error: result.error
          });
        }
      }
    } catch (error) {
      const errorMsg = error.response?.data?.message || '测试连接失败';
      message.error(errorMsg);
      setLastResult({ success: false, error: errorMsg });
      onTestResult && onTestResult({
        success: false,
        error: errorMsg
      });
    } finally {
      setTesting(false);
    }
  };

  // 获取按钮图标
  const getIcon = () => {
    if (testing) {
      return <LoadingOutlined spin />;
    }
    
    if (lastResult) {
      return lastResult.success ? <CheckCircleOutlined /> : <CloseCircleOutlined />;
    }
    
    return <WifiOutlined />;
  };

  // 获取按钮类型
  const getButtonType = () => {
    if (lastResult) {
      return lastResult.success ? 'primary' : 'danger';
    }
    return type;
  };

  // 获取按钮提示文本
  const getTooltip = () => {
    if (testing) {
      return '正在测试连接...';
    }
    
    if (lastResult) {
      if (lastResult.success) {
        return `连接成功 (${lastResult.response_time}ms)`;
      } else {
        return `连接失败: ${lastResult.error}`;
      }
    }
    
    const missing = [];
    if (!registryURL) missing.push('仓库地址');
    if (!username) missing.push('用户名');
    if (!password) missing.push('密码');
    
    if (missing.length > 0) {
      return `请填写: ${missing.join('、')}`;
    }
    
    return '测试仓库连接';
  };

  const isDisabled = !registryURL || !username || !password || testing;

  return (
    <Tooltip title={getTooltip()}>
      <Button 
        icon={getIcon()}
        onClick={handleTest}
        loading={testing}
        type={getButtonType()}
        size={size}
        disabled={isDisabled}
        style={style}
      >
        测试连接
      </Button>
    </Tooltip>
  );
};

export default ConnectionTestButton; 