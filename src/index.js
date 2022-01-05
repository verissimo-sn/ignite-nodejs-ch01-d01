const express = require('express');
const cors = require('cors');

const { v4: uuidv4 } = require('uuid');

const app = express();

app.use(cors());
app.use(express.json());

const users = [];

function checksExistsUserAccount(request, response, next) {
  const { username } = request.headers;

  const user = users.find(user => user.username === username);

  if(!user) {
    return response.status(400).json({ error: 'User not found' });
  }

  request.user = user;
  next();
}

app.post('/users', (request, response) => {
  const { name, username } = request.body;

  const userAlreadyExists = users.some(user => user.username === username);

  if(userAlreadyExists) {
    return response.status(400).json({ status: 400, error: 'User already exists' });
  }

  const newUser = {
    id: uuidv4(),
    name,
    username,
    todos: []
  }

  users.push(newUser);

  return response.status(201).json(newUser);
});

app.get('/todos', checksExistsUserAccount, (request, response) => {
  const { user } = request;

  return response.status(200).send(user.todos);
});

app.post('/todos', checksExistsUserAccount, (request, response) => {
  const { user } = request;
  const { title, deadline } = request.body;

  const newTodo = { 
    id: uuidv4(),
    title,
    done: false,
    deadline: new Date(deadline),
    created_at: new Date(),
  }

  user.todos.push(newTodo);

  response.status(201).send(newTodo);
});

app.put('/todos/:id', checksExistsUserAccount, (request, response) => {
  const { user: { todos } } = request;
  const { id } = request.params;
  const { title, deadline } = request.body;

  const todo = todos.find(todo => todo.id === id);

  if(!todo) {
    return response.status(404).json({error: 'Task not found'});
  }

  todo.title = title;
  todo.deadline = deadline;

  return response.status(200).json(todo);

});

app.patch('/todos/:id/done', checksExistsUserAccount, (request, response) => {
  const { user: { todos } } = request;
  const { id } = request.params;

  const [updatedTodo] = todos.map(todo => {
    if(todo.id === id) {
      return {
        ...todo,
        done: true
      }
    }
  });

  if(!updatedTodo) {
    return response.status(404).json({error: 'Task not found'});
  }

  return response.status(200).send(updatedTodo);
});

app.delete('/todos/:id', checksExistsUserAccount, (request, response) => {
  const { user: { todos } } = request;
  const { id } = request.params;

  const findTodo = todos.some(todo => todo.id === id);

  if(!findTodo) {
    return response.status(404).json({error: 'Task not found'});
  }

  todos.splice(todos[id], 1);

  return response.status(204).send();
});

module.exports = app;