let quicksaveToast = null

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
            return await showQuicksaveStart()
        case 'quicksaveSuccess':
            return await showQuicksaveSuccess()
    }

    return 'fail'
}

async function showQuicksaveStart() {
    let toastParams = {
        text: 'quicksaving...',
        hideAfter: false
    }

    quicksaveToast = $.toast(toastParams)
}

async function showQuicksaveSuccess() {
    let toastParams = {
        text: 'success!'
    }
    
    quicksaveToast.update(toastParams)
    await sleep(1000)
    quicksaveToast.reset()
}

function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms))
}

main()