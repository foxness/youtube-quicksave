import config from '../config/config.js'
import Youtube from './youtube.js'

let youtube = new Youtube(config)

async function handle(request) {
    switch (request.message) {
        case 'signIn':
            return await youtube.signInAndFetchPlaylists()
        case 'signOut':
            return await youtube.signOut()
        case 'dewIt':
            return await youtube.dewIt()
        case 'getPlaylists':
            return await youtube.getPlaylists()
        case 'isSignedIn':
            return youtube.isSignedIn()
    }
}

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    handle(request).then(sendResponse)
    return true // return true to indicate you want to send a response asynchronously
})