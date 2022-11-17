async function main() {
    let playlists = await chrome.runtime.sendMessage({ message: 'getPlaylists' })

    let playlistContainer = $('<div>', { id: 'playlistContainer' })
    let fieldset = $('<fieldset>')
    
    let legend = $('<legend>').text('Select a playlist for Quicksave:')
    fieldset.append(legend)

    playlists.forEach(p => {
        let div = $('<div>')
        let label = $('<label>')
        let radio = $('<input>', { type: 'radio', name: 'quicksave-playlist-0', value: p.id }).prop('checked', p.quicksave)
        radio.click(async () => {
            let message = {
                kind: 'playlistSelected',
                playlistId: p.id
            }
            
            await chrome.runtime.sendMessage({ message: message })
            console.log('radio ' + p.title)
        })

        label.append(radio)
        label.append(p.title)
        
        div.append(label)
        fieldset.append(div)
    })

    playlistContainer.append(fieldset)
    playlistContainer.insertAfter('#dew-it')
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