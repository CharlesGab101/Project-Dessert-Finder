const express = require('express');
const fs = require('fs');
const path = require('path');

const router = express.Router();
const USERS_FILE = path.join(__dirname, '..', 'user.json');

// helper to read users
function getUsers() {
  if (!fs.existsSync(USERS_FILE)) return {};
  return JSON.parse(fs.readFileSync(USERS_FILE, 'utf-8'));
}

// helper to save users
function saveUsers(users) {
  fs.writeFileSync(USERS_FILE, JSON.stringify(users, null, 2));
}

// register route
router.post('/register', (req, res) => {
  const { username, password } = req.body;
  const users = getUsers();

  if (!username || !password) {
    return res.status(400).json({ message: 'Username and password required' });
  }

  if (users[username]) {
    return res.status(409).json({ message: 'Username already exists' });
  }

  users[username] = password;
  saveUsers(users);
  res.json({ message: 'Registered successfully' });
});

// login route
router.post('/login', (req, res) => {
  const { username, password } = req.body;
  const users = getUsers();

  if (users[username] === password) {
    return res.json({ message: 'Login successful' });
  }

  res.status(401).json({ message: 'Invalid username or password' });
});

module.exports = router;
