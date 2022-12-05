import config from '../config/config.js'
import QuicksaveManager from './quicksaveManager.js'

let CONTEXT_MENU_ID = 'quicksave'

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
        case 'dewIt':
            return await manager.deduplicate()
        case 'getPlaylists':
            return await manager.getPlaylists()
        case 'getQuicksaveLog':
            return await manager.getQuicksaveLog()
        case 'isSignedIn':
            return manager.isSignedIn()
    }

    if (message.kind == 'playlistSelect') {
        let id = message.playlistId
        return await manager.selectPlaylist(id)
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
        title: 'Quicksave current video',
        contexts: ['page'],
        documentUrlPatterns: ['https://www.youtube.com/watch*'],
        id: CONTEXT_MENU_ID
    })
}

async function handleContextMenu(info, tab) {
    if (info.menuItemId != CONTEXT_MENU_ID) {
        return
    }

    let manager = await getQuicksaveManager()
    await manager.quicksaveUrl(info.pageUrl, tab)
}

async function getQuicksaveManager() {
    return await QuicksaveManager.init(config)
}

main()