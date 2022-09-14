//setup er den funktion der kører, før selve web-appen går starter 
function setup() {
  //når der bliver klikket på knappen med id='send'
  select('#send').mousePressed(()=>{
    //bruges metoden fetch til at lave et http request
    fetch('https://projectlightcube.elev.nextkbh.dk/listener.php?hvem="peter sukkertop"&hvad="der er ugler i mosen"', 
      {
        method:'POST', 
        mode:'no-cors',
      })
    .then( res => {
      //når requestet er lavet, fortæller serveren tilbage om det blev godkendt
      console.log(res)
    })
  })
}

