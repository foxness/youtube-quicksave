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

    async developerAction() {
        // \\
    }

    async copyPlaylist() {
        let currentTab = await this.getCurrentTab()
        let url = currentTab.url
        let playlistId = this.youtube.tryGetPlaylistId(url)

        if (!playlistId) {
            return
        }

        let clipboard = null
        if (this.youtube.isWatchLaterPlaylistId(playlistId)) {
            let videoIds = await this.sendGetWatchLaterVideos(currentTab)

            clipboard = {
                kind: 'videoIds',
                videoIds: videoIds
            }
        } else {
            clipboard = {
                kind: 'playlistId',
                playlistId: playlistId
            }

            this.sendCopiedVideos(currentTab)
        }

        await this.storage.setClipboard(clipboard)
    }

    async pastePlaylist() {
        let currentTab = await this.getCurrentTab()
        let url = currentTab.url
        let destinationId = this.youtube.tryGetPlaylistId(url)

        if (!destinationId || this.youtube.isWatchLaterPlaylistId(destinationId)) {
            return // todo: send toast
        }

        let clipboard = await this.storage.getClipboard()
        switch (clipboard.kind) {
            case 'videoIds':
                let videoIds = clipboard.videoIds
                await this.youtube.bulkAddToPlaylist(videoIds, destinationId)
                break
            case 'playlistId':
                let sourceId = clipboard.playlistId
                await this.youtube.copyPlaylist(sourceId, destinationId)
                break
        }

        await this.serializeYoutube()
        console.log('paste done')
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
        let currentTab = await this.getCurrentTab()
        let url = currentTab.url
        let playlistId = this.youtube.tryGetPlaylistId(url)
        if (!playlistId) {
            return
        }

        let deduplicationData = await this.youtube.deduplicatePlaylist(playlistId)

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

    async getQuicksaveDisabled() {
        let currentTab = await this.getCurrentTab()
        let url = currentTab.url
        let quicksaveDisabled = this.youtube.tryGetVideoId(url) == null

        return quicksaveDisabled
    }

    async getActionAvailability() {
        let currentTab = await this.getCurrentTab()
        let url = currentTab.url
        let playlistId = this.youtube.tryGetPlaylistId(url)

        let isPlaylistPage = playlistId != null
        let isWatchLaterPage = this.youtube.isWatchLaterPlaylistId(playlistId)
        let clipboardNotEmpty = (await this.storage.getClipboard()) != null
        let ownedByUser = this.youtube.getPlaylists().map(p => p.id).includes(playlistId)

        return {
            copyAvailable: isPlaylistPage,
            pasteAvailable: isPlaylistPage && !isWatchLaterPage && clipboardNotEmpty && ownedByUser,
            deduplicateAvailable: isPlaylistPage && !isWatchLaterPage && ownedByUser
        }
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

    sendCopiedVideos(tab) {
        let message = { kind: 'copiedVideos' }
        chrome.tabs.sendMessage(tab.id, message) // intentionally no await
    }

    async sendGetHoverUrl(tab) {
        let message = { kind: 'getHoverUrl' }
        let hoverUrl = await chrome.tabs.sendMessage(tab.id, message)

        return hoverUrl
    }

    async sendGetWatchLaterVideos(tab) {
        let message = { kind: 'getWatchLaterVideos' }
        let videos = await chrome.tabs.sendMessage(tab.id, message)

        return videos
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
