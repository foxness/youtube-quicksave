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

    async quicksaveCurrent() {
        let currentTab = await this.getCurrentTab()
        let url = currentTab.url
        
        await this.tryQuicksave(currentTab, url)
    }

    async quicksaveHover() {
        let currentTab = await this.getCurrentTab()
        let hoverUrl = await this.sendGetHoverUrl(currentTab)

        await this.tryQuicksave(currentTab, hoverUrl)
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

    async tryQuicksave(tab, url) {
        if (!url) {
            return
        }

        let videoId = await this.youtube.tryGetVideoId(url)
        if (!videoId) {
            return
        }

        await this.quicksave(tab, videoId)
    }

    async quicksave(tab, videoId) {
        let quicksaveId = this.getRandomId()
        this.sendQuicksaveStart(tab, quicksaveId)

        // let sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms))
        // await sleep(2000)
        
        let quicksaveData = await this.youtube.addToPlaylist(videoId, this.quicksavePlaylistId)
        await this.serializeYoutube()
        await this.logQuicksave(quicksaveData)

        this.sendQuicksaveDone(tab, quicksaveId, quicksaveData)
    }

    sendQuicksaveStart(tab, quicksaveId) {
        let message = { kind: 'quicksaveStart', quicksaveId: quicksaveId }
        chrome.tabs.sendMessage(tab.id, message) // intentionally no await
    }

    sendQuicksaveDone(tab, quicksaveId, quicksaveData) {
        let message = { kind: 'quicksaveDone', quicksaveId: quicksaveId, ...quicksaveData }
        chrome.tabs.sendMessage(tab.id, message) // intentionally no await
    }

    async sendGetHoverUrl(tab) {
        let message = { kind: 'getHoverUrl' }
        let hoverUrl = await chrome.tabs.sendMessage(tab.id, message)

        return hoverUrl
    }

    async setupQuicksavePlaylistIdUsingRecent() {
        this.quicksavePlaylistId = this.youtube.playlists[0].id
        await this.serializeQuicksavePlaylistId()
    }

    async logQuicksave(data) {
        this.logger.logQuicksave(data)
        await this.serializeLogger()
    }

    async getCurrentTab() {
        let queryOptions = { active: true, lastFocusedWindow: true }
        let tab = (await chrome.tabs.query(queryOptions))[0]

        return tab
    }

    getRandomId() {
        return Math.random().toString(36).substring(2, 15)
    }
}

export default QuicksaveManager