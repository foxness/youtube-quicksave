import config from '../config/config.js'
import QuicksaveManager from './quicksaveManager.js'

async function main() {
    setupListeners()

    let manager = await getQuicksaveManager()
    manager.updatePopup()
}

function setupListeners() {
    chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
        handleMessage(request).then(sendResponse)
        return true // return true to indicate we want to send a response asynchronously
    })

    chrome.commands.onCommand.addListener(handleCommand)
}

async function handleMessage(request) {
    let manager = await getQuicksaveManager()
    let message = request.message

    switch (message) {
        case 'signIn':
            return await manager.signIn()
        case 'signOut':
            return await manager.signOut()
        case 'quicksave':
            return await manager.quicksave()
        case 'dewIt':
            return await manager.deduplicate()
        case 'getPlaylists':
            return await manager.getPlaylists()
        case 'getQuicksaveLog':
            return await manager.getQuicksaveLog()
        case 'isSignedIn':
            return manager.isSignedIn()
    }

    if (message.kind == 'playlistSelected') {
        let id = message.playlistId
        return await manager.selectPlaylist(id)
    }

    return 'fail'
}

async function handleCommand(command) {
    if (command != 'quicksave-command') {
        return
    }

    let manager = await getQuicksaveManager()
    await manager.quicksave()
}

async function getQuicksaveManager() {
    return await QuicksaveManager.init(config)
}

main()