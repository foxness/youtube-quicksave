class Youtube {
    constructor(config) {
        this.CLIENT_ID = config.web.client_id
        this.REDIRECT_URI = config.web.redirect_uris[0]

        this.signedIn = false
        this.accessToken = null
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
        // https://asdasd.chromiumapp.org/#state=meetasdasd&access_token=asdasd&token_type=Bearer&expires_in=3599&scope=asdasd

        let query = new URL(redirectUrl.replace('#', '?')).searchParams

        let state = query.get('state')
        let accessToken = query.get('access_token')
        let tokenType = query.get('token_type')
        let expiresIn = query.get('expires_in')
        let scope = query.get('scope')

        if (state != this.STATE
            || accessToken == null
            || tokenType != 'Bearer'
            || expiresIn == null
            || scope != this.SCOPE) {

            return 'fail'
        }

        this.accessToken = accessToken
        this.signedIn = true

        console.log("User successfully signed in.")

        await chrome.action.setPopup({ popup: '/views/popup-signed-in.html' })
        return 'success'
    }

    async signOut() {
        this.signedIn = false
        this.accessToken = null

        await chrome.action.setPopup({ popup: '/views/popup.html' })
        return 'success'
    }

    async dewIt() {
        this.fetchPlaylists()
            .then((data) => {
                console.log(data) // JSON data parsed by `data.json()` call
            })
    }

    async fetchPlaylists() {
        let endpoint = 'https://www.googleapis.com/youtube/v3/playlists'

        let data = {
            part: 'snippet',
            mine: true
        }

        let url = new URL(endpoint)
        url.search = new URLSearchParams(data)

        let params = {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${this.accessToken}`
            }
        }

        let response = await fetch(url.toString(), params)
        let json = await response.json()
        let result = json.items.map((a) => {
            return {
                id: a.id,
                title: a.snippet.title
            }
        })

        return result
    }

    // // Example POST method implementation:
    // async postData(url = '', data = {}) {
    //     // Default options are marked with *
    //     const response = await fetch(url, {
    //         method: 'POST', // *GET, POST, PUT, DELETE, etc.
    //         mode: 'cors', // no-cors, *cors, same-origin
    //         cache: 'no-cache', // *default, no-cache, reload, force-cache, only-if-cached
    //         credentials: 'same-origin', // include, *same-origin, omit
    //         headers: {
    //             'Content-Type': 'application/json'
    //             // 'Content-Type': 'application/x-www-form-urlencoded',
    //         },
    //         redirect: 'follow', // manual, *follow, error
    //         referrerPolicy: 'no-referrer', // no-referrer, *no-referrer-when-downgrade, origin, origin-when-cross-origin, same-origin, strict-origin, strict-origin-when-cross-origin, unsafe-url
    //         body: JSON.stringify(data) // body data type must match "Content-Type" header
    //     });
    //     return response.json(); // parses JSON response into native JavaScript objects
    // }
}

export default Youtube
