var setupFileSaver = function($state){
    //TODO: Get content type auto
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

    var generateFilename = function(file){
        var patterns = $filenamePattern.val().split(',')
        var filename = []
        var ext = $contentType.val()
        if (ext == 'original') ext = getFileType(file)

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
                    fragment = file.name.split('.').slice(0, -1).join('.')
                    break
            }
            if(fragment) filename.push(fragment)
        }
        return filename.join('-') + '.' + ext
    }
    var charset = ';charset=' + document.characterSet
    var charsets = {
        json: {type: 'application/json' + charset},
        txt: {type: 'text/plain' + charset},
        nl: {type: 'text/plain' + charset},
        csv: {type: 'text/csv' + charset}
    }
    var getFileType = function(file){
        return file.type.split('/').pop()
    }
    var filesaverState = $state.get('filesaver', {})
    window.$filenamePattern = $filenamePattern
    if (filesaverState.pattern) $filenamePattern.importTags(filesaverState.pattern)
    if (filesaverState.content) $contentType.val(filesaverState.content)

    return {
        capture: function(){
            return {
                pattern: $filenamePattern.val(),
                content: $contentType.val()
            }
        },
        saveFile: function(file, content){
            var charset = ';charset=' + document.characterSet
            var charsets = {
                json: {type: 'application/json' + charset},
                txt: {type: 'text/plain' + charset},
                csv: {type: 'text/csv' + charset}
            }

            var filename = generateFilename(file)
            var result = null
            if (content instanceof Blob){
                result = content
            } else {
                var contentType = $contentType.val()
                if(contentType == 'original') contentType = getFileType(file)
                switch(contentType){
                    case 'json':
                        result = JSON.stringify(content, null, 4)
                        break
                    case 'txt':
                        result = String(content)
                        break
                    case 'csv':
                        result = Papa.unparse(content)
                        break
                }
            }

            saveAs(new Blob([result], charsets[$contentType.val()]), filename)
        }
    }
}