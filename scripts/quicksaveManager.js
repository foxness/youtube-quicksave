import Storage from './storage.js'

class QuicksaveManager {

    // Initialization

    constructor(storage, youtube, quicksavePlaylistId, logger) {
        this.storage = storage
        this.youtube = youtube
        this.quicksavePlaylistId = quicksavePlaylistId
        this.logger = logger
    }

    static async init(config) {
        let storage = new Storage(config)
        let youtube = await storage.getYoutube()
        let quicksavePlaylistId = await storage.getQuicksavePlaylistId()
        let logger = await storage.getLogger()

        if (quicksavePlaylistId == null && youtube.playlists != null && youtube.playlists.length > 0) {
            quicksavePlaylistId = youtube.playlists[0].id
        }

        return new QuicksaveManager(storage, youtube, quicksavePlaylistId, logger)
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
    }

    async deduplicate() {
        await this.youtube.deduplicatePlaylist(this.quicksavePlaylistId)
        await this.serializeYoutube()
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
        return this.logger.getLog()
    }

    async selectPlaylist(playlistId) {
        this.quicksavePlaylistId = playlistId
        await this.serializeQuicksavePlaylistId()
        console.log(`playlist selected: ${playlistId}`)
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

    isSignedIn() {
        return this.youtube.isSignedIn()
    }

    // Private methods

    // Storage

    async serializeYoutube() {
        await this.storage.setYoutube(this.youtube)
    }

    async serializeQuicksavePlaylistId() {
        await this.storage.setQuicksavePlaylistId(this.quicksavePlaylistId)
    }

    async serializeLogger() {
        await this.storage.setLogger(this.logger)
    }

    // Misc

    async setupQuicksavePlaylistIdUsingRecent() {
        this.quicksavePlaylistId = this.youtube.playlists[0].id
        await this.serializeQuicksavePlaylistId()
    }

    async logQuicksave(data) {
        this.logger.logQuicksave(data)
        await this.serializeLogger()
    }

    async getCurrentTabUrl() {
        let queryOptions = { active: true, lastFocusedWindow: true }
        let [tab] = await chrome.tabs.query(queryOptions)
        return tab.url
    }
}

export default QuicksaveManager
