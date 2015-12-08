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
    $(document).on('click', '.process-all', function(){
        $('.process-button').click()
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

    $(document).on('click', '.process-button', function(){
        var idx = $(this).data('idx')
        var file = files[idx]
        var result = []
        var transformerState = transformer.capture()
        var fileSaverState = filesaver.capture()
        var workerScript = $('#worker').text().trim().replace('{{transformer}}', transformerState.transformer)
        var blob = new Blob([workerScript])
        var worker = new Worker(window.URL.createObjectURL(blob));
        var $process = $('#file-' + idx + ' > .process')
        var progress = null
        var done = function(result){
            if(fileSaverState.autosave) {
                filesaver.saveFile(file, result)
            } else {
                var $button = $(`<input class="download" type="button" value="DOWNLOAD" />`)
                $process.empty().append($button)
                $button.click(function(){
                    filesaver.saveFile(file, result)
                })
            }
        }

        worker.onmessage = function(e) {
            var data = e.data
            switch(data.cmd) {
                case 'step':
                    result.push(data.data)
                    var step = data.step + 1
                    if(step == 1){ //create the process
                        var $cont = $('<div class="progress"></div>')
                        $process.empty().append($cont)
                        progress = new ProgressBar.Line($cont[0], progressSettings)
                    } else if (step < data.total) { //indicate progress
                        progress.animate(data.step/data.total)
                    } else { //done
                        console.log('DONE: ', data, result)
                        progress.animate(data.step/data.total)
                        done(result)
                    }
                    break
                case 'info':
                    $process.text(data.msg)
                    break
                case 'done':
                    done(data.result)
                    break
            }

        }
        worker.postMessage({cmd: 'run', file: file, options: {
            auto: transformerState.auto
        }})
    })
    var createProcessButton = function(idx){
        return `<input data-idx="${idx}" class="process-button" type="button" value="PROCESS" />`
    }
    var setFiles = function setFiles(uploadedFiles){
        files = uploadedFiles
        $uploadMenu.css('visibility', 'visible')
        $fileInfo.hide()
        $fileList.show()
        var tmpls = []
        for(var i = 0; i < files.length; i++){
            var file = files[i]
            //console.log('FILE: ', file)
            tmpls.push(`
                <tr id="file-${i}">
                    <td>${file.name}</td>
                    <td>${byteCount(file.size)}</td>
                    <td class="process">
                        ${createProcessButton(i)}
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