let currentPage = 1
let pages //array med alle elementer med class = page 
//dice er currentpage fra MQTT
let dice = 0
let diceActive = false
let debug = false 

function setup(){
    console.log('P5.js er loaded')

    //toggle debug
    select('#debug').hide()

    //add overlay 
    select("#page" + currentPage).child(select('#shadowbox').elt)
    select("#page" + currentPage).child(select('#shadowboxToo').elt)

    pages = selectAll('.page')
    //nu kan man se at pages er blevet til en liste med alle class = page ting
    console.log(pages.length)

    client = mqtt.connect('wss://mqtt.nextservices.dk');
    client.subscribe('polyhedron')
    client.subscribe('polyhedron_debug')
  
    client.on('message', function (topic, message) {
        if(topic=="polyhedron"){
            let data = JSON.parse(message)
            console.log('Received MQTT dice number: ' + data.dice)
            dice = data.dice 
            shiftPage(dice)
        }else{
            select('#debug').html(message.toString())
        }
    })  
}

function shiftPage(num){
    if(num == "ArrowLeft"){
        num = currentPage - 1
    }
    if(num == "ArrowRight"){
        num = currentPage + 1
    }

    if(isNaN(num) || num > pages.length || num == 0){
        return
    }
    select("#page" + currentPage).removeClass('visible')
    currentPage = num
    //prepare content 
    let c = select("#page" + currentPage)
    //add overlay 
    c.child(select('#shadowbox').elt)
    c.child(select('#shadowboxToo').elt)

    let elements = c.elt.children
    for(e of elements){
        if(e.classList.contains('vid')){
            e.muted = true
            e.loop = true
            e.play() 
        }
    }
    c.addClass('visible')
}

function keyPressed(){
    console.log(key)
    if(key=="Enter"){
        let fs = fullscreen();
        fullscreen(!fs);
    }else if(key=='d'){
        debug = !debug
        debug ? select('#debug').show() : select('#debug').hide() 
    }else if(key=='a'){
        diceActive = !diceActive 
        diceActive ? client.publish('polyhedron_activate', 'activate') : client.publish('polyhedron_activate', 'deactivate') 
    }else{
        shiftPage(key)
    }
}


