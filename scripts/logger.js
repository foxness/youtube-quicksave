class Logger {

    // Initialization

    constructor(log) {
        this.log = log
    }

    // Public methods

    logQuicksave(data) {
        let date = this.formatDate(new Date())

        let logItem
        if (data == 'alreadyInPlaylist') {
            logItem = `[${date}] alreadyInPlaylist\n`
        } else {
            let videoId = data.videoId
            let videoTitle = data.videoTitle
            let playlistTitle = data.playlistTitle
            
            logItem = `[${date}] [${videoId}: ${videoTitle}] was quicksaved to [${playlistTitle}]\n`
        }

        this.log += logItem
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

        return `${year}/${month}${day} ${hours}:${minutes}:${seconds}`
    }
}

export default Logger
