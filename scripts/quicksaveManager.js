import Storage from './storage.js'

class QuicksaveManager {

    // Initialization

    constructor(storage, youtube, quicksavePlaylistId, log) {
        this.storage = storage
        this.youtube = youtube
        this.quicksavePlaylistId = quicksavePlaylistId
        this.log = log
    }

    static async init(config) {
        let storage = new Storage(config)
        let youtube = await storage.getYoutube()
        let quicksavePlaylistId = await storage.getQuicksavePlaylistId()
        let log = await storage.getLog()

        if (quicksavePlaylistId == null && youtube.playlists != null && youtube.playlists.length > 0) {
            quicksavePlaylistId = youtube.playlists[0].id
        }

        return new QuicksaveManager(storage, youtube, quicksavePlaylistId, log)
    }

    // Public methods

    async signIn() {
        let result = await this.youtube.signInAndFetchPlaylists()

        await this.setupQuicksavePlaylistIdUsingRecent()
        await this.serializeYoutube()
        await this.updatePopup()

        return result
    }

    async signOut() {
        let result = await this.youtube.signOut()

        await this.serializeYoutube()
        await this.updatePopup()

        return result
    }

    async quicksave() {
        let currentUrl = await this.getCurrentTabUrl()
        let data = await this.youtube.tryAddToPlaylist(currentUrl, this.quicksavePlaylistId)
        await this.serializeYoutube()
        await this.logQuicksave(data)

        return 'success'
    }

    async deduplicate() {
        await this.youtube.deduplicatePlaylist(this.quicksavePlaylistId)
        await this.serializeYoutube()

        return 'success'
    }

    async getPlaylists() {
        let playlists = await this.youtube.getPlaylists()
        await this.serializeYoutube()

        return playlists.map((p) => {
            return {
                id: p.id,
                title: p.title,
                quicksave: p.id == this.quicksavePlaylistId
            }
        })
    }

    async getQuicksaveLog() {
        return this.log
    }

    async updatePopup() {
        let popup

        if (this.youtube.isSignedIn()) {
            popup = '/views/popup.html'
        } else {
            popup = '/views/popup-signed-out.html'
        }

        await chrome.action.setPopup({ popup: popup })
    }

    async selectPlaylist(playlistId) {
        this.quicksavePlaylistId = playlistId
        await this.serializeQuicksavePlaylistId()
        console.log(`playlist selected: ${playlistId}`)
    }

    async setupQuicksavePlaylistIdUsingRecent() {
        this.quicksavePlaylistId = this.youtube.playlists[0].id
        await this.serializeQuicksavePlaylistId()
    }

    isSignedIn() {
        return this.youtube.isSignedIn()
    }

    // Private methods

    async serializeYoutube() {
        await this.storage.setYoutube(this.youtube)
    }

    async serializeQuicksavePlaylistId() {
        await this.storage.setQuicksavePlaylistId(this.quicksavePlaylistId)
    }

    async serializeLog() {
        await this.storage.setLog(this.log)
    }

    async logQuicksave(data) {
        let date = this.formatDate(new Date())
        let videoId = data.videoId
        let videoTitle = data.videoTitle
        let playlistTitle = data.playlistTitle
        
        let logItem = `[${date}] [${videoId}: ${videoTitle}] was quicksaved to [${playlistTitle}]\n`

        this.log += logItem
        await this.serializeLog()

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

        return `${year}/${month}${day} ${hours}:${minutes}:${seconds}`
    }

    async getCurrentTabUrl() {
        let queryOptions = { active: true, lastFocusedWindow: true }
        let [tab] = await chrome.tabs.query(queryOptions)
        return tab.url
    }
}

export default QuicksaveManager
