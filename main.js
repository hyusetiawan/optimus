var saveState = function saveState(){

}
var runTransform = function runTransform(){

}



var setupRouting = function setupRouting(){
    var selectedClass = 'current-menu-item'
    var onEnter = function onEnter(){
        var view = window.location.hash.split('#')[1].split('/')
        var mainView = view[1]
        var subView = view[2]
        //console.log('VIEW: ', mainView, subView)
        $('.page-level .' + selectedClass).removeClass(selectedClass)
        $('.page-level a[href="#/'+mainView+'"]').closest('li').addClass(selectedClass)

        var shownView = $('.views').addClass('invisible').filter('.' + mainView).removeClass('invisible')
        var showURL = window.location.hash
        if(!subView){
            subView = shownView.find('.primary_nav_wrap li:first-child a').attr('href')
            showURL = subView
            if (subView) subView = subView.split('/').pop()

        }
        shownView.children('.subviews').addClass('invisible').filter('.' + subView).removeClass('invisible')
        shownView.find('.' + selectedClass).removeClass(selectedClass)
        shownView.find('a[href="'+showURL+'"]').closest('li').addClass(selectedClass)
        $(document.body).css('visibility', 'visible')
    }


    Path.map("#/edit(/:sub)").to(function(){
        //switch(this.params['sub']){
        //
        //}
    }).enter(onEnter)

    Path.map("#/ready").to(function(){
        console.log('welcome to ready')
    }).enter(onEnter)

    Path.map("#/welcome").to(function(){
        console.log('welcome to welcome')
    }).enter(onEnter)

    Path.map("#/about").to(function(){
        console.log('welcome to about')
    }).enter(onEnter)

    Path.map("#/help").to(function(){
        console.log('welcome to help')
    }).enter(onEnter)

    Path.root('#/about')
    $('[title]').tooltipster({
        theme: 'tooltipster-light',
        contentAsHTML: true,
        delay: 300
    });
    Path.listen()
}
var setupTransformer = function(state){
    var editor = CodeMirror.fromTextArea(document.getElementById('transformer'), {
        lineNumbers: true,
        //theme: 'monokai',
        matchBrackets: true,
        autoCloseBrackets: true,
        autoCloseTags: true,
        undoDepth: 999999,
        autofocus: true,
        tabSize: 2,
        mode: 'javascript'
    })
    var baseURLTheme = 'https://cdnjs.cloudflare.com/ajax/libs/codemirror/5.8.0/theme/'
    var $theme = $('#theme')

    var setTheme = function(theme){
        theme = theme.trim()
        $('<link href="'+(baseURLTheme+theme+'.min.css')+'" rel="stylesheet" type="text/css" />').appendTo(document.head)
        $theme.children('option').filter(':contains('+theme+')').attr('selected', 'selected')
        editor.setOption('theme', theme)
    }
    $theme.change(function(){
        var theme = $(this).children("option").filter(":selected").text()
        setTheme(theme)
    })

    setTheme('monokai')
    var map = {}
    var hotkeyStart = navigator.platform.indexOf('Mac') > -1?'Cmd-':'Ctrl-'
    var runHotkey = hotkeyStart + 'E'
    var saveHotkey = hotkeyStart + 'S'
    $('.save-button').attr('title', $('.save-button').attr('title').replace('<hotkey>', saveHotkey))
    $('.run-button').attr('title', $('.run-button').attr('title').replace('<hotkey>', runHotkey))

    map[runHotkey] = runTransform
    map[hotkeyStart + 'S'] = saveState
    editor.addKeyMap(map)

    return {
        capture: function(){
            return {
                transformer: editor.getValue(),
                auto: $('#auto').val(),
                theme: $theme.children("option").filter(":selected").text()
            }
        }
    }
}

$(document).ready(function(){
    UnoPico.ready(function($statev1){
        var filesaver = setupFileSaver()
        var transformer = setupTransformer()

        setupUpload(filesaver, transformer)
        setupRouting()
    })
})