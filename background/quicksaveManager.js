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
        await this.youtube.signInAndFetchPlaylists()
        await this.setupQuicksavePlaylistIdUsingRecent()

        await this.serializeYoutube()
        await this.updatePopup()
    }

    async signOut() {
        this.youtube.signOut()

        await this.serializeYoutube()
        await this.updatePopup()
    }

    async quicksaveCurrent() {
        let currentTab = await this.getCurrentTab()

        if (!this.isSignedIn()) {
            this.sendNotSignedIn(currentTab)
            return
        }

        let url = currentTab.url
        await this.tryQuicksave(url, currentTab)
    }

    async quicksaveHover() {
        let currentTab = await this.getCurrentTab()

        if (!this.isSignedIn()) {
            this.sendNotSignedIn(currentTab)
            return
        }

        let hoverUrl = await this.sendGetHoverUrl(currentTab)
        await this.tryQuicksave(hoverUrl, currentTab)
    }

    async quicksaveUrl(url, tab) {
        if (!this.isSignedIn()) {
            this.sendNotSignedIn(tab)
            return
        }

        await this.tryQuicksave(url, tab)
    }

    async refreshPlaylists() {
        await this.youtube.fetchPlaylists()
        await this.serializeYoutube()

        let playlists = this.youtube.getPlaylists()
        let quicksavePlaylistIsIntact = playlists.find(a => a.id == this.quicksavePlaylistId) != null
        if (!quicksavePlaylistIsIntact) {
            await this.setupQuicksavePlaylistIdUsingRecent()
        }

        this.sendNewPlaylistsAvailable()
    }

    async deduplicatePlaylist() {
        let deduplicationData = await this.youtube.deduplicatePlaylist(this.quicksavePlaylistId)

        await this.logDeduplication(deduplicationData)
        await this.serializeYoutube()
    }

    getPlaylists() {
        let playlists = this.youtube.getPlaylists()

        return playlists.map((p) => {
            return {
                id: p.id,
                title: p.title,
                quicksave: p.id == this.quicksavePlaylistId
            }
        })
    }

    getLogAndQuicksaveCount() {
        return {
            log: this.logger.getLog(),
            quicksaveCount: this.logger.getQuicksaveCount()
        }
    }

    async getShouldShowLog() {
        return await this.storage.getShouldShowLog()
    }

    async selectPlaylist(playlistId) {
        this.quicksavePlaylistId = playlistId
        await this.serializeQuicksavePlaylistId()
    }

    async setShouldShowLog(shouldShowLog) {
        await this.storage.setShouldShowLog(shouldShowLog)
    }

    async updatePopup() {
        let popup

        if (this.isSignedIn()) {
            popup = '/popup/popup.html'
        } else {
            popup = '/popup/popup-signed-out.html'
        }

        await chrome.action.setPopup({ popup: popup })
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

    // Messaging

    sendQuicksaveStart(tab, quicksaveId) {
        let message = { kind: 'quicksaveStart', quicksaveId: quicksaveId }
        chrome.tabs.sendMessage(tab.id, message) // intentionally no await
    }

    sendQuicksaveDone(tab, quicksaveId, quicksaveData) {
        let message = { kind: 'quicksaveDone', quicksaveId: quicksaveId, ...quicksaveData }
        chrome.tabs.sendMessage(tab.id, message) // intentionally no await
    }

    sendNotSignedIn(tab) {
        let message = { kind: 'notSignedIn' }
        chrome.tabs.sendMessage(tab.id, message) // intentionally no await
    }

    async sendGetHoverUrl(tab) {
        let message = { kind: 'getHoverUrl' }
        let hoverUrl = await chrome.tabs.sendMessage(tab.id, message)

        return hoverUrl
    }

    sendNewLogAvailable() {
        chrome.runtime.sendMessage({ kind: 'newLogAvailable' }) // intentionally no await
    }

    sendNewPlaylistsAvailable() {
        chrome.runtime.sendMessage({ kind: 'newPlaylistsAvailable' }) // intentionally no await
    }

    // Misc

    async tryQuicksave(url, tab) {
        if (!url) {
            return
        }

        let videoId = this.youtube.tryGetVideoId(url)
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
        await this.logQuicksave(quicksaveData)
        await this.serializeYoutube()

        this.sendQuicksaveDone(tab, quicksaveId, quicksaveData)
    }

    async setupQuicksavePlaylistIdUsingRecent() {
        let recentPlaylist = this.youtube.getPlaylists()[0]
        this.quicksavePlaylistId = recentPlaylist.id
        await this.serializeQuicksavePlaylistId()
    }

    async logQuicksave(data) {
        this.logger.logQuicksave(data)
        await this.serializeLogger()
        this.sendNewLogAvailable()
    }

    async logDeduplication(data) {
        this.logger.logDeduplication(data)
        await this.serializeLogger()
        this.sendNewLogAvailable()
    }

    isSignedIn() {
        return this.youtube.isSignedIn()
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
