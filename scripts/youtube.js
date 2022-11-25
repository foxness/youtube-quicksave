class Youtube {

    // Initialization

    constructor(config) {
        this.ENDPOINT_AUTH = 'https://accounts.google.com/o/oauth2/v2/auth'
        this.ENDPOINT_TOKEN = 'https://oauth2.googleapis.com/token'
        this.ENDPOINT_PLAYLISTS = 'https://www.googleapis.com/youtube/v3/playlists'
        this.ENDPOINT_PLAYLIST_ITEMS = 'https://www.googleapis.com/youtube/v3/playlistItems'

        this.SCOPE = 'https://www.googleapis.com/auth/youtube'

        this.CLIENT_ID = config.web.client_id
        this.CLIENT_SECRET = config.web.client_secret
        this.REDIRECT_URI = config.web.redirect_uris[0]

        this.state = 'meet' + this.getRandomState()
        this.authCode = null
        this.refreshToken = null
        this.accessToken = null
        this.accessTokenExpirationDate = null
        this.playlists = null
    }

    static async fromSerialized(config, serialized) {
        let youtube = new Youtube(config)
        let parsed = JSON.parse(serialized)

        youtube.state = parsed.state
        youtube.refreshToken = parsed.refreshToken
        youtube.accessToken = parsed.accessToken
        youtube.accessTokenExpirationDate = new Date(parsed.accessTokenExpirationDate)
        youtube.playlists = parsed.playlists

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
        this.refreshToken = null
        return 'success'
    }

    async deduplicatePlaylist(playlistId) {
        let videos = await this.fetchPlaylistVideos(playlistId)

        // assumes that the playlist is sorted by 'Date added (newest)'
        // after reversing, only the oldest duplicate survives
        videos.reverse()

        let processedVideoIds = []
        let videosToDelete = []

        for (let i = 0; i < videos.length; i++) {
            let videoA = videos[i]

            if (processedVideoIds.includes(videoA.videoId)) {
                continue
            }

            for (let j = i + 1; j < videos.length; j++) {
                let videoB = videos[j]

                if (videoA.videoId == videoB.videoId) {
                    videosToDelete.push(videoB)
                }
            }

            processedVideoIds.push(videoA.videoId)
        }

        await this.removeVideosFromPlaylist(videosToDelete.map(v => v.itemId))
        console.log(`deleted ${videosToDelete.length} duplicate videos:`)
        console.log(videosToDelete)
    }

    async getPlaylists() {
        return this.playlists
    }

    isSignedIn() {
        return this.refreshToken != null
    }

    getSerialized() {
        let serialized = {
            state: this.state,
            refreshToken: this.refreshToken,
            accessToken: this.accessToken,
            accessTokenExpirationDate: this.accessTokenExpirationDate,
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

        if (state != this.state || code == null || scope != this.SCOPE) {
            return 'fail'
        }

        this.authCode = code
        return 'success'
    }

    async fetchRefreshToken() {
        let bodyData = {
            code: this.authCode,
            client_id: this.CLIENT_ID,
            client_secret: this.CLIENT_SECRET,
            redirect_uri: this.REDIRECT_URI,
            grant_type: 'authorization_code'
        }

        let requestParams = {
            endpoint: this.ENDPOINT_TOKEN,
            method: 'POST',
            isAuthed: false,
            urlQueryData: null,
            bodyData: bodyData
        }

        let response = await this.executeRequest(requestParams)
        let json = await response.json()
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
        this.refreshToken = refreshToken
        this.accessTokenExpirationDate = this.getExpirationDate(expiresIn)

        console.log('fetched refresh token')
        return 'success'
    }

    async refreshAccessToken() {
        let bodyData = {
            client_id: this.CLIENT_ID,
            client_secret: this.CLIENT_SECRET,
            refresh_token: this.refreshToken,
            grant_type: 'refresh_token'
        }

        let requestParams = {
            endpoint: this.ENDPOINT_TOKEN,
            method: 'POST',
            isAuthed: false,
            urlQueryData: null,
            bodyData: bodyData
        }

        let response = await this.executeRequest(requestParams)
        let json = await response.json()
        console.log(json)

        let accessToken = json.access_token
        let expiresIn = json.expires_in
        let scope = json.scope
        let tokenType = json.token_type

        if (accessToken == null
            || expiresIn == null
            || scope != this.SCOPE
            || tokenType != 'Bearer') {

            return 'fail'
        }

        this.accessToken = accessToken
        this.accessTokenExpirationDate = this.getExpirationDate(expiresIn)

        console.log('refreshed access token')
        return 'success'
    }

    async ensureValidAccessToken() {
        if (new Date() < this.accessTokenExpirationDate) {
            return
        }

        await this.refreshAccessToken()
    }

    async tryAddToPlaylist(url, playlistId) {
        let YOUTUBE_VIDEO_URL = 'https://www.youtube.com/watch'
        if (!url.startsWith(YOUTUBE_VIDEO_URL)) {
            return
        }

        let query = new URL(url).searchParams
        let videoId = query.get('v')

        return await this.addToPlaylist(videoId, playlistId)
    }

    async fetchPlaylists() {
        let urlQueryData = {
            part: 'snippet',
            mine: true
        }

        let requestParams = {
            endpoint: this.ENDPOINT_PLAYLISTS,
            method: 'GET',
            isAuthed: true,
            urlQueryData: urlQueryData,
            bodyData: null
        }

        let response = await this.executeRequest(requestParams)
        let json = await response.json()

        let result = json.items.map((a) => {
            return {
                id: a.id,
                title: a.snippet.title
            }
        })

        this.playlists = result

        console.log("fetched playlists")
        console.log(result)
    }

    async addToPlaylist(videoId, playlistId, preventDuplicate = true) {
        if (preventDuplicate && await this.checkIfPlaylistContainsVideo(playlistId, videoId)) {
            return 'alreadyInPlaylist'
        }

        let urlQueryData = {
            part: 'snippet'
        }

        let bodyData = {
            snippet: {
                playlistId: playlistId,
                resourceId: {
                    kind: 'youtube#video',
                    videoId: videoId
                }
            }
        }

        let requestParams = {
            endpoint: this.ENDPOINT_PLAYLIST_ITEMS,
            method: 'POST',
            isAuthed: true,
            urlQueryData: urlQueryData,
            bodyData: bodyData
        }

        let response = await this.executeRequest(requestParams)
        let json = await response.json()
        console.log('video quicksaved')
        console.log(json)

        return {
            videoId: videoId,
            videoTitle: json.snippet.title,
            playlistId: playlistId,
            playlistTitle: this.playlists.find(p => p.id == playlistId).title
        }
    }

    async fetchPlaylistVideos(playlistId) {
        console.log(`started fetching playlist videos`)

        let urlQueryData = {
            part: 'snippet',
            playlistId: playlistId,
            maxResults: 50
        }

        let videos = []
        let pageIndex = 0
        while (true) {
            console.log(`fetching page ${pageIndex + 1}`)

            let requestParams = {
                endpoint: this.ENDPOINT_PLAYLIST_ITEMS,
                method: 'GET',
                isAuthed: true,
                urlQueryData: urlQueryData,
                bodyData: null
            }

            let response = await this.executeRequest(requestParams)
            let json = await response.json()

            let pageItems = json.items.map((a) => {
                return {
                    itemId: a.id,
                    videoId: a.snippet.resourceId.videoId,
                    videoTitle: a.snippet.title
                }
            })

            videos.push(...pageItems)

            let nextPageToken = json.nextPageToken
            if (!nextPageToken) {
                break
            }

            urlQueryData.pageToken = nextPageToken
            pageIndex++
        }

        console.log(`finished fetching playlist videos`)

        return videos
    }

    async checkIfPlaylistContainsVideo(playlistId, videoId) {
        let urlQueryData = {
            part: 'contentDetails',
            playlistId: playlistId,
            videoId: videoId,
            maxResults: 1
        }

        let requestParams = {
            endpoint: this.ENDPOINT_PLAYLIST_ITEMS,
            method: 'GET',
            isAuthed: true,
            urlQueryData: urlQueryData,
            bodyData: null
        }

        let response = await this.executeRequest(requestParams)
        let json = await response.json()

        console.log(json)

        // let pageItems = json.items.map((a) => {
        //     return {
        //         itemId: a.id,
        //         videoId: a.snippet.resourceId.videoId,
        //         videoTitle: a.snippet.title
        //     }
        // })

        return json.items.length > 0
    }

    // Helper

    async executeRequest(requestParams) {
        let { endpoint, method, isAuthed, urlQueryData, bodyData } = requestParams

        if (isAuthed) {
            await this.ensureValidAccessToken()
        }

        let url = this.addQueryToUrl(endpoint, urlQueryData)
        let params = this.getRequestParams(method, isAuthed, bodyData)

        return await fetch(url, params)
    }

    getRequestParams(method, isAuthed, bodyData) {
        let params = {
            method: method,
            headers: {
                'Content-Type': 'application/json'
            }
        }

        if (isAuthed) {
            params.headers['Authorization'] = `Bearer ${this.accessToken}`
        }

        if (bodyData) {
            params.body = JSON.stringify(bodyData)
        }

        return params
    }

    createAuthEndpoint() {
        let urlQueryData = {
            client_id: this.CLIENT_ID,
            response_type: 'code',
            redirect_uri: this.REDIRECT_URI,
            scope: this.SCOPE,
            state: this.state,
            prompt: 'consent',
            access_type: 'offline'
        }

        return this.addQueryToUrl(this.ENDPOINT_AUTH, urlQueryData)
    }

    addQueryToUrl(endpoint, urlQueryData) {
        if (!urlQueryData) {
            return endpoint
        }

        let url = new URL(endpoint)
        url.search = new URLSearchParams(urlQueryData)

        return url.toString()
    }

    getExpirationDate(expiresIn) {
        return new Date(new Date().getTime() + expiresIn * 1000)
    }

    getRandomState() {
        return Math.random().toString(36).substring(2, 15)
    }
}

export default Youtube
