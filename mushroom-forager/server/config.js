const config = {
    development: {
      port: 3000,
      debug: true
    },
    production: {
      port: process.env.PORT || 8080,
      debug: false
    }
  };
  
  const env = process.env.NODE_ENV || 'development';
  module.exports = config[env];