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
    let quicksaveId = message.quicksaveId

    switch (message.kind) {
        case 'quicksaveStart':
            return await showQuicksaveStart(quicksaveId)
        case 'quicksaveSuccess':
            let quicksaveData = {
                quicksaveId: quicksaveId,
                videoId: message.videoId,
                videoTitle: message.videoTitle,
                playlistId: message.playlistId,
                playlistTitle: message.playlistTitle,
                alreadyInPlaylist: message.alreadyInPlaylist
            }

            return await showQuicksaveSuccess(quicksaveData)
    }

    return 'fail'
}

async function showQuicksaveStart(quicksaveId) {
    let toastParams = {
        text: 'quicksaving...',
        hideAfter: false
    }

    quicksaveToasts[quicksaveId] = $.toast(toastParams)
}

async function showQuicksaveSuccess(quicksaveData) {
    let {
        quicksaveId,
        videoId,
        videoTitle,
        playlistId,
        playlistTitle,
        alreadyInPlaylist
    } = quicksaveData

    let text
    if (alreadyInPlaylist) {
        text = `[${videoTitle}] is already in [${playlistTitle}]\n`
    } else {
        text = `[${videoTitle}] was quicksaved to [${playlistTitle}]\n`
    }

    let toastParams = {
        text: text
    }

    let quicksaveToast = quicksaveToasts[quicksaveId]
    quicksaveToast.update(toastParams)
    await sleep(10000)
    quicksaveToast.reset()

    delete quicksaveToasts[quicksaveId]
}

function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms))
}

main()