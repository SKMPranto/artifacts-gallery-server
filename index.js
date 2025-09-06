const express = require("express");
const cors = require("cors");
const app = express();
const port = process.env.PORT || 3000;
require("dotenv").config();
const { MongoClient, ServerApiVersion, ObjectId } = require("mongodb");

// Middleware
app.use(cors());
app.use(express.json());

// Database connection
const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster01.gad8k91.mongodb.net/?retryWrites=true&w=majority&appName=Cluster01`;

// Create a MongoClient with a MongoClientOptions object to set the Stable API version
const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  },
});

async function run() {
  try {
    // Connect the client to the server	(optional starting in v4.7)
    await client.connect();

    const artifactsCollection = client
      .db("artifactsDB")
      .collection("artifacts");

    // Define routes for CRUD operations

    // Create (POST)
    app.post("/artifacts", async (req, res) => {
      const newArtifact = req.body;
      const result = await artifactsCollection.insertOne(newArtifact);
      res.send(result);
    });

    // Read (GET)
    app.get("/artifacts", async (req, res) => {
      const email = req.query.email;
      const query = {};
      if (email) {
        query.email = email;
      }
      const artifacts = await artifactsCollection.find(query).toArray();
      res.send(artifacts);
    });

    // Read single artifact (GET)
    app.get("/artifacts/:id", async (req, res) => {
      const id = req.params.id;
      const query = { _id: new ObjectId(id) };
      const artifact = await artifactsCollection.findOne(query);
      res.send(artifact);
    });

    // Read Artifacts Added by user
    app.get("/artifacts/:email", async (req, res) => {
      const email = req.query.email;
      const query = { email: email };
      const artifacts = await artifactsCollection.find(query).toArray();
      res.send(artifacts);
    });

    //PUT Method for Update Artifacts
    app.put("/artifacts/:id", async (req, res) => {
      const id = req.params.id;
      const filter = { _id: new ObjectId(id) };
      const options = { upsert: true };
      const updateArtifact = req.body;
      const updateDoc = {
        $set: updateArtifact,
      };
      const result = await artifactsCollection.updateOne(
        filter,
        updateDoc,
        options
      );
      res.send(result);
    });

    // Send a ping to confirm a successful connection
    await client.db("admin").command({ ping: 1 });
    console.log(
      "Pinged your deployment. You successfully connected to MongoDB!"
    );
  } finally {
    // Ensures that the client will close when you finish/error
    // await client.close();
  }
}
run().catch(console.dir);

app.get("/", (req, res) => {
  res.send("Artifacts Gallery Server is connected");
});

// Start the server
app.listen(port, () => {
  console.log(`Artifacts Gallery Server is running on port ${port}`);
});
