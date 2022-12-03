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

    let select = $('<select>')

    playlists.forEach(p => {
        let option = $('<option>', { value: p.id }).text(p.title).prop('selected', p.quicksave)
        select.append(option)
    })

    select.change(async () => {
        let optionSelected = $('option:selected', select)
        let playlistId = select.val()
        
        let message = {
            kind: 'playlistSelected',
            playlistId: playlistId
        }
        
        await chrome.runtime.sendMessage({ message: message })
        console.log(`selected ${optionSelected.text()}`)
    })

    fieldset.append(select)
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