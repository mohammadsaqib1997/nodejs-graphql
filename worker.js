const jobQueue = require('./jobQueue')
const {jobProcessor} = require('./jobProcessor')

jobQueue.process(jobProcessor)

jobQueue.on('completed', (job) => {
    console.log(`Job ${job.id} has completed`);
})

jobQueue.on('failed', (job, error) => {
    console.error(`Job ${job.id} has failed with error: ${error.message}`);
})