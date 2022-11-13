import config from '../config/config.js'
import Youtube from './youtube.js'

let youtube = new Youtube(config)

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.message === 'signIn') {
        youtube.openSignInForm(sendResponse)
    } else if (request.message === 'signOut') {
        youtube.signOut(sendResponse)
    } else if (request.message === 'isUserSignedIn') {
        sendResponse(youtube.signedIn)
    }
})
