$('#sign-in').click(async () => {
    let response = await chrome.runtime.sendMessage({ kind: 'signIn' })
    if (response == 'success') {
        window.close()
    }
})

$('#user-status').click(async () => {
    let signedIn = await chrome.runtime.sendMessage({ kind: 'isSignedIn' })
    alert(signedIn)
})