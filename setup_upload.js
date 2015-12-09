var saveFile = function(result){

    var charset = ';charset=' + document.characterSet
    var charsets = {
        json: {type: 'application/json' + charset},
        txt: {type: 'text/plain' + charset},
        csv: {type: 'text/csv' + charset}
    }

    var content = result.content
    switch(result.type){
        case 'json':
            content = JSON.stringify(content, null, 4)
            break
        case 'txt':
            content = String(content)
            break
        case 'csv':
            content = Papa.unparse(content)
            break
    }
    saveAs(new Blob([content], charsets[result.type]), result.filename)
}

var setupUpload = function setupUpload(transformer, $state){

    var $viewReady = $('.views.ready')
    var $fileInfo = $('#file-info')
    var dropMessage = 'DDDROP THE FILES!'
    var originalTxt = $fileInfo.text()
    var $uploadMenu = $('.upload-file > .menu')
    var $sourceFilesTable = $('#source-files-table')
    var $resultFilesTable = $('#result-files-table')
    var files = null
    var $welcomeMessage = $('#welcome-message')
    var ALLOWED_TAGS  = [ 'p', 'a', 'abbr', 'acronym', 'b', 'blockquote', 'code', 'em', 'i', 'li', 'ol', 'strong', 'ul']
    var $processingModes = $('.processing-mode')
    var $readyModes = $('.ready-mode')
    var worker = null

    var setWelcomeMessage = function setWelcomeMessage(msg){
        if(!msg) msg = ''
        msg = DOMPurify.sanitize(markdown.toHTML(msg), ALLOWED_TAGS)
        $welcomeMessage.html(msg)
        if (!$welcomeMessage.text().trim()){
            $welcomeMessage.addClass('invisible')
            return
        } else $welcomeMessage.removeClass('invisible')
    }

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
        $processingModes.hide()
        $readyModes.show()
    })
    $(document).on('click', 'input.process', function(){
        PubSub.publish('file.process')
    })

    var progressSettings = {
        color: '#FCB03C',
        strokeWidth: 5,
        trailWidth: 5,
        duration: 300,
        text: {value: '0', style: {color: 'black'}},
        step: function(state, inst){
            inst.setText((inst.value() * 100).toFixed(0) + '%');
        }
    }
    var ResultList = function(){
        this.results = {}
    }
    ResultList.prototype.add = function(r){

        this.results[r.id] = r
        if(!$resultFilesTable.data('list')){
            $resultFilesTable.html(`
            <thead>
                <tr>
                    <th>Name</th>
                    <th>Process</th>
                </tr>
                <tbody></tbody>
            </thead>
            `).data('list', true)
        }

        $resultFilesTable.children('tbody').append(`
            <tr id="${r.id}">
                <td>${r.filename}</td>
                <td class="action"> .. </td>
            </tr>
        `)
        this.results[r.id].elem = $('#' + r.id)
    }
    ResultList.prototype.append = function append(id, item, progress){
        var r = this.results[id]
        var $elem = r.elem
        var $action = $elem.children('.action')
        var $progress = r.progress
        var self = this
        if(!$progress){
            $action.empty()
            $progress = r.progress = new ProgressBar.Line($action[0], progressSettings)
            r.content = []
        }

        r.content.push(item)
        $progress.animate(progress)
        if(progress >= 1) {
            setTimeout(function(){
                self.finish(id)
            }, 300)
        }
    }

    ResultList.prototype.set = function(id, content){
        this.results[id].content = content
        this.finish(id)
    }

    ResultList.prototype.finish = function(id){
        var r = this.results[id]
        var $button = $(`<input class="download" type="button" value="DOWNLOAD" />`)
        r.elem.children('.action').html($button)
        $button.click(function(){
            saveFile(r)
        })
    }

    var process = function process(){

        var transformerState = transformer.capture()
        var workerScript = $('#worker').text().trim().replace('{{transformer}}', transformerState.transformer)
        var blob = new Blob([workerScript])
        if(worker) worker.terminate()
        var rl = new ResultList()
        worker  = window.worker = new Worker(window.URL.createObjectURL(blob));
        worker.onerror = function(e){
            console.error(e)
        }

        worker.onmessage = function(e) {
            var data = e.data
            switch(data.cmd) {
                case 'append':
                    rl.append(data.id, data.item, data.progress)
                    break
                case 'set': //full on result
                    rl.set(data.id, data.result)
                    break
                case 'result'://a new result is created
                    rl.add({
                        id: data.id,
                        filename: data.filename,
                        type: data.type
                    })
                    break
            }

        }
        worker.postMessage({cmd: 'run', files: files, options: {
            auto: transformerState.auto
        }})
    }

    var setFiles = function setFiles(uploadedFiles){
        files = uploadedFiles
        PubSub.publish('files.set', files)
        $uploadMenu.css('visibility', 'visible')
        $processingModes.show()
        $readyModes.hide()
        $resultFilesTable.html('No results yet.')
        var tmpls = []
        for(var i = 0; i < files.length; i++){
            var file = files[i]
            //console.log('FILE: ', file)
            tmpls.push(`
                <tr id="file-${i}">
                    <td>${file.name}</td>
                    <td>${byteCount(file.size)}</td>
                </tr>
            `)
        }
        $sourceFilesTable.children('tbody').html(tmpls.join(' '))
    }

    //setFiles([{name: 'first.json', size: 130}, {name: 'second.json', size: 4400}])
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

    PubSub.subscribe('transformer.run', function(path){
        process()
    })

    PubSub.subscribe('file.welcome', function(path, welcomeMessage){
        setWelcomeMessage(welcomeMessage)
    })

    setWelcomeMessage($state.get('transformer.welcome', null))
}