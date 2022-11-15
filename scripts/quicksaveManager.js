import Youtube from './youtube.js'

class QuicksaveManager {

    // Constants

    static YOUTUBE_KEY = 'youtube'

    // Initialization

    constructor(youtube) {
        this.youtube = youtube
    }

    static async init(config) {
        let youtube = await QuicksaveManager.getYoutube(config)
        return new QuicksaveManager(youtube)
    }

    // Public methods

    async signIn() {
        let result = await this.youtube.signInAndFetchPlaylists()
    
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
        await this.youtube.tryAddToPlaylist(currentUrl)
        await this.serializeYoutube()
    }

    async getPlaylists() {
        let result = await this.youtube.getPlaylists()
        await this.serializeYoutube()
        return result
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

    isSignedIn() {
        return this.youtube.isSignedIn()
    }

    // Private methods

    static async getYoutube(config) {
        let serialized = (await chrome.storage.sync.get([QuicksaveManager.YOUTUBE_KEY]))[QuicksaveManager.YOUTUBE_KEY]
        let youtube

        if (serialized) {
            console.log('setup youtube from serialized')
            youtube = Youtube.fromSerialized(config, serialized)
        } else {
            console.log('setup new youtube')
            youtube = new Youtube(config)
        }

        return youtube
    }

    async serializeYoutube() {
        let serialized = this.youtube.getSerialized()
        await chrome.storage.sync.set({ [QuicksaveManager.YOUTUBE_KEY]: serialized })
    }

    async getCurrentTabUrl() {
        let queryOptions = { active: true, lastFocusedWindow: true }
        let [tab] = await chrome.tabs.query(queryOptions)
        return tab.url
    }
}

export default QuicksaveManager
