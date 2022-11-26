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
            return await showQuicksaveIndicator()
    }

    return 'fail'
}

async function showQuicksaveIndicator() {
    console.log('showing quicksave indicator...')
}

main()