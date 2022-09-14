let client 
let currentPage
let timer = 25
let points = 0
let interval

function setup(){
    currentPage = "#frontpage"

    select('#restart').mousePressed( ()=> shiftPage('#frontpage') )

    client = mqtt.connect('wss://mqtt.nextservices.dk')
    client.on('connect', () => {
        console.log('connected to nextservices.dk')
        
        client.subscribe('taptapServer')

        select('#frontpage').mousePressed( ()=>{
            toggleFullScreen()
            timer = 25
            points = 0
            client.publish('taptap', 'start')
            select('#timerHeader').html(timer)
            shiftPage('#timer')
            interval = setInterval( ()=>{
                timer--
                select('#timerHeader').html(timer)
                if(timer == 0){
                    client.publish('taptap', 'idle')
                    clearInterval(interval)
                    select('#pointsHeader').html('Du fik ' + points + ' point' )
                    shiftPage('#points')
                }
            }, 1000)
        } )

        client.on('message', (topic, message) => {
            console.log('Modtog besked: ' + message + ' på emnet: ' + topic)
            points++
        })
    })
}

function toggleFullScreen() {
    if (!document.fullscreenElement) {
        document.documentElement.requestFullscreen();
    }
  }


function shiftPage( newPage ){
    if(newPage != currentPage){
        select( newPage ).addClass('show')
        setTimeout(() => {
            select( currentPage ).removeClass('show')
            currentPage = newPage    
        }, 400)
    }
}

