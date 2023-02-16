module.exports = {
  apps: [
    {
      name: 'elemental',
      script: './index.js',
      watch: false,
      time: true,
      log_date_format: 'YYYY-MM-DD HH:mm',
      instance_var: 'INSTANCE_ID',
      env: {
        NODE_ENV: 'production'
      }
    }
  ]
};
