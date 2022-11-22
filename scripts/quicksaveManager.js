import Youtube from './youtube.js'

class QuicksaveManager {

    // Constants

    static KEY_YOUTUBE = 'youtube'
    static KEY_QUICKSAVE_PLAYLIST_ID = 'quicksavePlaylistId0'
    static KEY_LOG = 'log'

    // Initialization

    constructor(youtube, quicksavePlaylistId, log) {
        this.youtube = youtube
        this.quicksavePlaylistId = quicksavePlaylistId
        this.log = log
    }

    static async init(config) {
        let youtube = await QuicksaveManager.getYoutube(config)
        let quicksavePlaylistId = await QuicksaveManager.getQuicksavePlaylistId(youtube)
        let log = await QuicksaveManager.getLog()

        return new QuicksaveManager(youtube, quicksavePlaylistId, log)
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

    async updatePopup() {
        let popup

        if (this.youtube.isSignedIn()) {
            popup = '/views/popup-signed-in.html'
        } else {
            popup = '/views/popup.html'
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

    static async getYoutube(config) {
        let serialized = (await chrome.storage.sync.get([QuicksaveManager.KEY_YOUTUBE]))[QuicksaveManager.KEY_YOUTUBE]

        if (serialized) {
            return Youtube.fromSerialized(config, serialized)
        } else {
            return new Youtube(config)
        }
    }

    static async getQuicksavePlaylistId(youtube) {
        let serialized = (await chrome.storage.sync.get([QuicksaveManager.KEY_QUICKSAVE_PLAYLIST_ID]))[QuicksaveManager.KEY_QUICKSAVE_PLAYLIST_ID]

        if (serialized) {
            return serialized
        } else if (youtube.playlists != null && youtube.playlists.length != 0) {
            return youtube.playlists[0].id
        } else {
            return null
        }
    }

    static async getLog() {
        let serialized = (await chrome.storage.sync.get([QuicksaveManager.KEY_LOG]))[QuicksaveManager.KEY_LOG]
        return serialized != null ? serialized : ''
    }

    async serializeYoutube() {
        let serialized = this.youtube.getSerialized()
        await chrome.storage.sync.set({ [QuicksaveManager.KEY_YOUTUBE]: serialized })
    }

    async serializeQuicksavePlaylistId() {
        await chrome.storage.sync.set({ [QuicksaveManager.KEY_QUICKSAVE_PLAYLIST_ID]: this.quicksavePlaylistId })
    }

    async serializeLog() {
        await chrome.storage.sync.set({ [QuicksaveManager.KEY_LOG]: this.log })
    }

    async logQuicksave(data) {
        let date = this.formatDate(new Date())
        let videoId = data.videoId
        let videoTitle = data.videoTitle
        let playlistTitle = data.playlistTitle

        this.log += `[${date}] [${videoId}: ${videoTitle}] was quicksaved to [${playlistTitle}]\n`
        await this.serializeLog()

        console.log(this.log)
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

    async getCurrentTabUrl() {
        let queryOptions = { active: true, lastFocusedWindow: true }
        let [tab] = await chrome.tabs.query(queryOptions)
        return tab.url
    }
}

export default QuicksaveManager
