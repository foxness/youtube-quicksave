let TOAST_DURATION = 3000

let quicksaveToasts = {}
let mouseX = null
let mouseY = null

function main() {
    setupListeners()
}

function setupListeners() {
    chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
        handleMessage(message).then(sendResponse)
        return true // return true to indicate we want to send a response asynchronously
    })

    $(document).mousemove((event) => {
        mouseX = event.clientX
        mouseY = event.clientY
    })
}

async function handleMessage(message) { // do not remove async
    switch (message.kind) { // no return value
        case 'quicksaveStart':
            showQuicksaveStart(message.quicksaveId)
            return
        case 'quicksaveDone':
            let quicksaveData = message
            delete quicksaveData.kind
            showQuicksaveDone(quicksaveData) // intentionally no await
            return
        case 'notSignedIn':
            showNotSignedIn()
            return
        case 'copiedVideos':
            showRegularPlaylistCopiedToast()
            return
    }

    switch (message.kind) { // has a return value
        case 'getHoverUrl':
            return getHoverUrl()
        case 'getWatchLaterVideos':
            return getWatchLaterVideosAndShowToast()
    }
}

function getWatchLaterVideosAndShowToast() {
    let videos = getWatchLaterVideos()
    let copiedCount = videos.length
    let totalCount = getPlaylistVideoCount()
    showCopiedVideosToast(copiedCount, totalCount)

    return videos
}

function showRegularPlaylistCopiedToast() {
    let copiedCount = getPlaylistVideoCount()
    showCopiedVideosToast(copiedCount)
}

function showQuicksaveStart(quicksaveId) {
    let toastParams = makeToastParams('Quicksaving...', 'loading', false)
    quicksaveToasts[quicksaveId] = $.toast(toastParams)
}

async function showQuicksaveDone(quicksaveData) {
    let quicksaveId = quicksaveData.quicksaveId
    let toastParams = getSecondaryToastParams(quicksaveData)
    let quicksaveToast = quicksaveToasts[quicksaveId]

    quicksaveToast.update(toastParams)
    await sleep(TOAST_DURATION)
    quicksaveToast.close()

    delete quicksaveToasts[quicksaveId]
}

function showNotSignedIn() {
    let toastParams = makeToastParams('Quicksave: Not Signed In', 'warning')
    $.toast(toastParams)
}

function showCopiedVideosToast(copiedCount, totalCount) {
    let text
    if (totalCount === undefined) {
        text = `Copied ${copiedCount} videos`
    } else {
        text = `Copied ${copiedCount} out of ${totalCount} videos`
    }

    let toastParams = makeToastParams(text, 'info')
    $.toast(toastParams)
}

function getSecondaryToastParams(quicksaveData) {
    let text, icon
    if (quicksaveData.error) {
        switch (quicksaveData.error) {
            case 'alreadyInPlaylist':
                let link = makePlaylistLink(quicksaveData.playlistTitle, quicksaveData.playlistId)
                text = `Already in ${link}`
                icon = 'info'
                break
            default:
                console.log(quicksaveData)
                throw 'Unexpected error'
        }
    } else {
        let link = makePlaylistLink(quicksaveData.playlistTitle, quicksaveData.playlistId)
        text = `Quicksaved to ${link}`
        icon = 'success'
    }

    let toastParams = {
        text: text,
        icon: icon
    }

    return toastParams
}

function makeToastParams(text, icon, hideAfter = null) {
    let TOAST_POSITION = 'top-left'
    let TOAST_TRANSITION = 'slide'
    let TOAST_SHOW_CLOSE_BUTTON = false
    let TOAST_LOADER = false

    let toastHideAfter = hideAfter === null ? TOAST_DURATION : hideAfter

    let toastParams = {
        text: text,
        icon: icon,
        position: TOAST_POSITION,
        showHideTransition: TOAST_TRANSITION,
        showCloseButton: TOAST_SHOW_CLOSE_BUTTON,
        hideAfter: toastHideAfter,
        loader: TOAST_LOADER // todo: fix loader
    }

    return toastParams
}

function getHoverUrl() {
    let url = document.elementsFromPoint(mouseX, mouseY)
        .filter(e => e.tagName.toLowerCase() == 'a')
        .map(a => a.href)[0]

    return url
}

function getWatchLaterVideos() {
    if (window.location.href != 'https://www.youtube.com/playlist?list=WL') {
        return null
    }

    let html = document.documentElement.outerHTML

    let DATA_START = 'ytd-playlist-video-renderer" href="/watch?v='
    let DATA_END = '&'

    let videos = []
    let currentIndex = 0

    while (true) {
        let startIndex = html.indexOf(DATA_START, currentIndex)
        if (startIndex == -1) {
            break
        }

        startIndex += DATA_START.length
        let endIndex = html.indexOf(DATA_END, startIndex + 1)

        let data = html.substring(startIndex, endIndex)
        currentIndex = endIndex + DATA_END.length + 1

        if (data.length == 11) { // video ids are always 11 characters long
            videos.push(data)
        }
    }

    return videos
}

function getPlaylistVideoCount() {
    if (!window.location.href.startsWith('https://www.youtube.com/playlist?list=')) {
        return null
    }

    let html = document.documentElement.outerHTML

    let DATA_START = '<yt-formatted-string class="byline-item style-scope ytd-playlist-byline-renderer"><span dir="auto" class="style-scope yt-formatted-string">'
    let DATA_END = '</span>'

    let startIndex = html.indexOf(DATA_START)
    if (startIndex == -1) {
        return null
    }

    startIndex += DATA_START.length
    let endIndex = html.indexOf(DATA_END, startIndex + 1)
    if (endIndex == -1) {
        return null
    }

    let rawData = html.substring(startIndex, endIndex)
    let videoCount = parseInt(rawData.replace(',', ''))

    return videoCount
}

function makePlaylistLink(playlistTitle, playlistId) {
    let playlistLink = `/playlist?list=${playlistId}`
    return `<a href="${playlistLink}" target="_blank" rel="noopener noreferrer">${playlistTitle}</a>`
}

function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms))
}

main()