import config from '../config/config.js'
import Youtube from './youtube.js'

let youtube = new Youtube(config)

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.message === 'login') {
        youtube.openLoginForm(sendResponse)
    } else if (request.message === 'logout') {
        youtube.logout(sendResponse)
    } else if (request.message === 'isUserSignedIn') {
        sendResponse(youtube.signedIn)
    }
})
