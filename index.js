const express = require("express");
const cors = require("cors");
const app = express();
const port = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());

// 

app.get("/", (req, res)=>{
    res.send("Artifacts Gallery Server is connected");
});

// Start the server
app.listen(port, ()=>{
    console.log(`Artifacts Gallery Server is running on port ${port}`);
})