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
        if(!this.params.sub){
            window.location.hash = '/edit/transformer'
            return false
        }
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
    var runTransform = function(){

        PubSub.publish('transformer.run')
    }
    var saveState = function(){PubSub.publish('state.save')}
    var $setWelcomeMessage = $('#set-welcome-message')

    map[runHotkey] = runTransform
    map[saveHotkey] = saveState
    editor.addKeyMap(map)

    $(document).on('click','.save-button', function(e){
        PubSub.publish('state.save')
    })
    $(document).on('click','.run-button', runTransform)

    $setWelcomeMessage.magnificPopup({
        midClick: true,
        closeOnBgClick: true,
        showCloseBtn: false,
        enableEscapeKey: true,
        items:{
            src: '#welcome-message-input',
            type: 'inline'
        }
    })

    var transformerState = $state.get('transformer', {})
    if(transformerState.transformer) editor.setValue(transformerState.transformer)
    else {
        editor.setValue(`function transformer(files, contents){
  importScripts('https://cdnjs.cloudflare.com/ajax/libs/lodash.js/3.10.1/lodash.min.js') // if you would like to use other libraries
	// an example script that would just create a copy of the given file
  for(var i = 0; i < contents.length; i++){
    var file = files[i]
    var content = contents[i]
    var r = new Result(file.name) //create a result file, you can create multiple result files
    r.set(content)
    //PS: if the data is very large, use append() instead:
    /**
    for(var j = 0; j < content.length; j++){
        _.delay(function(r, content, progress){
            r.append(content, progress)
        }, (j + 1)* 500, r, content[j], (j + 1)/content.length ) //delayed for dramatic effects
    }
    */
  }
}`)
    }
    $auto.val(transformerState.auto?transformerState.auto:'auto')
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
        var transformer = setupTransformer($statev1)
        setupUpload(transformer, $statev1)
        setupRouting()

        PubSub.subscribe('state.save', function(){
            $statev1.set({
                transformer: transformer.capture()
            })
        })

    })
})