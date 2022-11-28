class Logger {

    // Initialization

    constructor(log) {
        this.LOG_ERRORS = false

        this.log = log
    }

    // Public methods

    logQuicksave(data) {
        let date = this.formatDate(new Date())
        let logItem = `[${date}] `

        let videoId = data.videoId
        let videoTitle = data.videoTitle
        let playlistTitle = data.playlistTitle

        if (data.error) {
            switch (data.error) {
                case 'alreadyInPlaylist':
                    logItem += `[ALREADY_IN_PLAYLIST] [${videoId}: ${videoTitle}] in [${playlistTitle}]\n`
                    break
                default:
                    logItem += `[UNEXPECTED_ERROR] ${data.error}\n`
                    console.log(data)
                    throw 'Unexpected error'
            }
        } else {
            logItem += `[QS] [${videoId}: ${videoTitle}] was quicksaved to [${playlistTitle}]\n`
        }

        if (!data.error || this.LOG_ERRORS) {
            this.log += logItem
        }
        
        console.log(logItem)
    }

    getLog() {
        return this.log
    }

    // Private methods

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
