function main() {
    const shareButton = $('ytd-segmented-like-dislike-button-renderer').eq(0).next().children().eq(0).children().eq(0)
    shareButton.click()
}

$(window).on('load', function() {
    setTimeout(main, 1000)
})
