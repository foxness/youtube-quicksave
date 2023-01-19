import config from '../config/config.js'
import QuicksaveManager from './quicksaveManager.js'

let CONTEXT_MENU_CURRENT = 'quicksaveCurrent'
let CONTEXT_MENU_LINK = 'quicksaveLink'

async function main() {
    setupListeners()

    let manager = await getQuicksaveManager()
    manager.updatePopup()
}

function setupListeners() {
    chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
        handleMessage(message).then(sendResponse)
        return true // return true to indicate we want to send a response asynchronously
    })

    chrome.commands.onCommand.addListener(handleCommand)
    chrome.runtime.onInstalled.addListener(handleInstall)
    chrome.contextMenus.onClicked.addListener(handleContextMenu)
}

function handleInstall() {
    createContextMenu()
}

async function handleMessage(message) {
    let manager = await getQuicksaveManager()

    switch (message.kind) { // no return value, intentionally no await
        case 'signIn':
            manager.signIn()
            return
        case 'signOut':
            manager.signOut()
            return
        case 'quicksave':
            manager.quicksaveCurrent()
            return
        case 'developerAction':
            manager.developerAction()
            return
        case 'copyPlaylist':
            manager.copyPlaylist()
            return
        case 'pastePlaylist':
            manager.pastePlaylist()
            return
        case 'refreshPlaylists':
            manager.refreshPlaylists()
            return
        case 'deduplicatePlaylist':
            manager.deduplicatePlaylist()
            return
        case 'playlistSelect':
            let id = message.playlistId
            manager.selectPlaylist(id)
            return
        case 'setShouldShowLog':
            let shouldShowLog = message.shouldShowLog
            manager.setShouldShowLog(shouldShowLog)
            return
    }

    switch (message.kind) { // has a return value
        case 'getPlaylists':
            return await manager.getPlaylists()
        case 'getLogAndQuicksaveCount':
            return manager.getLogAndQuicksaveCount()
        case 'getShouldShowLog':
            return await manager.getShouldShowLog()
        case 'getQuicksaveDisabled':
            return await manager.getQuicksaveDisabled()
        case 'getCopyPasteAvailable':
            return await manager.getCopyPasteAvailable()
    }
}

async function handleCommand(command) {
    let manager = await getQuicksaveManager()

    switch (command) {
        case 'command-quicksave-current':
            manager.quicksaveCurrent() // intentionally no await
            break
        case 'command-quicksave-hover':
            manager.quicksaveHover() // intentionally no await
            break
    }
}

function createContextMenu() {
    chrome.contextMenus.create({
        id: CONTEXT_MENU_CURRENT,
        title: 'Quicksave Current',
        contexts: ['page'],
        documentUrlPatterns: ['https://www.youtube.com/watch*']
    })

    chrome.contextMenus.create({
        id: CONTEXT_MENU_LINK,
        title: 'Quicksave Link',
        contexts: ['link'],
        documentUrlPatterns: ['https://www.youtube.com/*']
    })
}

async function handleContextMenu(info, tab) {
    let url
    switch (info.menuItemId) {
        case CONTEXT_MENU_CURRENT:
            url = info.pageUrl
            break
        case CONTEXT_MENU_LINK:
            url = info.linkUrl
            break
        default:
            return
    }

    let manager = await getQuicksaveManager()
    await manager.quicksaveUrl(url, tab)
}

async function getQuicksaveManager() {
    return await QuicksaveManager.init(config)
}

main()