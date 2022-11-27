let DURATION_TOAST = 3000

let quicksaveToasts = {}

function main() {
    setupListeners()
}

function setupListeners() {
    chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
        handleMessage(request).then(sendResponse)
        return true // return true to indicate we want to send a response asynchronously
    })
}

async function handleMessage(message) {
    switch (message.kind) {
        case 'quicksaveStart':
            return await showQuicksaveStart(message.quicksaveId)
        case 'quicksaveSuccess':
            let quicksaveData = {
                quicksaveId: message.quicksaveId,
                videoId: message.videoId,
                videoTitle: message.videoTitle,
                playlistId: message.playlistId,
                playlistTitle: message.playlistTitle,
                alreadyInPlaylist: message.alreadyInPlaylist
            }

            return await showQuicksaveSuccess(quicksaveData)
        case 'getHoverUrl':
            return await getHoverUrl()
    }

    return 'fail'
}

async function showQuicksaveStart(quicksaveId) {
    let toastParams = {
        text: 'Quicksaving...',
        icon: 'loading',
        position: 'top-left',
        hideAfter: false
    }

    quicksaveToasts[quicksaveId] = $.toast(toastParams)
}

async function showQuicksaveSuccess(quicksaveData) {
    let quicksaveId = quicksaveData.quicksaveId
    let toastParams = getSecondaryToastParams(quicksaveData)
    let quicksaveToast = quicksaveToasts[quicksaveId]

    quicksaveToast.update(toastParams)
    await sleep(DURATION_TOAST)
    quicksaveToast.close()

    delete quicksaveToasts[quicksaveId]
}

function getSecondaryToastParams(quicksaveData) {
    let {
        quicksaveId,
        videoId,
        videoTitle,
        playlistId,
        playlistTitle,
        alreadyInPlaylist
    } = quicksaveData

    let text, icon
    if (alreadyInPlaylist) {
        text = `Already in <b>${playlistTitle}</b>`
        icon = 'warning'
    } else {
        text = `Quicksaved to <b>${playlistTitle}</b>`
        icon = 'success'
    }

    let toastParams = {
        text: text,
        icon: icon
    }

    return toastParams
}

async function getHoverUrl() {
    let url = 'testy'

    alert(url)
    return url
}

function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms))
}

main()