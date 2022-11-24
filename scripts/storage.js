import Youtube from './youtube.js'
import Logger from './logger.js'

class Storage {

    // Constants

    static KEY_YOUTUBE = 'youtube'
    static KEY_QUICKSAVE_PLAYLIST_ID = 'quicksavePlaylistId0'
    static KEY_LOG = 'log'

    // Initialization

    constructor(config) {
        this.config = config
    }

    // Getters

    async getYoutube() {
        let serialized = await this.getValue(Storage.KEY_YOUTUBE)

        if (serialized) {
            return Youtube.fromSerialized(this.config, serialized)
        } else {
            return new Youtube(this.config)
        }
    }

    async getQuicksavePlaylistId() {
        return await this.getValue(Storage.KEY_QUICKSAVE_PLAYLIST_ID)
    }

    async getLogger() {
        let serialized = await this.getValue(Storage.KEY_LOG)
        let log = serialized != null ? serialized : ''

        return new Logger(log)
    }

    // Setters

    async setYoutube(youtube) {
        let serialized = youtube.getSerialized()
        await this.setValue(Storage.KEY_YOUTUBE, serialized)
    }

    async setQuicksavePlaylistId(quicksavePlaylistId) {
        await this.setValue(Storage.KEY_QUICKSAVE_PLAYLIST_ID, quicksavePlaylistId)
    }

    async setLogger(logger) {
        let log = logger.getLog()
        await this.setValue(Storage.KEY_LOG, log)
    }

    // Private methods

    async getValue(key) {
        return (await chrome.storage.sync.get([key]))[key]
    }

    async setValue(key, value) {
        await chrome.storage.sync.set({ [key]: value })
    }
}

export default Storage
