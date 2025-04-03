const Task = require("../models/task")

module.exports = {
    allTasks: (req, res) => {
      Task.find().then((tasks)=>{
        res.status(200).send(tasks);
      }).catch((err)=>{
        console.log(err)
      });
    },
  
    getTask: (req, res) => {
      const taskId = req.params.id;
      if(taskId == null) return res.status(403)
      Task.findById({_id : taskId})
      .then((task)=>{
        res.status(201).json(task);
      })
      .catch((err)=>{
        res.status(404).json(err);
      })
    },
  
    createTask: (req, res) => {
      const newTask = Task({
        title:req.body.title,
        content: req.body.content
      })

      newTask.save().then(()=>{
        res.status(201).send("created with success");
      })
      .catch((err)=>{
        res.status(404).send(err);
      })
    },
  
    updateTask: (req, res) => {
      const taskId = req.params.id;
      if(taskId == null) res.status(403).json({"err":"The update "})
      if(req.body.title == null || req.body.content == null) res.status(403).json({"err":"The update require an _id"})
      Task.findOneAndUpdate(taskId, req.body)
      .then(task => res.status(203).json(task))
      .catch(err=> res.status(403).json(err));
    },
  
    deleteTask: (req, res) => {
      const taskId = req.params.id;
      if(taskId == null) return res.status(403);
      Task.findOneAndDelete({"_id":taskId})
      .then(deleted => res.status(200).json(deleted))
      .catch(err => res.status(404).json(err));
    },
  };