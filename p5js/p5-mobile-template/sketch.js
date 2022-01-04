let currentPage = '#splash'

function setup(){

}

function shift (newPage) {
    select(newPage).addClass('show')
    select(currentPage).removeClass('show')
    currentPage = newPage
}    

function keyPressed(key) {
    if (key.key == 1) shift('#splash')
    if (key.key == 2) shift('#names')
    if (key.key == 3) shift('#task')
  }