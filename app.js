const createError = require('http-errors');
const express = require('express');
const path = require('path');
const cookieParser = require('cookie-parser');
const chalk = require('chalk');
const yargs = require('yargs');
const server_log = require('debug')('server: server');
server_log.enabled = true;
const { fileParser } = require('./lib/parser');

let file = yargs.argv.filename || null;

const indexRouter = require('./routes/index');
const usersRouter = require('./routes/users');

const app = express();

// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'pug');

app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));

app.use('/', indexRouter);
app.use('/users', usersRouter);

// catch 404 and forward to error handler
app.use(function(req, res, next) {
  next(createError(404));
});

// error handler
app.use(function(err, req, res, next) {
  // set locals, only providing error in development
  res.locals.message = err.message;
  res.locals.error = req.app.get('env') === 'development' ? err : {};

  // render the error page
  res.status(err.status || 500);
  res.render('error');
});


function initialiseServer(port) {
    app.listen(port, (err) => {
        if(!err) {
            server_log(chalk.cyan(`Server listening on port ${port}\n`));
        }

        if(err) {
            console.log(chalk.red(err));
        }

        fileParser(file, (term) => term ? process.exit(0) : console.log(chalk.cyan('\nParsing complete. Server still running.')));
    });
}



initialiseServer(3000);





