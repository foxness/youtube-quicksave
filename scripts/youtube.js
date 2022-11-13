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

    async openSignInForm(sendResponse) {
        if (this.signedIn) {
            console.log("User is already signed in.")
            return 'fail'
        }

        let redirectUrl = await chrome.identity.launchWebAuthFlow({
            'url': this.createAuthEndpoint(),
            'interactive': true
        })

        if (chrome.runtime.lastError) {
            return 'fail'
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

        await chrome.action.setPopup({ popup: '/views/popup-signed-in.html' })
        return 'success'
    }

    async signOut() {
        this.signedIn = false
        await chrome.action.setPopup({ popup: '/views/popup.html' })

        return 'success'
    }

    async dewIt() {
        postData('https://example.com/answer', { answer: 42 })
            .then((data) => {
                console.log(data); // JSON data parsed by `data.json()` call
            })
    }

    // Example POST method implementation:
    async postData(url = '', data = {}) {
        // Default options are marked with *
        const response = await fetch(url, {
            method: 'POST', // *GET, POST, PUT, DELETE, etc.
            mode: 'cors', // no-cors, *cors, same-origin
            cache: 'no-cache', // *default, no-cache, reload, force-cache, only-if-cached
            credentials: 'same-origin', // include, *same-origin, omit
            headers: {
                'Content-Type': 'application/json'
                // 'Content-Type': 'application/x-www-form-urlencoded',
            },
            redirect: 'follow', // manual, *follow, error
            referrerPolicy: 'no-referrer', // no-referrer, *no-referrer-when-downgrade, origin, origin-when-cross-origin, same-origin, strict-origin, strict-origin-when-cross-origin, unsafe-url
            body: JSON.stringify(data) // body data type must match "Content-Type" header
        });
        return response.json(); // parses JSON response into native JavaScript objects
    }
}

export default Youtube