#!/usr/bin/env node
const readline = require('readline');

const accounts = require('../lib/accounts');

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

rl.question('Username: ', (username) => {
  rl.question('Password: ', (password) => {
    rl.close();
    accounts.setPassword(username, password, (result) => {
      console.log(result);
      process.exit();
    });
  });
});
