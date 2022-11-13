class Youtube {
    constructor(config) {
        this.CLIENT_ID = config.web.client_id
        this.REDIRECT_URI = config.web.redirect_uris[0]

        this.signedIn = false
    }

    createAuthEndpoint() {
        this.RESPONSE_TYPE = 'token'
        this.SCOPE = 'https://www.googleapis.com/auth/youtube'
        this.STATE = 'meet' + Math.random().toString(36).substring(2, 15)
        this.PROMPT = 'consent'

        let openIdEndpointUrl =
            `https://accounts.google.com/o/oauth2/v2/auth
?client_id=${encodeURIComponent(this.CLIENT_ID)}
&response_type=${encodeURIComponent(this.RESPONSE_TYPE)}
&redirect_uri=${encodeURIComponent(this.REDIRECT_URI)}
&scope=${encodeURIComponent(this.SCOPE)}
&state=${encodeURIComponent(this.STATE)}
&prompt=${encodeURIComponent(this.PROMPT)}`

        console.log(openIdEndpointUrl)
        return openIdEndpointUrl
    }

    openSignInForm(sendResponse) {
        if (this.signedIn) {
            console.log("User is already signed in.")
            sendResponse('fail')
            return
        }

        chrome.identity.launchWebAuthFlow({
            'url': this.createAuthEndpoint(),
            'interactive': true
        }, (redirectUrl) => {
            if (chrome.runtime.lastError) {
                sendResponse('fail')
                return
            }

            console.log("redirect url: " + redirectUrl)
            let idToken = redirectUrl.substring(redirectUrl.indexOf('id_token=') + 9)
            idToken = idToken.substring(0, idToken.indexOf('&'))

            // if (false) {
            //     // const user_info = KJUR.jws.JWS.readSafeJSONString(b64utoutf8(idToken.split(".")[1]))
            //     // if !((user_info.iss === 'https://accounts.google.com' || user_info.iss === 'accounts.google.com')
            //     //     && user_info.aud === CLIENT_ID) {
            //     // invalid credentials
            //     console.log("Invalid credentials.")
            // }

            console.log("User successfully signed in.")
            this.signedIn = true

            chrome.action.setPopup({ popup: '/views/popup-signed-in.html' }, () => {
                sendResponse('success')
            })
        })
    }

    signOut(sendResponse) {
        this.signedIn = false

        chrome.action.setPopup({ popup: '/views/popup.html' }, () => {
            sendResponse('success')
        })
    }
}

export default Youtube