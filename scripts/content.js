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
        text: styledToastText('Quicksaving...'),
        icon: 'info',
        position: {
            left: 10,
            top: 9
        },
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
    quicksaveToast.reset()

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
        text = styledToastText(`Already in <b>${playlistTitle}</b>`)
        icon = 'warning'
    } else {
        text = styledToastText(`Quicksaved to <b>${playlistTitle}</b>`)
        icon = 'success'
    }

    let toastParams = {
        text: text,
        icon: icon
    }

    return toastParams
}

function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms))
}

function styledToastText(text) {
    return `<p style="font-size:2rem">${text}</p>`
}

main()