let DURATION_TOAST = 3000

let quicksaveToasts = {}
let mouseX = null
let mouseY = null

function main() {
    setupListeners()
}

function setupListeners() {
    chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
        handleMessage(request).then(sendResponse)
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

async function showQuicksaveDone(quicksaveData) {
    let quicksaveId = quicksaveData.quicksaveId
    let toastParams = getSecondaryToastParams(quicksaveData)
    let quicksaveToast = quicksaveToasts[quicksaveId]

    quicksaveToast.update(toastParams)
    await sleep(DURATION_TOAST)
    quicksaveToast.close()

    delete quicksaveToasts[quicksaveId]
}

function getSecondaryToastParams(quicksaveData) {
    let text, icon
    if (quicksaveData.error) {
        switch (quicksaveData.error) {
            case 'alreadyInPlaylist':
                text = `Already in <b>${quicksaveData.playlistTitle}</b>`
                icon = 'info'
                break
            default:
                console.log(quicksaveData)
                throw 'Unexpected error'
        }
    } else {
        text = `Quicksaved to <b>${quicksaveData.playlistTitle}</b>`
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
        .map(a => a.href)
        [0]
        
    return url
}

function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms))
}

main()