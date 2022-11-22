async function main() {
    await makePlaylistSelector()
    await makeQuicksaveLog()
}

async function makePlaylistSelector() {
    let playlists = await chrome.runtime.sendMessage({ message: 'getPlaylists' })

    let container = $('#playlist-selector')
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

    container.append(fieldset)
}

async function makeQuicksaveLog() {
    let quicksaveLog = await chrome.runtime.sendMessage({ message: 'getQuicksaveLog' })

    let container = $('#quicksave-log')
    let textarea = $('<textarea>', { rows: 10 }).prop('readonly', true).text(quicksaveLog)
    
    container.append(textarea)
    textarea.scrollTop(textarea[0].scrollHeight)
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