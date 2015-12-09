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
        //console.log('welcome to ready')
    }).enter(onEnter)

    Path.map("#/welcome").to(function(){
        //console.log('welcome to welcome')
    }).enter(onEnter)

    Path.map("#/about").to(function(){
        //console.log('welcome to about')
    }).enter(onEnter)

    Path.map("#/help").to(function(){
        //console.log('welcome to help')
    }).enter(onEnter)

    Path.root('#/about')
    $('[title]').tooltipster({
        theme: 'tooltipster-light',
        contentAsHTML: true,
        delay: 300
    });
    Path.listen()
}
var setupTransformer = function($state){
    var themes = ["default", "3024-day", "3024-night", "abcdef", "ambiance", "base16-dark", "base16-light", "bespin", "blackboard", "cobalt", "colorforth", "dracula", "eclipse", "elegant", "erlang-dark", "hopscotch", "icecoder", "isotope", "lesser-dark", "liquibyte", "material", "mbo", "mdn-like", "midnight", "monokai", "neat", "neo", "night", "paraiso-dark", "paraiso-light", "pastel-on-dark", "railscasts", "rubyblue", "seti", "solarized", "the-matrix", "tomorrow-night-bright", "tomorrow-night-eighties", "ttcn", "twilight", "vibrant-ink", "xq-dark", "xq-light", "yeti", "zenburn"]
    for(var i = 0; i < themes.length; i++) themes[i] = `<option value="${themes[i]}">${themes[i]}</option>`

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
    $theme.html(themes.join('\n'))
    var $devFileList = $('#dev-file-list')
    var welcomeMessage = null
    var $auto = $('#auto')
    var $welcomeMessageInput = $('#welcome-message-input')
    var setTheme = function(theme){
        theme = theme.trim()
        $('<link href="'+(baseURLTheme+theme+'.min.css')+'" rel="stylesheet" type="text/css" />').appendTo(document.head)
        $theme.children('option').filter(':contains('+theme+')').attr('selected', 'selected')
        editor.setOption('theme', theme)
    }
    $theme.change(function(){
        setTheme($(this).val())
    })

    $welcomeMessageInput.change(function(){
        welcomeMessage = $(this).val()
        PubSub.publish('file.welcome', welcomeMessage)
    })

    setTheme('monokai')
    var map = {}
    var hotkeyStart = navigator.platform.indexOf('Mac') > -1?'Cmd-':'Ctrl-'
    var runHotkey = hotkeyStart + 'E'
    var saveHotkey = hotkeyStart + 'S'
    $('.save-button').attr('title', $('.save-button').attr('title').replace('<hotkey>', saveHotkey))
    $('.run-button').attr('title', $('.run-button').attr('title').replace('<hotkey>', runHotkey))
    var runTransform = function(idx){PubSub.publish('transformer.run', idx)}
    var saveState = function(){PubSub.publish('state.save')}
    map[runHotkey] = runTransform
    map[hotkeyStart + 'S'] = saveState
    editor.addKeyMap(map)

    $(document).on('click','.save-button', function(e){
        PubSub.publish('state.save')
    })

    $(document).on('click','.run-button', function(e){
        runTransform($devFileList.val())
    })

    PubSub.subscribe('files.set', function(path, files){
        var options = []
        for(var i = 0; i < files.length; i++){
            var file = files[i]
            options.push(`<option value="${i}">${file.name}</option>`)
        }
        $devFileList.html(options.join(''))
    })

    PubSub.subscribe('transformer.run', function(path, idx){
        if(!idx){
            alert('Please select a file, and if you have not, also drop some files in Mode > Ready')
            return
        }

    })

    var transformerState = $state.get('transformer', {})
    if(transformerState.transformer) editor.setValue(transformerState.transformer)
    $auto.val(transformerState.auto?transformerState.auto:'')
    $theme.val(transformerState.theme?transformerState.theme: 'monokai')
    $welcomeMessageInput.val(transformerState.welcome)

    return {
        capture: function(){
            return {
                transformer: editor.getValue(),
                auto: $auto.val(),
                theme: $theme.val(),
                welcome: welcomeMessage
            }
        }
    }
}

$(document).ready(function(){
    UnoPico.ready(function($statev1){
        var filesaver = setupFileSaver($statev1)
        var transformer = setupTransformer($statev1)
        setupUpload(filesaver, transformer, $statev1)
        setupRouting()

        PubSub.subscribe('state.save', function(){
            $statev1.set({
                transformer: transformer.capture(),
                filesaver: filesaver.capture()
            })
        })

    })
})