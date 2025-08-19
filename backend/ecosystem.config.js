module.exports = {
  apps: [
    {
      name: 'pdftrackr-backend',
      script: 'dist/app/src/index.js',
      instances: 4,
      exec_mode: 'cluster',
      watch: false,
      max_memory_restart: '380M',
      env: {
        NODE_ENV: 'production',
      },
    },
  ],
};


