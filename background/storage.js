import Youtube from './youtube.js'
import Logger from './logger.js'

class Storage {

    // Constants

    static KEY_YOUTUBE = 'youtube'
    static KEY_QUICKSAVE_PLAYLIST_ID = 'quicksavePlaylistId0'
    static KEY_LOGGER = 'log'
    static KEY_SHOULD_SHOW_LOG = 'shouldShowLog'
    static KEY_CLIPBOARD = 'clipboard'

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
        let serialized = await this.getValue(Storage.KEY_LOGGER, true)
        return serialized != null ? Logger.fromSerialized(serialized) : new Logger()
    }

    async getShouldShowLog() {
        let shouldShowLog = await this.getValue(Storage.KEY_SHOULD_SHOW_LOG)
        return shouldShowLog ?? false
    }

    async getClipboard() {
        return await this.getValue(Storage.KEY_CLIPBOARD, true)
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
        let serialized = logger.getSerialized()
        await this.setValue(Storage.KEY_LOGGER, serialized, true)
    }

    async setShouldShowLog(shouldShowLog) {
        await this.setValue(Storage.KEY_SHOULD_SHOW_LOG, shouldShowLog)
    }

    async setClipboard(clipboard) {
        await this.setValue(Storage.KEY_CLIPBOARD, clipboard, true)
    }

    // Private methods

    async getValue(key, useLocal = false) {
        let storage = useLocal ? chrome.storage.local : chrome.storage.sync
        return (await storage.get([key]))[key]
    }

    async setValue(key, value, useLocal = false) {
        let storage = useLocal ? chrome.storage.local : chrome.storage.sync
        await storage.set({ [key]: value })
    }
}

export default Storage
