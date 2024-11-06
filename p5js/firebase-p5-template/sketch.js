let col = 'Klima'
let doc = 'Mandag'
let docModel 

function setup() {
    //hent collection og doc
    db.collection(col).doc(doc)
    .onSnapshot( doc => {
        console.log('snapshot hentet', doc.data())
        docModel = doc.data()
        for (const property in docModel) {
            console.log(property, docModel[property]);
            let li = createElement('li', property + ': ' +  docModel[property])
            select('#data').child(li)
        }
    })

    createButton('get document')
    .mousePressed( function(){
        getData(col, doc)
            .then( ()=>{
                console.log(docModel)
            }
        )
    })
    .position(100, 100)

    createButton('set document')
    .mousePressed( function(){
        console.log(docModel)
        setData(col, doc, { 
            "Her": "er"
        })
    })
    .position(100, 150)
}

async function getData(collection, doc){
}

async function setData(collection, doc, data){
    // Add a new document in collection 
    db.collection(collection).doc(doc).set(data)
    .then(() => {
        console.log("Document successfully written!")
    })
    .catch((error) => {
        console.error("Error writing document: ", error)
    });
}