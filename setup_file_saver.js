var setupFileSaver = function(){
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
    return {
        capture: function(){
            return {
                autosave: isAutoSave(),
                pattern: $filenamePattern.val(),
                content: $contentType.val()
            }
        },
        generateFilename: function(file){

        }
    }
}