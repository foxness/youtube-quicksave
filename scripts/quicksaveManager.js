import Youtube from './youtube.js'

class QuicksaveManager {

    // Constants

    static YOUTUBE_KEY = 'youtube'
    static QUICKSAVE_PLAYLIST_ID_KEY = 'quicksavePlaylistId0'

    // Initialization

    constructor(youtube, quicksavePlaylistId) {
        this.youtube = youtube
        this.quicksavePlaylistId = quicksavePlaylistId
    }

    static async init(config) {
        let youtube = await QuicksaveManager.getYoutube(config)
        let quicksavePlaylistId = await QuicksaveManager.getQuicksavePlaylistId(youtube)

        return new QuicksaveManager(youtube, quicksavePlaylistId)
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
        await this.youtube.tryAddToPlaylist(currentUrl, this.quicksavePlaylistId)
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
        return await this.serializeQuicksavePlaylistId()
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
        let serialized = (await chrome.storage.sync.get([QuicksaveManager.YOUTUBE_KEY]))[QuicksaveManager.YOUTUBE_KEY]

        if (serialized) {
            return Youtube.fromSerialized(config, serialized)
        } else {
            return new Youtube(config)
        }
    }

    static async getQuicksavePlaylistId(youtube) {
        let serialized = (await chrome.storage.sync.get([QuicksaveManager.QUICKSAVE_PLAYLIST_ID_KEY]))[QuicksaveManager.QUICKSAVE_PLAYLIST_ID_KEY]

        if (serialized) {
            console.log('restored quicksave playlist')
            return serialized
        } else if (youtube.playlists != null && youtube.playlists.length != 0) {
            console.log('got quicksave playlist from recent')
            return youtube.playlists[0].id
        } else {
            console.log('new quicksave playlist')
            return null
        }
    }

    async serializeYoutube() {
        let serialized = this.youtube.getSerialized()
        await chrome.storage.sync.set({ [QuicksaveManager.YOUTUBE_KEY]: serialized })
    }

    async serializeQuicksavePlaylistId() {
        await chrome.storage.sync.set({ [QuicksaveManager.QUICKSAVE_PLAYLIST_ID_KEY]: this.quicksavePlaylistId })
    }

    async getCurrentTabUrl() {
        let queryOptions = { active: true, lastFocusedWindow: true }
        let [tab] = await chrome.tabs.query(queryOptions)
        return tab.url
    }
}

export default QuicksaveManager
