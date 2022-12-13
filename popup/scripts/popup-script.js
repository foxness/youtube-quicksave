
// --- MAIN -------------------------------------------------

let logShown = false

async function main() {
    await makePlaylistSelector()
    await makeQuicksaveLog()
    await makeQuicksaveCount()
}

// --- BUILDER METHODS --------------------------------------

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

// --- LISTENER METHODS -------------------------------------

$(window).on('load', main)

$('#quicksave').click(async () => {
    let response = await chrome.runtime.sendMessage({ kind: 'quicksave' })
})

$('#deduplicate-playlist').click(async () => {
    chrome.runtime.sendMessage({ kind: 'deduplicatePlaylist' }) // intentionally no await because it's long
    closeMenuWithoutAnimation()
})

$('#change-shortcuts').click(async () => {
    closeMenuWithoutAnimation()
})

$('#toggle-log').click(async () => {
    toggleLog()
    closeMenuWithoutAnimation()
})

$('#sign-out').click(async () => {
    let response = await chrome.runtime.sendMessage({ kind: 'signOut' })
    if (response == 'success') {
        window.close()
    }
})

// --- MISC METHODS -----------------------------------------

function toggleLog() {
    let toggleText
    let animationProps

    if (logShown) {
        toggleText = 'Show Log'
        animationProps = {
            height: 0,
            opacity: 0,
            margin: '0'
        }
    } else {
        toggleText = 'Hide Log'
        animationProps = {
            height: 250,
            opacity: 1,
            margin: '10px 0'
        }
    }

    $('#toggle-log').text(toggleText)
    $('#quicksave-log').animate(animationProps, 200)

    logShown = !logShown
}

async function closeMenuWithoutAnimation() {
    let menu = $('.menu')
    menu.addClass('notransition')
    $('.toggler').click()
    await sleep(1) // a necessary hack, works even with sleep(0)
    menu.removeClass('notransition')
}

function sleep(duration) {
    return new Promise(resolve => setTimeout(resolve, duration))
}