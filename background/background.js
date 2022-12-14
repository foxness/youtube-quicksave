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

    switch (message.kind) {
        case 'signIn':
            return await manager.signIn()
        case 'signOut':
            return await manager.signOut()
        case 'quicksave':
            return await manager.quicksaveCurrent()
        case 'deduplicatePlaylist':
            return await manager.deduplicatePlaylist()
        case 'getPlaylists':
            return await manager.getPlaylists()
        case 'getQuicksaveLog':
            return await manager.getQuicksaveLog()
        case 'getQuicksaveCount':
            return await manager.getQuicksaveCount()
        case 'getShouldShowLog':
            return await manager.getShouldShowLog()
        case 'isSignedIn': // todo: remove
            return manager.isSignedIn()
    }

    switch (message.kind) {
        case 'playlistSelect':
            let id = message.playlistId
            return await manager.selectPlaylist(id)
        case 'setShouldShowLog':
            let shouldShowLog = message.shouldShowLog
            return await manager.setShouldShowLog(shouldShowLog)
    }

    return 'fail'
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