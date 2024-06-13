const express = require("express")
const cookieParser = require('cookie-parser')
const session = require('express-session');
const nocache = require('nocache')
const bodyParser = require("body-parser")
const app = express()

app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());

//configuration - session
app.use(session({
  secret: 'your_secret_key', 
  resave: false, 
  saveUninitialized: false, 
  cookie: { secure: false } 
}));


//mongodb connecting
require("dotenv").config()
const mongoose = require("mongoose")
mongoose.connect(process.env.DATABASE_URL)
.then(()=>{
    console.log("connection succesfull")
})
.catch((err)=>{
    console.log(err)
})

app.use(nocache())

// parsing every requests
app.use(express.json())
app.use(express.urlencoded({extended:true}))
app.use(cookieParser())


app.set('view engine','ejs')
app.set('views',"./views")


app.use(express.static('public'))

app.use('/util', express.static('util'));

////! user route
const userRoute = require('./routes/userRoute')
app.use('/',userRoute)

////! admin route
const adminRoute = require('./routes/adminRoute');
app.use('/admin',adminRoute)


const port = 3000;



app.listen(port,(req,res)=>{
    console.log(`http://localhost:${port}`)
})