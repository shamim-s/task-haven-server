const express = require("express");
const cors = require("cors");
const { MongoClient, ServerApiVersion, ObjectId } = require("mongodb");
require("dotenv").config();
const app = express();
const port = process.env.PORT || 5000;

//Middleware
app.use(cors());
app.use(express.json());

//Database Connection
const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASSWORD}@database-2.yrgjegt.mongodb.net/?retryWrites=true&w=majority`;
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
    await client.connect();
    // Send a ping to confirm a successful connection
    await client.db("admin").command({ ping: 1 });
    console.log(
      "Pinged your deployment. You successfully connected to MongoDB!"
    );

    //Collections
    const newTask = client.db('taskHaven').collection("newTask");
    const completedTask = client.db('taskHaven').collection("completedTask");
    const trash = client.db('taskHaven').collection("trash");

    //API's 
      app.post("/task/add", async(req, res) => {
        const task = req.body;
        const result = await newTask.insertOne(task);
        res.send(result);
      })

      app.get("/task/:email", async(req, res) => {
        const email = req.params.email;
        const query = {user: email};
        const result = await newTask.find(query).toArray();
        res.send(result);
      })

      app.get("/completed/:email", async(req, res) => {
        const email = req.params.email;
        const query = {user: email};
        const result = await completedTask.find(query).toArray();
        res.send(result);
      })

      app.get("/deleted/:email", async(req, res) => {
        const email = req.params.email;
        const query = {user: email};
        const result = await trash.find(query).toArray();
        res.send(result);
      })

      app.delete("/delete/:id", async(req, res) => {
        const id = req.params.id;
        const query = {_id: new ObjectId(id)};
        const deleted = await newTask.findOne(query);
        const insert = await trash.insertOne(deleted);
        const result = await newTask.deleteOne({_id: new ObjectId(id)});
        res.send(result);
      })

      app.delete("/delete/task/:id", async(req, res) => {
        const id = req.params.id;
        const query = {_id: new ObjectId(id)};
        const result = await trash.deleteOne(query);
        res.send(result);
      })

      app.delete("/remove/:id", async(req, res) => {
        const id = req.params.id;
        const query = {_id: new ObjectId(id)};
        const result = await completedTask.deleteOne(query);
        res.send(result);
      })

      app.put("/task/edit", async(req, res) => {
        const task = req.body;
        const filter = {_id: new ObjectId(task._id)}
        const option = {upsert: true};
        const updatedDoc = {
          $set:{
            name: task.name,
          }
        };
        const result = await newTask.updateOne(filter, updatedDoc, option);
        res.send(result);
      })

      app.put("/task/complete", async(req, res) => {
        const todo = req.body;
        const filter = {_id: new ObjectId(todo._id)}
        const option = {upsert: true};
        const updatedDoc = {
          $set:{
            completed: true,
          }
        };
        const result = await newTask.updateOne(filter, updatedDoc, option);

        if (result) {
          const filter2 = {_id: new ObjectId(todo._id)};

          const updatedTodo = await newTask.findOne(filter2);
          const insert = await completedTask.insertOne(updatedTodo);

          const deleteTodo = await newTask.deleteOne(filter2);
        }
        res.send(result);
      })


  } catch (error) {
    await client.close();
    console.log("Something went wrong");
  }
}

run().catch((error) => console.log(error));

app.get("/", (req, res) => {
  res.send("todo Server Running");
});

app.listen(port, () => {
  console.log(`todo Server Running in port ${port}`);
});
