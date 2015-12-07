var setupUpload = function setupUpload(filesaver, transformer){
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
        var idx = $(this).data('idx')
        var file = files[idx]

        var transformerState = transformer.capture()
        var workerScript = $('#worker').text().trim().replace('{{transformer}}', transformerState.transformer)
        var blob = new Blob([workerScript])
        var worker = new Worker(window.URL.createObjectURL(blob));
        worker.onmessage = function(e) {
            console.log("Received: ", e.data)
        }
        worker.postMessage({cmd: 'run', file: file, options: {
            auto: transformerState.auto
        }})
    })

    var setFiles = function setFiles(uploadedFiles){
        files = uploadedFiles
        $uploadMenu.css('visibility', 'visible')
        $fileInfo.hide()
        $fileList.show()
        var tmpls = []
        for(var i = 0; i < files.length; i++){
            var file = files[i]
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
}