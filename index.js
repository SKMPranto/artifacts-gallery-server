const express = require("express");
const cors = require("cors");
const app = express();
const port = process.env.PORT || 3000;
require("dotenv").config();
const { MongoClient, ServerApiVersion, ObjectId } = require("mongodb");

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

    // Create artifact
    app.post("/artifacts", async (req, res) => {
      const newArtifact = { ...req.body, likes: 0, likedBy: [] };
      const result = await artifactsCollection.insertOne(newArtifact);
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

    // Get single artifact with user like info
    app.get("/artifacts/:id", async (req, res) => {
      const id = req.params.id;
      const userEmail = req.query.email;
      const artifact = await artifactsCollection.findOne({
        _id: new ObjectId(id),
      });
      if (!artifact)
        return res.status(404).send({ message: "Artifact not found" });

      const isLiked = artifact.likedBy?.includes(userEmail) || false;
      res.send({ ...artifact, isLiked });
    });

    // Update artifact
    app.put("/artifacts/:id", async (req, res) => {
      const id = req.params.id;
      const filter = { _id: new ObjectId(id) };
      const updateDoc = { $set: req.body };
      const result = await artifactsCollection.updateOne(filter, updateDoc, {
        upsert: true,
      });
      res.send(result);
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

        if (liked) {
          if (!likedBy.includes(email)) {
            likedBy.push(email);
            likes++;
          }
        } else {
          if (likedBy.includes(email)) {
            likedBy = likedBy.filter((e) => e !== email);
            likes = Math.max(likes - 1, 0);
          }
        }

        await artifactsCollection.updateOne(filter, {
          $set: { likes, likedBy },
        });
        res.send({ likes, likedBy });
      } catch (error) {
        console.error(error);
        res.status(500).send({ message: "Server error" });
      }
    });

    // Get all liked artifacts by user
    app.get("/artifacts/liked", async (req, res) => {
      try {
        const userEmail = req.query.email;
        if (!userEmail)
          return res
            .status(400)
            .send({ message: "Email query parameter is required" });

        const artifacts = await artifactsCollection
          .find({ likedBy: { $in: [userEmail] } })
          .toArray();
        res.send(artifacts);
      } catch (error) {
        console.error("Failed to fetch liked artifacts:", error);
        res.status(500).send({ message: "Server error" });
      }
    });

    // DELETE method
    // Delete artifact
    app.delete("/artifacts/:id", async (req, res) => {
      const id = req.params.id;
      const query = { _id: new ObjectId(id) };
      const result = await artifactsCollection.deleteOne(query);
      res.send(result);
    });

    // console.log("Connected to MongoDB!");
  } finally {
    // Keep connection open
  }
}
run().catch(console.dir);

app.get("/", (req, res) => {
  res.send("Artifacts Gallery Server is connected");
});

app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});
