function setup() {
 
}


//helper functions to move div's with class page 
function goRight(){
    position++
    selectAll('.page').map( e => e.style('transform', 'translateX(' + position * -100 + 'vw)') )
}

function getData(collection, doc){
    db.collection(collection).doc(doc)
    .onSnapshot( doc => {
        console.log(doc.data())
        showChart(doc.data())
    })
}

    //  UNCOMMENT THIS TO TRACK ANALYTICS PARAMETERS
    //  analytics.logEvent('trigger_name', { label_name: 'a user just fired the trigger_name dimension'});


function addData(collection, doc, data){
    // Add a new document in collection "cities"
    db.collection(collection).doc(doc).set(data)
    .then(() => {
        console.log("Document successfully written!")
    })
    .catch((error) => {
        console.error("Error writing document: ", error)
    });
}


