const express = require("express");
const cors = require("cors");
require("dotenv").config();
const { MongoClient, ServerApiVersion, ObjectId } = require("mongodb");

const app = express();
const port = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());

// MongoDB connection
const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster01.gad8k91.mongodb.net/?retryWrites=true&w=majority&appName=Cluster01`;
const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  },
});

async function run() {
  try {
    await client.connect();
    const artifactsCollection = client
      .db("artifactsDB")
      .collection("artifacts");

    // // Create artifact
    app.post("/artifacts", async (req, res) => {
      const newPlant = req.body;
      const result = await artifactsCollection.insertOne(newPlant);
      res.send(result);
    });

    // Get all artifacts
    app.get("/artifacts", async (req, res) => {
      const email = req.query.email;
      const query = {};
      if (email) query.email = email;
      const artifacts = await artifactsCollection.find(query).toArray();
      res.send(artifacts);
    });

    //Get all liked artifacts by user
    app.get("/artifacts/liked", async (req, res) => {
      try {
        const userEmail = req.query.email;
        if (!userEmail) return res.status(400).send([]);

        const artifacts = await artifactsCollection
          .find({ likedBy: { $in: [userEmail] } })
          .toArray();

        res.send(Array.isArray(artifacts) ? artifacts : []);
      } catch (error) {
        console.error("Failed to fetch liked artifacts:", error);
        res.status(500).send([]);
      }
    });

    // Get single artifact
    app.get("/artifacts/:id", async (req, res) => {
      const id = req.params.id;
      const userEmail = req.query.email;
      try {
        const artifact = await artifactsCollection.findOne({
          _id: new ObjectId(id),
        });
        if (!artifact)
          return res.status(404).send({ message: "Artifact not found" });
        const isLiked = artifact.likedBy?.includes(userEmail) || false;
        res.send({ ...artifact, isLiked });
      } catch (error) {
        res.status(500).send({ message: "Server error" });
      }
    });

    // Like/unlike artifact
    app.patch("/artifacts/:id/like", async (req, res) => {
      try {
        const id = req.params.id;
        const { liked, email } = req.body;
        const filter = { _id: new ObjectId(id) };
        const artifact = await artifactsCollection.findOne(filter);
        if (!artifact)
          return res.status(404).send({ message: "Artifact not found" });

        let likes = artifact.likes || 0;
        let likedBy = artifact.likedBy || [];

        if (liked && !likedBy.includes(email)) {
          likedBy.push(email);
          likes++;
        } else if (!liked && likedBy.includes(email)) {
          likedBy = likedBy.filter((e) => e !== email);
          likes = Math.max(likes - 1, 0);
        }

        await artifactsCollection.updateOne(filter, {
          $set: { likes, likedBy },
        });
        res.send({ likes, isLiked: likedBy.includes(email) });
      } catch (error) {
        console.error(error);
        res.status(500).send({ message: "Server error" });
      }
    });

    // Update artifacts
    app.put("/artifacts/:id", async (req, res) => {
      const id = req.params.id;
      const filter = { _id: new ObjectId(id) };
      const options = { upsert: true };
      const updatedPlant = req.body;
      const updateDoc = {
        $set: updatedPlant,
      };
      const result = await artifactsCollection.updateOne(
        filter,
        updateDoc,
        options
      );
      res.send(result);
    });

    // Delete artifact
    app.delete("/artifacts/:id", async (req, res) => {
      try {
        const id = req.params.id;
        const query = { _id: new ObjectId(id) };
        const result = await artifactsCollection.deleteOne(query);
        res.send(result);
      } catch (error) {
        res.status(500).send({ message: "Server error" });
      }
    });
  } finally {
    // Keep connection alive
  }
}
run().catch(console.dir);

// Default route
app.get("/", (req, res) => {
  res.send("Artifacts Gallery Server is running 🚀");
});

app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});
