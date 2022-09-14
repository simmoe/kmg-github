const express = require('express') 
const app = express()

app.use('/', express.static('public'))

app.get('/m5', (req, res) => {
    console.log('Serveren fik besøg fra en m5')
    console.log('Beskeden var: ' + req.query)
    res.send('velkommen til mit endpoint')
})

const server = app.listen(4000, ()=>{
    console.log('Server lytter på localhost:4000')
})

