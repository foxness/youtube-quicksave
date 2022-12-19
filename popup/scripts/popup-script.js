
// --- MAIN -------------------------------------------------

let logShown = false

$(document).ready(main)

async function main() {
    setupListeners()
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
    let shouldShowLog = await chrome.runtime.sendMessage({ kind: 'getShouldShowLog' })

    let container = $('#quicksave-log')
    let textarea = $('<textarea>', { rows: 10 }).prop('readonly', true).text(quicksaveLog)

    container.append(textarea)
    textarea.scrollTop(textarea[0].scrollHeight)

    if (shouldShowLog) {
        toggleLog(false)
    }
}

async function makeQuicksaveCount() {
    let quicksaveCount = await chrome.runtime.sendMessage({ kind: 'getQuicksaveCount' })
    $('#quicksave-count').text(quicksaveCount)
}

// --- LISTENER METHODS -------------------------------------

function setupListeners() {
    $(document).click(handleDocumentClicked)
    $('#quicksave').click(handleQuicksaveButtonClicked)
    $('#deduplicate-playlist').click(handleDeduplicatePlaylistButtonClicked)
    $('#change-shortcuts').click(handleChangeShortcutsButtonClicked)
    $('#toggle-log').click(handleToggleLogButtonClicked)
    $('#sign-out').click(handleSignOutButtonClicked)
}

function handleDocumentClicked(event) {
    let menu = $('.menu')

    let menuOpened = $('.toggler').prop('checked')
    let clickedOnMenu = event.target == menu[0] || menu.has(event.target).length > 0 || event.target == $('.toggler')[0]

    if (menuOpened && !clickedOnMenu) {
        closeMenu()
    }
}

async function handleQuicksaveButtonClicked() {
    let response = await chrome.runtime.sendMessage({ kind: 'quicksave' })
}

function handleDeduplicatePlaylistButtonClicked() {
    chrome.runtime.sendMessage({ kind: 'deduplicatePlaylist' }) // intentionally no await because it's long
    closeMenuWithoutAnimation()
}

function handleChangeShortcutsButtonClicked() {
    openShortcuts()
    closeMenuWithoutAnimation()
}

function handleToggleLogButtonClicked() {
    toggleLog()

    let message = {
        kind: 'setShouldShowLog',
        shouldShowLog: logShown
    }

    chrome.runtime.sendMessage(message) // intentionally no await
    closeMenuWithoutAnimation()
}

async function handleSignOutButtonClicked() {
    let response = await chrome.runtime.sendMessage({ kind: 'signOut' })
    if (response == 'success') {
        window.close()
    }
}

// --- MISC METHODS -----------------------------------------

function openShortcuts() {
    let shortcutsUrl = 'chrome://extensions/shortcuts'
    chrome.tabs.create({ url: shortcutsUrl }) // intentionally no await
}

function toggleLog(animated = true) {
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

    let duration = animated ? 200 : 0

    $('#toggle-log').text(toggleText)
    $('#quicksave-log').animate(animationProps, duration)

    logShown = !logShown
}

async function closeMenuWithoutAnimation() {
    let menu = $('.menu')
    menu.addClass('notransition')

    closeMenu()

    await sleep(1) // a necessary hack, works even with sleep(0)
    menu.removeClass('notransition')
}

function closeMenu() {
    $('.toggler').prop('checked', false)
}

function sleep(duration) {
    return new Promise(resolve => setTimeout(resolve, duration))
}
