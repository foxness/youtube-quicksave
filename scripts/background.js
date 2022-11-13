import config from '../config/config.js'
import Youtube from './youtube.js'

let youtube = new Youtube(config)

async function handleMessage(request) {
    switch (request.message) {
        case 'signIn':
            return await youtube.signInAndFetchPlaylists()
        case 'signOut':
            return await youtube.signOut()
        case 'dewIt':
            let currentUrl = await getCurrentTabUrl()
            return await youtube.dewIt(currentUrl)
        case 'getPlaylists':
            return await youtube.getPlaylists()
        case 'isSignedIn':
            return youtube.isSignedIn()
    }
}

async function handleCommand(command) {
    if (command != 'quicksave') {
        return
    }

    await quicksave()
}

async function quicksave() {
    let currentUrl = await getCurrentTabUrl()
    await youtube.tryAddToPlaylist(currentUrl)
}

async function getCurrentTabUrl() {
    let queryOptions = { active: true, lastFocusedWindow: true }
    let [tab] = await chrome.tabs.query(queryOptions)
    return tab.url
}

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    handleMessage(request).then(sendResponse)
    return true // return true to indicate we want to send a response asynchronously
})

chrome.commands.onCommand.addListener(handleCommand)
