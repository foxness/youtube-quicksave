async function main() {
    await makePlaylistSelector()
    await makeQuicksaveLog()
    await makeQuicksaveCount()
}

async function makePlaylistSelector() {
    let playlists = await chrome.runtime.sendMessage({ kind: 'getPlaylists' })

    let container = $('#playlist-selector')
    let fieldset = $('<fieldset>')
    
    let legend = $('<legend>').text('Quicksave Playlist:')
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
            kind: 'playlistSelect',
            playlistId: playlistId
        }
        
        await chrome.runtime.sendMessage(message)
        console.log(`selected ${optionSelected.text()}`)
    })

    fieldset.append(select)
    fieldset.append('<svg><use xlink:href="#select-arrow-down"></use></svg>')
    container.append(fieldset)
}

async function makeQuicksaveLog() {
    let quicksaveLog = await chrome.runtime.sendMessage({ kind: 'getQuicksaveLog' })

    let container = $('#quicksave-log')
    let textarea = $('<textarea>', { rows: 10 }).prop('readonly', true).text(quicksaveLog)
    
    container.append(textarea)
    textarea.scrollTop(textarea[0].scrollHeight)
}

async function makeQuicksaveCount() {
    let quicksaveCount = await chrome.runtime.sendMessage({ kind: 'getQuicksaveCount' })
    $('#quicksave-count').text(quicksaveCount)
}

$(window).on('load', main)

$('#sign-out').click(async () => {
    let response = await chrome.runtime.sendMessage({ kind: 'signOut' })
    if (response == 'success') {
        window.close()
    }
})

// $('#user-status').click(async () => {
//     let signedIn = await chrome.runtime.sendMessage({ kind: 'isSignedIn' })
//     alert(signedIn)
// })

$('#quicksave').click(async () => {
    let response = await chrome.runtime.sendMessage({ kind: 'quicksave' })
})

$('#dew-it').click(async () => {
    let response = await chrome.runtime.sendMessage({ kind: 'dewIt' })
})