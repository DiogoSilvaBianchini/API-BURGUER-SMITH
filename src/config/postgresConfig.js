require("dotenv").config()

module.exports = {
  "development": {
    "username": process.env.DB_POSTGRES_USER_NAME,
    "password": process.env.DB_POSTGRES_PASS,
    "database": process.env.DB_POSTGRES_NAME,
    "host": process.env.DB_POSTGRES_HOST,
    "dialectOptions": {
      "ssl": {
        "require": true,
        "rejectUnauthorized": false
      }
    },
    "dialect": "postgres",
    "logging": false,
    "pool": {
      max: 10,
      min: 1,
      acquire: 15000,
      idle: 10000
    },
    "timezone": "-03:00"
  },
  "production": {
    "username": process.env.DB_POSTGRES_USER_NAME,
    "password": process.env.DB_POSTGRES_PASS,
    "database": process.env.DB_POSTGRES_NAME,
    "host": "ep-restless-paper-a81dlkit.eastus2.azure.neon.tech",
    "dialect": "postgres",
    "dialectOptions": {
      "ssl": {
        "require": true,
        "rejectUnauthorized": false
      }
    },
    "logging": false,
    "pool": {
      max: 10,
      min: 1,
      acquire: 30000,
      idle: 10000
    },
    "timezone": "-03:00"
  }
}
