document.querySelector('#sign-out').addEventListener('click', () => {
    chrome.runtime.sendMessage({ message: 'signOut' }, (response) => {
        if (response === 'success')
            window.close()
    })
})

document.querySelector('button').addEventListener('click', () => {
    chrome.runtime.sendMessage({ message: 'isUserSignedIn' }, (response) => {
        alert(response)
    })
})