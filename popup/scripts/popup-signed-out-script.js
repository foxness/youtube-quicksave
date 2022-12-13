$('#sign-in').click(async () => {
    let response = await chrome.runtime.sendMessage({ kind: 'signIn' })
    if (response == 'success') {
        window.close()
    }
})