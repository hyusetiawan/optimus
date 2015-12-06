var selectedClass = 'current-menu-item'

function onEnter(){
    $('.' + selectedClass).removeClass(selectedClass)
    $('a[href="'+window.location.hash+'"]').closest('li').addClass(selectedClass)
    var view = window.location.hash.split('/').pop()
    $('.views').hide().filter('.' + view).show()
}

Path.map("#/edit").to(function(){
    console.log('welcome to edit')
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


Path.root('#/welcome')
Path.listen()