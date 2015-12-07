var saveState = function saveState(){

}
var runTransform = function runTransform(){

}

var setupUpload = function setupUpload(){
    var $viewReady = $('.views.ready')
    var $fileInfo = $('#file-info')
    var dropMessage = 'DDDROP THE FILES!'
    var originalTxt = $fileInfo.text()
    var $uploadMenu = $('.upload-file > .menu')
    var $fileList = $('#file-list')
    var files = null
    var byteCount = function byteCount (bytes, unit) {
        if (bytes < (unit = unit || 1000))
            return bytes + " B";
        var exp = Math.floor (Math.log (bytes) / Math.log (unit));
        var pre = ' ' +(unit === 1000 ? "kMGTPE" : "KMGTPE").charAt (exp - 1) + (unit === 1000 ? "" : "i") + 'B';
        return (bytes / Math.pow (unit, exp)).toFixed (1) + pre;
    }
    $(document).on('click', '.clear-files', function(){
        files = null
        $fileInfo.text(originalTxt).show()
        $uploadMenu.css('visibility', 'hidden')
        $fileList.hide()
    })

    $(document).on('click', '.process-button', function(){

    })

    var setFiles = function setFiles(uploadedFiles){
        files = uploadedFiles
        $uploadMenu.css('visibility', 'visible')
        $fileInfo.hide()
        $fileList.show()
        var tmpls = []
        for(var i = 0; i < files.length; i++){
            var file = files[i]
            console.log(file)
            tmpls.push(`
                <tr>
                    <td>${file.name}</td>
                    <td>${byteCount(file.size)}</td>
                    <td>
                        <input data-idx="${i}" class="process-button" type="button" value="PROCESS" />
                    </td>
                </tr>
            `)
        }
        $fileList.children('tbody').html(tmpls.join(' '))
    }
    
    setFiles([{name: 'first.json', size: 130}, {name: 'second.json', size: 4400}])
    $viewReady.on('dragenter', function(e){
        $fileInfo.text(dropMessage)
        e.preventDefault()
    }).on('dragover', function(e){
        e.preventDefault()
    }).on('dragleave', function(){
        $fileInfo.text(originalTxt)
    }).on('drop', function(e){
        e.stopPropagation();
        e.preventDefault();
        var files = e.originalEvent.dataTransfer.files
        setFiles(files)
    })
}

var setupFileSaver = function(){
    var $filenamePattern = $("#filename-pattern")
    var $autoSave = $('#autosave')
    var $contentType = $('#content-type')
    var content = null
    var limit = 4
    var counter = 1
    var inputFilename = ''
    var tooltips = {
        $timestamp: 'UNIX timestamp',
        $original: 'original filename',
        $counter: 'a counter, starting from 1, resets every run',
        $uuid: 'universally unique identifier'
    }
    $filenamePattern.tagsInput({
        defaultText: 'add fragment',
        maxChars: 10,
        onAddTag: function(tag){
            var tags = $filenamePattern.val().split(',')
            if(tags.length > limit){
                $filenamePattern.importTags(tags.slice(0, limit).join(','))
            }
            return false
        }
    });
    $('#select-tag').tagsInput({
        interactive: false
    })

    $('#select-tag_tagsinput .tag').click(function(e){
        $filenamePattern.addTag($(this).children('span').text().split(' ')[0].trim())
        return false
    }).each(function(){
        var key = $(this).children('span').text().trim()
        $(this).attr('title', tooltips[key])
    })

    var isAutoSave = function(){
        return $autoSave.is(':checked')
    }
    var generateUUID = function guid() {
        function s4() {
            return Math.floor((1 + Math.random()) * 0x10000)
                .toString(16)
                .substring(1);
        }
        return s4() + s4() + '-' + s4() + '-' + s4() + '-' +
            s4() + '-' + s4() + s4() + s4();
    }
    var generateTimestamp = function(){ return Math.floor(Date.now() / 1000)}
    var generateCounter = function(){ return String(counter++)}

    var generateFilename = function(){
        var patterns = $filenamePattern.val().split(',')
        var filename = []
        for(var i = 0; i < patterns.length; i++){
            var fragment = null;
            switch(patterns[i]){
                case '$uuid':
                    fragment = generateUUID()
                    break
                case '$timestamp':
                    fragment = generateTimestamp()
                    break
                case '$counter':
                    fragment = generateCounter()
                    break
                case '$original':
                    fragment = inputFilename
                    break
            }
            if(fragment) filename.push(fragment)
        }
        return filename.join('-') + '.' + $contentType.val()
    }

    var toCsvValue = function toCsvValue(theValue, sDelimiter) {
        var t = typeof (theValue), output;

        if (typeof (sDelimiter) === "undefined" || sDelimiter === null) {
            sDelimiter = '"';
        }

        if (t === "undefined" || t === null) {
            output = "";
        } else if (t === "string") {
            output = sDelimiter + theValue + sDelimiter;
        } else {
            output = String(theValue);
        }

        return output;
    }

    var toCSV = function toCsv(objArray, sDelimiter, cDelimiter) {
        var i, l, names = [], name, value, obj, row, output = "", n, nl;

        // Initialize default parameters.
        if (typeof (sDelimiter) === "undefined" || sDelimiter === null) {
            sDelimiter = '"';
        }
        if (typeof (cDelimiter) === "undefined" || cDelimiter === null) {
            cDelimiter = ",";
        }

        for (i = 0, l = objArray.length; i < l; i += 1) {
            // Get the names of the properties.
            obj = objArray[i];
            row = "";
            if (i === 0) {
                // Loop through the names
                for (name in obj) {
                    if (obj.hasOwnProperty(name)) {
                        names.push(name);
                        row += [sDelimiter, name, sDelimiter, cDelimiter].join("");
                    }
                }
                row = row.substring(0, row.length - 1);
                output += row;
            }

            output += "\n";
            row = "";
            for (n = 0, nl = names.length; n < nl; n += 1) {
                name = names[n];
                value = obj[name];
                if (n > 0) {
                    row += cDelimiter
                }
                row += toCsvValue(value, '"');
            }
            output += row;
        }

        return output;
    }
    var charset = ';charset=' + document.characterSet
    var charsets = {
        json: {type: 'application/json' + charset},
        txt: {type: 'text/plain' + charset},
        nl: {type: 'text/plain' + charset},
        csv: {type: 'text/csv' + charset}
    }

    var saveFile  = function(){
        var filename = generateFilename()
        var type = null
        var result = null
        if (content instanceof Blob){
            result = content
        } else {
            switch($contentType.val()){
                case 'json':
                    result = JSON.stringify(content, null, 4)
                    break
                case 'txt':
                    result = String(content)
                    break
                case 'csv':
                    result = toCSV(content)
                    break
            }
        }
        saveAs(new Blob([result], charsets[$contentType.val()]), filename)
    }
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
        switch(this.params['sub']){
            case 'logic':

                break
        }
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
var setupEditor = function(){
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
    editor.addKeyMap(map);
    return editor
}

$(document).ready(function(){
    UnoPico.ready(function($statev1){
        setupFileSaver()
        setupEditor()
        setupUpload()
        setupRouting()
    })
})