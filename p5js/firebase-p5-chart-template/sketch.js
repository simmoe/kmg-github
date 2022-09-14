//vi skal bruge en variabel til at holde en kopi af data fra firebase, og en til at referere det chart vi opretter
let data, chart

function setup() {
//     UNCOMMENT THIS TO GET DATA FROM FIREBASE
//     db.collection("collection-name").doc("doc-name")
//     .onSnapshot( doc => {
//         console.log(doc.data())
//         showChart(doc.data())
//     })

//      UNCOMMENT THIS TO TRACK ANALYTICS PARAMETERS
//      analytics.logEvent('trigger_name', { label_name: 'a user just fired the trigger_name dimension'});
 
}

function showChart(data){
    //der dannes et nyt chart hver gang der kommer nye data i firebaser, derfor skal det gamle slettes først
    chart && chart.destroy()
    //charts dannes i et <canvas> element med id='myChart' - se index.html 
    chart = new Chart(document.getElementById('myChart'), {
        // bar | doughnut | line m.fl - se flere på https://www.chartjs.org/docs/latest/charts/line.html
        type: 'polarArea',
        data: {
            //Labes hentes fra firebase KEYS
            labels: Object.keys(data),
            datasets: [{
                //data hentes fra firebase VALUES
                data: Object.values(data),
                //der skal være ligeså mange farver som der er KEYS/VALUES
                backgroundColor: [
                    'rgba(255, 99, 132, 0.9)',
                    'rgba(54, 162, 235, 0.9)',
                    'rgba(255, 206, 86, 0.9)',
                    ],
                }]
            },
        });
    }

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


