async function main() {
    let playlists = await chrome.runtime.sendMessage({ message: 'getPlaylists' })

    let list = $('<ul></ul>')
    playlists.forEach(p => {
        list.append(`<li>${p.title}</li>`)
    })

    list.insertAfter('#dew-it')
}

$(window).on('load', main)

$('#sign-out').click(async () => {
    let response = await chrome.runtime.sendMessage({ message: 'signOut' })
    if (response == 'success') {
        window.close()
    }
})

$('#user-status').click(async () => {
    let signedIn = await chrome.runtime.sendMessage({ message: 'isSignedIn' })
    alert(signedIn)
})

$('#quicksave').click(async () => {
    let response = await chrome.runtime.sendMessage({ message: 'quicksave' })
})

$('#dew-it').click(async () => {
    let response = await chrome.runtime.sendMessage({ message: 'dewIt' })
})