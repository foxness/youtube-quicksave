$('#sign-in').click(() => {
    chrome.runtime.sendMessage({ kind: 'signIn' })
    window.close()
})