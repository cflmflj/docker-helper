import axios from 'axios';

// 创建axios实例
const api = axios.create({
  baseURL: '/api',
  timeout: 300000, // 5分钟超时，因为镜像转换可能需要较长时间
  headers: {
    'Content-Type': 'application/json'
  }
});

// 请求拦截器
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      // 使用标准的Bearer格式
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// 响应拦截器
api.interceptors.response.use(
  (response) => {
    return response;
  },
  (error) => {
    if (error.response?.status === 401) {
      // Token过期或无效，清除本地存储并跳转到登录页
      localStorage.removeItem('token');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

// =============== 任务管理相关API接口 ===============
// 注意：以下接口需要后端实现，目前使用现有接口或模拟数据

// 获取任务列表 - 需要后端实现
// GET /api/tasks
export const getTasks = () => {
  // 暂时返回空数组，待后端实现
  return Promise.resolve({
    data: {
      success: true,
      data: []
    }
  });
};

// 获取任务统计 - 适配现有的历史统计接口
// GET /api/tasks/stats
export const getTaskStats = () => {
  return api.get('/history/stats');
};

// 创建任务 - 适配现有的转换接口，同时刷新历史记录
// POST /api/tasks
export const createTask = async (taskData) => {
  // 直接调用转换接口，转换完成后会自动记录到历史中
  return api.post('/transform/start', taskData);
};

// 获取任务进度 - 需要后端实现
// GET /api/tasks/{id}/progress
export const getTaskProgress = (taskId) => {
  // 暂时返回模拟数据，待后端实现
  return Promise.resolve({
    data: {
      success: true,
      data: {
        task_id: taskId,
        step: 1,
        step_name: "验证镜像",
        message: "正在验证镜像...",
        progress: 5,
        status: "running"
      }
    }
  });
};

// 取消任务 - 需要后端实现
// DELETE /api/tasks/{id}
export const cancelTask = (taskId) => {
  // 暂时返回成功，待后端实现
  return Promise.resolve({
    data: {
      success: true,
      message: "任务已取消"
    }
  });
};

// 调整任务优先级 - 需要后端实现
// PUT /api/tasks/{id}/priority
export const changePriority = (taskId, direction) => {
  // 暂时返回成功，待后端实现
  return Promise.resolve({
    data: {
      success: true,
      message: "优先级已调整"
    }
  });
};

export default api; 