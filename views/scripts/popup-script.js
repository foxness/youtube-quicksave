document.querySelector('#sign-in').addEventListener('click', () => {
    chrome.runtime.sendMessage({ message: 'signIn' }, (response) => {
        if (response === 'success')
            window.close()
    })
})

document.querySelector('#user-status').addEventListener('click', () => {
    chrome.runtime.sendMessage({ message: 'isUserSignedIn' }, (response) => {
        alert(response)
    })
})