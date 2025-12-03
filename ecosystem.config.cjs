/**
 * PM2 进程管理配置
 * 用于生产环境部署
 */

module.exports = {
  apps: [
    {
      name: 'kewen-sql-api',
      script: './src/server.js',

      // 实例配置（根据CPU核心数自动调整）
      instances: 2, // 可以设置为 'max' 使用所有CPU核心
      exec_mode: 'cluster', // 集群模式，支持负载均衡

      // 环境变量
      env: {
        NODE_ENV: 'production',
        PORT: 3000
      },

      // 性能优化
      max_memory_restart: '300M', // 内存超过300MB自动重启（低内存配置）
      max_restarts: 10, // 最大重启次数
      min_uptime: '10s', // 最小运行时间

      // 自动重启配置
      autorestart: true,
      watch: false, // 生产环境不建议开启文件监控
      ignore_watch: ['node_modules', 'logs', '.git'],

      // 日志配置
      log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
      error_file: './logs/error.log',
      out_file: './logs/out.log',
      log_file: './logs/combined.log',
      merge_logs: true,

      // 优雅关闭
      kill_timeout: 5000,
      wait_ready: true,
      listen_timeout: 10000,

      // 性能监控
      instance_var: 'INSTANCE_ID'
    }
  ]
};
