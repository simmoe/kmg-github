//Firebase interaktion med p5.js 
//Sæt dine konfigurationer i firebase.js
//Fetch collection med fetchCollection (collectionName)
//Opret nye dokumenter med createDocument (collectionName, data, [docID])
//Opdater dokumenter med updateDocument (collectionName, updatedData, docId)

//variabel til at holde hele din collection
let collectionModel

function setup(){
    // Call the function to fetch data
    fetchCollection("collection name").then( d => {
        collectionModel = d
        console.log(collectionModel)
        //change properties
        collectionModel['Mandag']['transport'] = 32
        //update or create docs 
        //createDocument('collection name', collectionModel['Mandag'], 'Tirsdag')
        //updateDocument('collection name', collectionModel['Mandag'], 'Mandag')
    })

}

