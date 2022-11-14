import config from '../config/config.js'
import Youtube from './youtube.js'

const YOUTUBE_KEY = 'youtube'

function main() {
    setupListeners()
}

async function getYoutube() {
    let serialized = (await chrome.storage.sync.get([YOUTUBE_KEY]))[YOUTUBE_KEY]
    let youtube

    if (serialized) {
        console.log('setup youtube from serialized')
        youtube = await Youtube.fromSerialized(config, serialized)
    } else {
        console.log('setup new youtube')
        youtube = new Youtube(config)
    }

    await updatePopup(youtube)
    return youtube
}

function setupListeners() {
    chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
        handleMessage(request).then(sendResponse)
        return true // return true to indicate we want to send a response asynchronously
    })

    chrome.commands.onCommand.addListener(handleCommand)
}

async function handleMessage(request) {
    switch (request.message) {
        case 'signIn':
            return await signIn()
        case 'signOut':
            return await signOut()
        case 'quicksave':
            return await quicksave()
        case 'dewIt':
            return await quicksave()
        case 'getPlaylists':
            return await getPlaylists()
        case 'isSignedIn':
            return await isSignedIn()
    }
}

async function handleCommand(command) {
    if (command != 'quicksave-command') {
        return
    }

    await quicksave()
}

async function signIn() {
    let youtube = await getYoutube()
    let result = await youtube.signInAndFetchPlaylists()

    await serializeYoutube(youtube)
    await updatePopup(youtube)

    return result
}

async function signOut() {
    let youtube = await getYoutube()
    let result = await youtube.signOut()

    await serializeYoutube(youtube)
    await updatePopup(youtube)
    
    return result
}

async function quicksave() {
    let youtube = await getYoutube()
    let currentUrl = await getCurrentTabUrl()
    await youtube.tryAddToPlaylist(currentUrl)
    await serializeYoutube(youtube)
}

async function getPlaylists() {
    let youtube = await getYoutube()
    let result = await youtube.getPlaylists()
    await serializeYoutube(youtube)
    return result
}

async function serializeYoutube(youtube) {
    let serialized = youtube.getSerialized()
    await chrome.storage.sync.set({ [YOUTUBE_KEY]: serialized })
}

async function isSignedIn() {
    let youtube = await getYoutube()
    return youtube.isSignedIn()
}

async function updatePopup(youtube) {
    let popup

    if (youtube.isSignedIn()) {
        popup = '/views/popup-signed-in.html'
    } else {
        popup = '/views/popup.html'
    }

    await chrome.action.setPopup({ popup: popup })
}

async function getCurrentTabUrl() {
    let queryOptions = { active: true, lastFocusedWindow: true }
    let [tab] = await chrome.tabs.query(queryOptions)
    return tab.url
}

main()