const controllers = require('../controllers/tasks.js');
const requiredFields = require('../middlewares/requiredFields.js');
const router = require('express').Router();


router.get('/', controllers.allTasks)
router.get('/:id', controllers.getTask)
router.post('/', requiredFields(["title", "content"]), controllers.createTask)
router.put('/:id', controllers.updateTask)
router.delete('/:id', controllers.deleteTask)

module.exports = router;