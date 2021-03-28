const express = require("express");
const cors = require("cors");
require("dotenv").config();
console.log(process.env.DB_PASS);

const port = 4000;

const app = express();
app.use(cors());
app.use(express.json());
const MongoClient = require("mongodb").MongoClient;
const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.ko38m.mongodb.net/burjAlArabDatabase?retryWrites=true&w=majority`;

const admin = require("firebase-admin");

const serviceAccount = require("./configs/burj-al-arab-d690c-firebase-adminsdk-xael5-5e9492890d.json");

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
});

const { restart } = require("nodemon");
const client = new MongoClient(
  uri,
  { useUnifiedTopology: true },
  { useNewUrlParser: true },
  { connectTimeoutMS: 30000 },
  { keepAlive: 1 }
);

// * const mongoPass = "daiyan1234";

client.connect((err) => {
  const bookings = client.db("burjAlArabDatabase").collection("bookings");
  console.log("db connection success");

  app.post("/addBooking", (req, res) => {
    const newBooking = req.body;
    bookings.insertOne(newBooking).then((result) => {
      res.send(result.insertedCount > 0);
    });
    console.log(newBooking);
  });

  app.get("/bookings", (req, res) => {
    const bearer = req.headers.authorization;
    if (bearer && bearer.startsWith("Bearer ")) {
      const idToken = bearer.split(" ")[1];
      console.log({ idToken });
      admin
        .auth()
        .verifyIdToken(idToken)
        .then((decodedToken) => {
          const tokenEmail = decodedToken.email;
          const queryEmail = req.query.email;
          if (tokenEmail == queryEmail) {
            bookings.find({ email: queryEmail }).toArray((err, documents) => {
              res.send(documents);
            });
          } else {
            res.status(401).send("Unauthorized access");
          }
        })
        .catch((error) => {
          res.status(401).send("Unauthorized access");
        });
    }
  });
});

app.listen(port, () => {
  console.log(`Listening at http://localhost:${port}`);
});
