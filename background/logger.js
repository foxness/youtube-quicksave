class Logger {

    // Initialization

    constructor(log, quicksaveCount) {
        this.SHOULD_LOG_ERRORS = false

        this.log = log || ''
        this.quicksaveCount = quicksaveCount || 0
    }

    static fromSerialized(serialized) {
        let parsed = JSON.parse(serialized)

        let log = parsed.log
        let quicksaveCount = parsed.quicksaveCount

        return new Logger(log, quicksaveCount)
    }

    // Public methods

    logQuicksave(data) {
        let videoId = data.videoId
        let videoTitle = data.videoTitle
        let playlistTitle = data.playlistTitle

        let logItem
        if (data.error) {
            switch (data.error) {
                case 'alreadyInPlaylist':
                    logItem = `[ALREADY_IN_PLAYLIST] [${videoId}: ${videoTitle}] in [${playlistTitle}]`
                    break
                default:
                    logItem = `[UNEXPECTED_ERROR] ${data.error}`
                    console.log(data)
                    throw 'Unexpected error'
            }
        } else {
            logItem = `[QS] [${videoId}: ${videoTitle}] was quicksaved to [${playlistTitle}]`
            this.quicksaveCount += 1
        }

        if (!data.error || this.SHOULD_LOG_ERRORS) {
            this.loggy(logItem)
        }
    }

    logDeduplication(data) {
        let playlistTitle = data.playlistTitle
        let playlistCount = data.playlistCount
        let deletedCount = data.deletedCount

        let logItem
        if (deletedCount == 0) {
            logItem = `[NO_DP] no duplicate videos found in [${playlistTitle}]`
        } else {
            let vidText = `${deletedCount} duplicate video${deletedCount == 1 ? '' : 's'}`
            logItem = `[DP] removed ${vidText} out of ${playlistCount} from [${playlistTitle}]`
        }

        this.loggy(logItem)
    }

    getLog() {
        return this.log
    }

    getQuicksaveCount() {
        return this.quicksaveCount
    }

    getSerialized() {
        let serialized = {
            log: this.log,
            quicksaveCount: this.quicksaveCount
        }

        return JSON.stringify(serialized)
    }

    // Private methods

    loggy(item) {
        let date = this.formatDate(new Date())
        let logItem = `[${date}] ${item}\n`
        this.log += logItem
        console.log(logItem)
    }

    formatDate(date) {
        let year = date.getFullYear()
        let month = '' + (date.getMonth() + 1)
        let day = '' + date.getDate()

        let hours = '' + date.getHours()
        let minutes = '' + date.getMinutes()
        let seconds = '' + date.getSeconds()

        month = month.padStart(2, '0')
        day = day.padStart(2, '0')
        hours = hours.padStart(2, '0')
        minutes = minutes.padStart(2, '0')
        seconds = seconds.padStart(2, '0')

        return `${year}/${month}/${day} ${hours}:${minutes}:${seconds}`
    }
}

export default Logger
