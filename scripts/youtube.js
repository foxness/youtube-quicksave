class Youtube {

    // Constructor

    constructor(config) {
        this.CLIENT_ID = config.web.client_id
        this.REDIRECT_URI = config.web.redirect_uris[0]

        this.accessToken = null
        this.playlists = null
    }

    // Public methods

    async signInAndFetchPlaylists() {
        await this.openSignInForm()
        if (!this.isSignedIn()) {
            return 'fail'
        }

        await this.fetchPlaylists()
        return 'success'
    }

    async signOut() {
        this.accessToken = null

        await chrome.action.setPopup({ popup: '/views/popup.html' })
        return 'success'
    }

    async dewIt(url) {
        await this.tryAddToPlaylist(url)
    }

    async getPlaylists() {
        return this.playlists
    }

    isSignedIn() {
        return this.accessToken != null
    }

    // Private methods

    async openSignInForm() {
        if (this.isSignedIn()) {
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
        // https://asdasd.chromiumapp.org/
        // #state=meetasdasd
        // &access_token=asdasd
        // &token_type=Bearer
        // &expires_in=3599
        // &scope=asdasd

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

        console.log("Successfully signed in")

        await chrome.action.setPopup({ popup: '/views/popup-signed-in.html' })
        return 'success'
    }

    async tryAddToPlaylist(url) {
        let YOUTUBE_VIDEO_URL = 'https://www.youtube.com/watch'
        if (!url.startsWith(YOUTUBE_VIDEO_URL)) {
            return
        }

        let query = new URL(url).searchParams
        let videoId = query.get('v')
        let playlistId = this.playlists.find(p => p.title == 'testyIsBesty').id

        await this.addToPlaylist(videoId, playlistId)
    }

    async addToPlaylist(videoId, playlistId) {
        let endpoint = 'https://www.googleapis.com/youtube/v3/playlistItems?part=snippet'

        let data = {
            snippet: {
                playlistId: playlistId,
                resourceId: {
                    kind: 'youtube#video',
                    videoId: videoId
                }
            }
        }

        let params = {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${this.accessToken}`
            },
            body: JSON.stringify(data)
        }

        let response = await fetch(endpoint, params)
        let json = await response.json()
        console.log(json)
        return json
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

        this.playlists = result

        console.log("Fetched playlists")
        console.log(result)
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
}

export default Youtube
