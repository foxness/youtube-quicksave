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
            return await showQuicksaveSuccess(quicksaveId)
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

async function showQuicksaveSuccess(quicksaveId) {
    let toastParams = {
        text: 'success!'
    }
    
    let quicksaveToast = quicksaveToasts[quicksaveId]
    quicksaveToast.update(toastParams)
    await sleep(1000)
    quicksaveToast.reset()

    delete quicksaveToasts[quicksaveId]
}

function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms))
}

main()