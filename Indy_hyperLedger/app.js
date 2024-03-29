const createError = require('http-errors');
const express = require('express');
const session = require('express-session');
const path = require('path');
const cookieParser = require('cookie-parser');
const logger = require('morgan');
const config = require('./config');

const morgan = require('morgan');
const root = path.normalize(`${__dirname}/../..`);

// const userRouter = require('./ui/routes/user');
const indexRouter = require('./ui/routes/index');
const apiRouter = require('./ui/routes/api');
const indyHandler = require('./indy/src/handler')({ defaultHandlers: true, eventHandlers: [] }); // () executes the function so that we can potentially have multiple indy handlers;

const uiMessageHandlers = require('./ui/uiMessageHandlers');
uiMessageHandlers.enableDefaultHandlers(indyHandler);

const app = express();

// view engine setup
app.set('views', path.join(__dirname, 'ui/views'));
app.set('view engine', 'ejs');

const FileStore = require('session-file-store')(session);
app.use(session({
  name: `server-session-cookie-id-for-${config.walletName}`,
  secret: config.sessionSecret,
  saveUninitialized: true,
  resave: true,
  rolling: true,
  store: new FileStore()
}));

app.set('views', path.join(__dirname, 'ui/views'));
app.set('view engine', 'ejs');

app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'ui/public')));

// app.use('/api/v1/user', userRouter);
app.use('/', indexRouter);
app.use('/api', apiRouter);
app.post('/indy', indyHandler.middleware);

// catch 404 and forward to error handler



app.use(function (req, res, next) {
  next(createError(404));
});


app.use(express.urlencoded({ extended: true, limit: "50mb" }));
app.use(express.json({ limit: "50mb" }));
app.use(morgan('dev'))



// error handler
app.use(function (err, req, res, next) {
  // set locals, only providing error in development
  res.locals.message = err.message;
  res.locals.error = req.app.get('env') === 'development' ? err : {};

  // render the error page
  res.status(err.status || 500);
  res.render('error');
});

// catch 404 and forward to error handler
app.use(function (req, res, next) {
  next(createError(404));
});

// error handler
app.use(function (err, req, res, next) {
  // set locals, only providing error in development
  res.locals.message = err.message;
  res.locals.error = req.app.get('env') === 'development' ? err : {};

  // render the error page
  res.status(err.status || 500);
  res.render('error');
});

// app.listen(1951, function () {
//   console.log("Server is listening on", 1951)
// })


module.exports = app;