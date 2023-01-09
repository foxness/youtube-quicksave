let DURATION_TOAST = 3000

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

async function handleMessage(message) {
    switch (message.kind) {
        case 'quicksaveStart':
            return await showQuicksaveStart(message.quicksaveId)
        case 'quicksaveDone':
            let quicksaveData = message
            delete quicksaveData.kind
            return await showQuicksaveDone(quicksaveData)
        case 'getHoverUrl':
            return await getHoverUrl()
        case 'getWatchLaterVideos':
            return await getWatchLaterVideos()
        case 'notSignedIn':
            return await showNotSignedIn()
    }

    return 'fail' // todo: remove
}

async function showQuicksaveStart(quicksaveId) {
    let toastParams = {
        text: 'Quicksaving...',
        icon: 'loading',
        position: 'top-left',
        showHideTransition: 'slide',
        showCloseButton: false,
        hideAfter: false
    }

    quicksaveToasts[quicksaveId] = $.toast(toastParams)
}

async function showQuicksaveDone(quicksaveData) {
    let quicksaveId = quicksaveData.quicksaveId
    let toastParams = getSecondaryToastParams(quicksaveData)
    let quicksaveToast = quicksaveToasts[quicksaveId]

    quicksaveToast.update(toastParams)
    await sleep(DURATION_TOAST)
    quicksaveToast.close()

    delete quicksaveToasts[quicksaveId]
}

async function showNotSignedIn() {
    let toastParams = {
        text: 'Quicksave: Not Signed In',
        icon: 'warning',
        position: 'top-left',
        showHideTransition: 'slide',
        showCloseButton: false,
        hideAfter: DURATION_TOAST,
        loader: false // todo: fix loader
    }

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

async function getHoverUrl() {
    let url = document.elementsFromPoint(mouseX, mouseY)
        .filter(e => e.tagName.toLowerCase() == 'a')
        .map(a => a.href)[0]

    return url
}

async function getWatchLaterVideos() {
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

    console.log(`copied video count: ${videos.length}`) // todo: add toast showing copied count

    return videos
}

function makePlaylistLink(playlistTitle, playlistId) {
    let playlistLink = `/playlist?list=${playlistId}`
    return `<a href="${playlistLink}" target="_blank" rel="noopener noreferrer">${playlistTitle}</a>`
}

function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms))
}

main()