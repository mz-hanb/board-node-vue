const express = require('express');
const path = require('path');
const favicon = require('serve-favicon');
const logger = require('morgan');
const cookieParser = require('cookie-parser');
const bodyParser = require('body-parser');
const sassMiddleware = require('node-sass-middleware');
const mongoose = require('mongoose');
const methodOverride = require('method-override');

const boards = require('./routes/boards');
const boardsApi = require('./routes/boards-api');
const index = require('./routes/index');
const users = require('./routes/users');

const app = express();
// --- db col
mongoose.connect('mongodb://localhost/boards');

const db = mongoose.connection;

db.on('error', console.error.bind(console, 'connection error:'));
db.once('open', () => {
  console.log('>>> connected');
});

// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.use('/uploads', express.static('uploads')); // 업로드한 이미지 접근경로
app.set('view engine', 'ejs');

// uncomment after placing your favicon in /public
// app.use(favicon(path.join(__dirname, 'public', 'favicon.ico')));
app.use(logger('dev'));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(cookieParser());

app.use(sassMiddleware({
  src: path.join(__dirname, 'public'),
  dest: path.join(__dirname, 'public'),
  indentedSyntax: false, // true = .sass and false = .scss
  sourceMap: true,
}));
// override with the X-HTTP-Method-Override header in the request 
// app.use(methodOverride('X-HTTP-Method-Override'));
app.use(methodOverride('_method'));
app.use(express.static(path.join(__dirname, 'public')));

app.use('/', index);
app.use('/users', users);
app.use('/boards', boards);
// app.use('/boards-api', boardsApi);
app.use('/api/boards', boardsApi);

// catch 404 and forward to error handler
app.use((req, res, next) => {
  const err = new Error('Not Found');
  err.status = 404;
  next(err);
});

// error handler
app.use((err, req, res, next) => {
  // set locals, only providing error in development
  res.locals.message = err.message;
  res.locals.error = req.app.get('env') === 'development' ? err : {};

  // render the error page
  res.status(err.status || 500);
  res.render('error');
});

module.exports = app;
