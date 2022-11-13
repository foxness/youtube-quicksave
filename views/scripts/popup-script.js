$('#sign-in').click(async () => {
    let response = await chrome.runtime.sendMessage({ message: 'signIn' })
    if (response == 'success') {
        window.close()
    }
})

$('#user-status').click(async () => {
    let signedIn = await chrome.runtime.sendMessage({ message: 'isSignedIn' })
    alert(signedIn)
})