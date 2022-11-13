import config from '../config/config.js'
import Youtube from './youtube.js'

const YOUTUBE_KEY = 'youtube'

let youtube

async function main() {
    await setupYoutube()
    setupListeners()
}

async function setupYoutube() {
    let serialized = (await chrome.storage.sync.get([YOUTUBE_KEY]))[YOUTUBE_KEY]

    if (serialized) {
        youtube = await Youtube.fromSerialized(config, serialized)
    } else {
        youtube = new Youtube(config)
    }
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
            return isSignedIn()
    }
}

async function handleCommand(command) {
    if (command != 'quicksave-command') {
        return
    }

    await quicksave()
}

async function signIn() {
    let result = await youtube.signInAndFetchPlaylists()
    await serializeYoutube()
    return result
}

async function signOut() {
    let result = await youtube.signOut()
    await serializeYoutube()
    return result
}

async function serializeYoutube() {
    let serialized = youtube.getSerialized()
    await chrome.storage.sync.set({ YOUTUBE_KEY: serialized })
}

async function quicksave() {
    let currentUrl = await getCurrentTabUrl()
    await youtube.tryAddToPlaylist(currentUrl)
}

async function getPlaylists() {
    return await youtube.getPlaylists()
}

function isSignedIn() {
    return youtube.isSignedIn()
}

async function getCurrentTabUrl() {
    let queryOptions = { active: true, lastFocusedWindow: true }
    let [tab] = await chrome.tabs.query(queryOptions)
    return tab.url
}

main()