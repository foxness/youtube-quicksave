document.querySelector('#sign-out').addEventListener('click', () => {
    chrome.runtime.sendMessage({ message: 'signOut' }, (response) => {
        if (response === 'success')
            window.close()
    })
})

document.querySelector('#user-status').addEventListener('click', () => {
    chrome.runtime.sendMessage({ message: 'isUserSignedIn' }, (response) => {
        alert(response)
    })
})

document.querySelector('#dew-it').addEventListener('click', () => {
    chrome.runtime.sendMessage({ message: 'dewIt' }, (response) => {
        // dew it
    })
})