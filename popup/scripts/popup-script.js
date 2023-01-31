
// --- MAIN -------------------------------------------------

let logShown = false
let playlistId = null

$(document).ready(main)

async function main() {
    setupListeners()
    await makePlaylistSelector()
    await makeLogAndQuicksaveCount()
    await makeQuicksaveButton()
    await makeButtons()
}

// --- BUILDER METHODS --------------------------------------

async function makePlaylistSelector() {
    let playlists = await chrome.runtime.sendMessage({ kind: 'getPlaylists' })

    let select = $('#playlist-selector select')
    select.empty()

    playlists.forEach(p => {
        if (p.quicksave) {
            playlistId = p.id
        }

        let option = $('<option>', { value: p.id }).text(p.title).prop('selected', p.quicksave)
        select.append(option)
    })

    select.change(async () => {
        let optionSelected = $('option:selected', select)
        playlistId = select.val()

        let message = {
            kind: 'playlistSelect',
            playlistId: playlistId
        }

        await chrome.runtime.sendMessage(message)
        console.log(`selected ${optionSelected.text()}`)
    })
}

async function makeLogAndQuicksaveCount() {
    let data = await chrome.runtime.sendMessage({ kind: 'getLogAndQuicksaveCount' })
    let log = data.log
    let quicksaveCount = data.quicksaveCount

    this.makeLog(log) // intentionally no await
    this.makeQuicksaveCount(quicksaveCount) // intentionally no await
}

async function makeQuicksaveButton() {
    let quicksaveDisabled = await chrome.runtime.sendMessage({ kind: 'getQuicksaveDisabled' })
    console.log('quicksaveDisabled ', quicksaveDisabled)
    $('#quicksave').prop('disabled', quicksaveDisabled)
}

async function makeButtons() {
    let availability = await chrome.runtime.sendMessage({ kind: 'getActionAvailability' })

    if (!availability.copyAvailable) {
        $('#copy-playlist').css('display', 'none')
    }

    if (!availability.pasteAvailable) {
        $('#paste-playlist').css('display', 'none')
    }

    if (!availability.deduplicateAvailable) {
        $('#deduplicate-playlist').css('display', 'none')
    }
}

async function makeLog(log) {
    let shouldShowLog = await chrome.runtime.sendMessage({ kind: 'getShouldShowLog' })

    let container = $('#quicksave-log')
    let textarea = $('<textarea>', { rows: 10 }).prop('readonly', true).text(log)

    container.append(textarea)
    scrollToBottom(textarea)

    if (shouldShowLog) {
        toggleLog(false)
    }
}

async function makeQuicksaveCount(quicksaveCount) {
    $('#quicksave-count').text(quicksaveCount)
}

// --- HANDLER METHODS --------------------------------------

function setupListeners() {
    $(document).click(handleDocumentClicked)
    $('#quicksave').click(handleQuicksaveButtonClicked)
    $('#open-playlist').click(handleOpenPlaylistButtonClicked)
    $('#developer-action').click(handleDeveloperActionButtonClicked)
    $('#copy-playlist').click(handleCopyPlaylistButtonClicked)
    $('#paste-playlist').click(handlePastePlaylistButtonClicked)
    $('#refresh-playlists').click(handleRefreshPlaylistsButtonClicked)
    $('#deduplicate-playlist').click(handleDeduplicatePlaylistButtonClicked)
    $('#change-shortcuts').click(handleChangeShortcutsButtonClicked)
    $('#toggle-log').click(handleToggleLogButtonClicked)
    $('#sign-out').click(handleSignOutButtonClicked)

    chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
        handleMessage(message).then(sendResponse)
        return true // return true to indicate we want to send a response asynchronously
    })
}

async function handleMessage(message) {
    switch (message.kind) {
        case 'newLogAvailable':
            refreshLogAndQuicksaveCount() // intentionally no await
            break
        case 'newPlaylistsAvailable':
            refreshPlaylists() // intentionally no await
            break
    }
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
    chrome.runtime.sendMessage({ kind: 'quicksave' }) // intentionally no await
}

function handleOpenPlaylistButtonClicked() {
    let playlistUrl = `https://www.youtube.com/playlist?list=${playlistId}`
    window.open(playlistUrl)
}

function handleDeveloperActionButtonClicked() {
    openMenuItem(() => {
        chrome.runtime.sendMessage({ kind: 'developerAction' }) // intentionally no await
    })
}

function handleCopyPlaylistButtonClicked() {
    openMenuItem(() => {
        chrome.runtime.sendMessage({ kind: 'copyPlaylist' }) // intentionally no await
    })
}

function handlePastePlaylistButtonClicked() {
    openMenuItem(() => {
        chrome.runtime.sendMessage({ kind: 'pastePlaylist' }) // intentionally no await
    })
}

function handleRefreshPlaylistsButtonClicked() {
    openMenuItem(() => {
        chrome.runtime.sendMessage({ kind: 'refreshPlaylists' }) // intentionally no await
    })
}

function handleDeduplicatePlaylistButtonClicked() {
    openMenuItem(() => {
        chrome.runtime.sendMessage({ kind: 'deduplicatePlaylist' }) // intentionally no await
    })
}

function handleChangeShortcutsButtonClicked() {
    let shortcutsUrl = 'chrome://extensions/shortcuts'
    chrome.tabs.create({ url: shortcutsUrl }) // intentionally no await
}

function handleToggleLogButtonClicked() {
    openMenuItem(() => {
        toggleLog()

        let message = {
            kind: 'setShouldShowLog',
            shouldShowLog: logShown
        }

        chrome.runtime.sendMessage(message) // intentionally no await
    })
}

async function handleSignOutButtonClicked() {
    chrome.runtime.sendMessage({ kind: 'signOut' }) // intentionally no await
    window.close()
}

// --- MISC METHODS -----------------------------------------

async function refreshLogAndQuicksaveCount() {
    let data = await chrome.runtime.sendMessage({ kind: 'getLogAndQuicksaveCount' })
    let log = data.log
    let quicksaveCount = data.quicksaveCount

    let textarea = $('#quicksave-log textarea')
    textarea.text(log)
    scrollToBottom(textarea)

    $('#quicksave-count').text(quicksaveCount)
}

async function refreshPlaylists() {
    await makePlaylistSelector()
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

function openMenuItem(itemFunction) {
    itemFunction()
    closeMenuWithoutAnimation()
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

function scrollToBottom(textarea) {
    textarea.scrollTop(textarea[0].scrollHeight)
}

function sleep(duration) {
    return new Promise(resolve => setTimeout(resolve, duration))
}
