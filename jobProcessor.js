const jobProcessor = async (job) => {
    let updateData = {...job.data}
    try {
        console.log(`Processing job ${job.id}`);
        updateData = {
            ...updateData,
            status: 'completed',
            result: 'Job completed successfully'
        }
        job.update(updateData)
    } catch (e) {
        console.error(`Error processing job ${job.id}: ${e.message}`);
        updateData = {
            ...updateData,
            status: 'failed',
            result: e.message
        }
        job.update(updateData)
    }
}

module.exports = {jobProcessor}