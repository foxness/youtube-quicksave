import config from '../config/config.js'

const CLIENT_ID = config.web.client_id
const REDIRECT_URI = config.web.redirect_uris[0]
const RESPONSE_TYPE = 'id_token'
const SCOPE = 'openid'
const STATE = 'meet' + Math.random().toString(36).substring(2, 15)
const PROMPT = 'consent'

let userSignedIn = false

function createAuthEndpoint() {
    let nonce = Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15)

    let openIdEndpointUrl =
        `https://accounts.google.com/o/oauth2/v2/auth
?client_id=${encodeURIComponent(CLIENT_ID)}
&response_type=${encodeURIComponent(RESPONSE_TYPE)}
&redirect_uri=${encodeURIComponent(REDIRECT_URI)}
&scope=${encodeURIComponent(SCOPE)}
&state=${encodeURIComponent(STATE)}
&nonce=${encodeURIComponent(nonce)}
&prompt=${encodeURIComponent(PROMPT)}`

    console.log(openIdEndpointUrl)
    return openIdEndpointUrl
}

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.message === 'login') {
        if (userSignedIn) {
            console.log("User is already signed in.")
            return
        }

        chrome.identity.launchWebAuthFlow({
            'url': createAuthEndpoint(),
            'interactive': true
        }, (redirectUrl) => {
            if (chrome.runtime.lastError) {
                // problem signing in
                return
            }

            console.log("redirect url: " + redirectUrl)
            let idToken = redirectUrl.substring(redirectUrl.indexOf('id_token=') + 9)
            idToken = idToken.substring(0, idToken.indexOf('&'))

            if (false) {
                // const user_info = KJUR.jws.JWS.readSafeJSONString(b64utoutf8(idToken.split(".")[1]))
                // if !((user_info.iss === 'https://accounts.google.com' || user_info.iss === 'accounts.google.com')
                //     && user_info.aud === CLIENT_ID) {
                // invalid credentials
                console.log("Invalid credentials.")
            }

            console.log("User successfully signed in.")
            userSignedIn = true
            chrome.action.setPopup({ popup: '/views/popup-signed-in.html' }, () => {
                sendResponse('success')
            })
        })

        return true
    } else if (request.message === 'logout') {
        userSignedIn = false
        chrome.action.setPopup({ popup: '/views/popup.html' }, () => {
            sendResponse('success')
        })

        return true
    } else if (request.message === 'isUserSignedIn') {
        sendResponse(userSignedIn)
    }
})
