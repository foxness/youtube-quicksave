class Youtube {

    // Constructor

    constructor(config) {
        this.CLIENT_ID = config.web.client_id
        this.CLIENT_SECRET = config.web.client_secret
        this.REDIRECT_URI = config.web.redirect_uris[0]

        this.authCode = null
        this.refreshToken = null
        this.accessToken = null
        this.accessTokenExpirationDate = null
        this.playlists = null
    }

    static async fromSerialized(config, serialized) {
        let youtube = new Youtube(config)
        let parsed = JSON.parse(serialized)

        youtube.accessToken = parsed.accessToken
        youtube.playlists = parsed.playlists

        await youtube.updatePopup()
        return youtube
    }

    // Public methods

    async signInAndFetchPlaylists() {
        await this.openSignInForm()
        if (this.authCode == null) {
            return 'fail'
        }

        await this.fetchRefreshToken()
        if (!this.isSignedIn()) {
            return 'fail'
        }

        await this.fetchPlaylists()
        return 'success'
    }

    async signOut() {
        this.accessToken = null
        await this.updatePopup()

        return 'success'
    }

    async dewIt(url) {
        await this.tryAddToPlaylist(url)
    }

    async getPlaylists() {
        return this.playlists
    }

    isSignedIn() {
        return this.refreshToken != null
    }

    getSerialized() {
        let serialized = {
            accessToken: this.accessToken,
            playlists: this.playlists
        }

        return JSON.stringify(serialized)
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
        // ?state=meetasdasd
        // &code=asdasd
        // &scope=asdasd

        let query = new URL(redirectUrl).searchParams

        let state = query.get('state')
        let code = query.get('code')
        let scope = query.get('scope')

        if (state != this.STATE || code == null || scope != this.SCOPE) {
            return 'fail'
        }

        this.authCode = code
        return 'success'
    }

    async fetchRefreshToken() {
        let endpoint = 'https://oauth2.googleapis.com/token'

        let data = {
            code: this.authCode,
            client_id: this.CLIENT_ID,
            client_secret: this.CLIENT_SECRET,
            redirect_uri: this.REDIRECT_URI,
            grant_type: 'authorization_code'
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

        console.log('fetched refresh token')
        console.log(json)
        
        let accessToken = json.access_token
        let expiresIn = json.expires_in
        let refreshToken = json.refresh_token
        let scope = json.scope
        let tokenType = json.token_type

        if (accessToken == null
            || expiresIn == null
            || refreshToken == null
            || scope != this.SCOPE
            || tokenType != 'Bearer') {

            return 'fail'
        }

        this.accessToken = accessToken
        await this.updatePopup()

        this.refreshToken = refreshToken
        this.accessTokenExpirationDate = this.getExpirationDate(expiresIn)

        console.log("successfully signed in")
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

        console.log('video quicksaved')
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

    async updatePopup() {
        let popup

        if (this.isSignedIn()) {
            popup = '/views/popup-signed-in.html'
        } else {
            popup = '/views/popup.html'
        }

        await chrome.action.setPopup({ popup: popup })
    }

    createAuthEndpoint() {
        let endpoint = 'https://accounts.google.com/o/oauth2/v2/auth'

        this.SCOPE = 'https://www.googleapis.com/auth/youtube'
        this.STATE = 'meet' + Math.random().toString(36).substring(2, 15)

        let data = {
            client_id: this.CLIENT_ID,
            response_type: 'code',
            redirect_uri: this.REDIRECT_URI,
            scope: this.SCOPE,
            state: this.STATE,
            prompt: 'consent',
            access_type: 'offline'
        }

        let url = new URL(endpoint)
        url.search = new URLSearchParams(data)

        return url.toString()
    }

    getExpirationDate(expiresIn) {
        return new Date(new Date().getTime() + expiresIn * 1000)
    }
}

export default Youtube
