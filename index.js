//jshint esversion: 9

//Node Module Configurations
const port = 5000;
const express = require('express');
const app = express();
const bodyParser = require('body-parser');
const lodash = require('lodash'); 
const cookieParser = require('cookie-parser');
const {
  MongoClient
} = require('mongodb');
app.use(cookieParser());
app.use('/public', express.static("public"));
app.set('view engine', 'ejs');
app.use(bodyParser.urlencoded({
  extended: true
}));


// Server Start

app.listen(port, () => {
  console.log("server started at port 5000");
});

//Additional Function Definitions

// MongoDB initializer function

const uri = "mongodb://localhost:27017";
// const uri = "mongodb+srv://nitraipur:SyntaxTerror@mentorfinder.zy2aosa.mongodb.net/?retryWrites=true&w=majority";
const client = new MongoClient(uri);
const db = client.db("Mentors");

async function run() {
  try {
    await client.connect();
    await client.db("Mentors").command({
      ping: 1
    });
    console.log("Connected successfully to server");

  } finally {
    // await client.close();
  }
}
run().catch(console.dir);

// GET paths

// General GET paths

// HOMEPAGE
app.get('/', (req, res) => {
  res.render('home');
});

// Error Page
// app.use(function(req, res, next) {
//   res.status(404).render('error');
// });

// Mentor Specific GET Paths

// Create Mentor Account
app.get("/mentor", (req, res) => {
  res.render('mentor');
});

//Finish Mentor Profile i.e. Adding more details
app.get("/expertise", (req, res) => {
  res.render('expertise', {
    allskills: []
  });
});

// Mentor Login Page
app.get('/login', (req, res) => {
  res.render('login');
});

//Mentor Dashboard
app.get('/dashboard', async (req, res) => {
  let query = req.cookies.id;
  console.log(query);
  let mentorData = await db.collection("Mentor").find({
    email: query
  }).toArray();
  console.log(mentorData);
  res.render('dashboard', {
    params: mentorData
  });
});

// Mentee Specific GET paths

app.get("/search", (req, res) => {
  res.render('search');
});

// Post Functions

//Mentor Specific POST Functions

//Create New Mentor Account

app.post("/mentor", async function(req, res) {
  const data = {
    name: req.body.name,
    email: req.body.email,
    password: req.body.password,
    skills: [],
    project1 : "",
    project2 : "",
    project3 : "",
    validated: false
  };
  console.log(req.body.repassword);
  console.log(req.body.password);
  if(req.body.repassword!==data.password || data.password===""){
      return res.render('alertRegistered', {
      url: "mentor",
      myMessage: "Password doesnot match or is empty!"
    });
  }
  // Duplicate Check
  var lookup = await db.collection("Mentor").countDocuments({
    email: req.body.email
  }, limit = 1);

  if (lookup == 0) {
    const result = await db.collection("Mentor").insertOne(data);
    console.log("Hi");
    res.cookie('id', req.body.email);
    console.log("Create Account Successful");
    return res.render('login');
  } else {
    console.log("failed");
    return res.render('alertRegistered', {
      url: "mentor",
      myMessage: "Account Already exists!"
    });
    
  }
});

// Finish Mentor Profile i.e. add details POST function

app.post('/submitSkills', async (req, res) => {
  let query = req.cookies.id;
  res.clearCookie('id');
  let skillArray = Object.values(req.body);
  for (var i = 0; i < 3; i++) {
    skillArray.pop();
  }
  skillArray.forEach((element, index, array) => {
    array[index] = (lodash.camelCase(element)).toLowerCase();
  });
  let project1 = req.body.project1;
  let project2 = req.body.project2;
  let project3 = req.body.project3;
  let cursor = await db.collection("Mentor").updateOne({
    email: query
  }, {
    $set: {
      skills: skillArray,
      project1: project1,
      project2: project2,
      project3: project3
    }
  });
  //On success
  res.render('alertRegistered', {
    url: "mentor",
    myMessage: "You have been registered successfully, wait for your verification!"
  });
});

//Mentor Login POST function
app.post('/login', async function(req, res) {
  var lookup = await db.collection("Mentor").countDocuments({
    email: req.body.email,
    password: req.body.password
  }, limit = 1);
  if (lookup == 0) {
    res.render('alertRegistered', {
      url: "login",
      myMessage: "Invalid email/password please try again!"
    });
  } else {
    res.cookie('id', req.body.email);
    console.log("login success cookie set");
    res.redirect('/dashboard');
  }
});

//Mentor Dashboard Post Function
// app.post('/dash2', async (req, res) =>{
//   res.redirect('/dashboard');
// });
app.post('/dashboard', async (req, res) => {
  console.log(1);
  let skillArray = Object.values(req.body);
  for (var i = 0; i < 3; i++) {
    skillArray.pop();
  }
  console.log(skillArray);
  for (let i = 0; i<skillArray.length; i++){
    skillArray[i] = lodash.camelCase(skillArray[i]).toLowerCase();
  }
  console.log(skillArray);
  let query = req.cookies.id;
  let mentorData = await db.collection('Mentor').find({
    email: query
  }).toArray();
  mentorData = mentorData[0]; 
  console.log(mentorData[0]);
  mentorData.project1 = req.body.project1;
  mentorData.project2 = req.body.project2;
  mentorData.project3 = req.body.project3;
  await db.collection('Mentor').updateOne({
    email: query
  }, {
    $set: {
      skills: skillArray,
      project1: mentorData.project1,
      project2: mentorData.project2,
      project3: mentorData.project3
    }
  });
  res.redirect('/dashboard');
});
// Mentee Specific post functions

// Search Mentor by Name or skills

app.post('/search', async (req, res) => {
  var search = req.body;
  // console.log(search);
  var mentors = await db.collection("Mentor").find({
    skills: req.body.skill
  }).toArray();
  // console.log(mentors); //logging the mathing mentors
  res.render('display', {
    mentors: mentors
  });
});
//I dont know what this is
// app.post('/registered', async function(req, res) {
//   let query = req.cookies['id'];
//   res.clearCookie('id');
//   let skills = (req.body.skills).toLowerCase();
//   //converting string to array for easy lookup
//
//   res.render('success');
// });
// app.get("/route/:variable", (req, res)=>{
//   let recieved_name = req.params.variable;
// });
// Discarded search method
// app.post("/search", async function(req, res) {
//   let searchItem = lodash.startCase(req.body.search);
//   //Search the name of the mentor or search for skills
//   let sch = await db.collection("Mentor").countDocuments({
//     name: searchItem
//   }, limit = 1);
//   if (sch != 0) {
//     //The user searched for name
//     let srch = await db.collection("Mentor").find({
//       name: searchItem
//     }).toArray();
//     console.log("This is not supporsed to happen" + srch);
//     res.render('searchResult', srch);
//   } else {
//     //The user searched for skills
//     //find the the matching mentors and add them into the array;
//     srch = await db.collection("Mentor").find().toArray();
//     console.log(srch);
//     var display = [];
//     srch.forEach((mentor) => {
//       if (mentor.skills != undefined) {
//         for (var i = 0; i < mentor.skills.length; i++) {
//           if (mentor.skills[i] == searchItem) {
//             display.push(mentor);
//           }
//         }
//       }
//     });
//     console.log(display);
//     res.render('searchResult', display);
//   }
// });
