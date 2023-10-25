const Queue = require('bull')

const redisConfig = {
    redis: {
        port: 6379,
        host: '127.0.0.1'
    }
}

const jobQueue = new Queue('jobQueues', redisConfig)

module.exports = jobQueue