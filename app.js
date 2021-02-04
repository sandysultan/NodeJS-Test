'use strict';
var debug = require('debug');
var express = require('express');
var path = require('path');
var favicon = require('serve-favicon');
var logger = require('morgan');
var cookieParser = require('cookie-parser');
var bodyParser = require('body-parser');

var routes = require('./routes/index');
var users = require('./routes/users');

var app = express();

const { DateTime } = require("luxon");

// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'pug');

// uncomment after placing your favicon in /public
//app.use(favicon(__dirname + '/public/favicon.ico'));
app.use(logger('dev'));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));

app.use('/', routes);
app.use('/users', users);

// catch 404 and forward to error handler
app.use(function (req, res, next) {
    var err = new Error('Not Found');
    err.status = 404;
    next(err);
});

// error handlers

// development error handler
// will print stacktrace
if (app.get('env') === 'development') {
    app.use(function (err, req, res, next) {
        res.status(err.status || 500);
        res.render('error', {
            message: err.message,
            error: err
        });
    });
}

// production error handler
// no stacktraces leaked to user
app.use(function (err, req, res, next) {
    res.status(err.status || 500);
    res.render('error', {
        message: err.message,
        error: {}
    });
});

app.set('port', process.env.PORT || 3000);

var server = app.listen(app.get('port'), function () {
    debug('Express server listening on port ' + server.address().port);
});

var io = require('socket.io')(server);

io.on('connection', (socket) => {
    console.log('a user connected');
    socket.emit('chat message', 'Hi, what is your first name?');
    
    socket.on('disconnect', () => {
        console.log('user disconnected');
    });
    socket.on('chat message', (msg) => {
        console.log('message: ' + msg);

        if (!socket.hasOwnProperty('firstName')) {
            socket.firstName = msg;
            socket.emit('chat message', 'hi ' + msg + ', when is your birthday? YYYY-MM-DD');
        } else {
            if (!socket.hasOwnProperty('birthDay')) {
                var birthDay = DateTime.fromFormat(msg, 'yyyy-MM-dd');
                if (birthDay.isValid) {
                    socket.birthDay = birthDay;
                    socket.emit('chat message', 'Do you want to know how many days till your next birthday?');
                } else {
                    socket.emit('chat message', 'Invalid date, retype your birthday again with YYYY-MM-DD format');
                }
            } else {
                var yes = ["yes", "yeah", "yup", "sure", "ya"];
                var no = ["no", "nope", "nah"];
                if (yes.some(e1 => msg.includes(e1))) {
                    var nextBirthDay = socket.birthDay;
                    var now = DateTime.local();
                    var yearNow = now.year;
                    nextBirthDay = nextBirthDay.set({ year: yearNow });
                    var diff = nextBirthDay.diffNow('days').toObject().days;
                    if (diff < 0) { //if birthday date in this year already passed
                        nextBirthDay = nextBirthDay.set({ year: yearNow + 1 });
                        diff = nextBirthDay.diffNow('days').toObject().days;
                    }
                    socket.emit('chat message', 'There are ' + Math.ceil(diff) + ' days left until your next birthday');
                } else if (no.some(e1 => msg.includes(e1))) {
                    socket.emit('chat message', 'Goodbye');
                } else {
                    socket.emit('chat message', 'uhh... is that a yes?');
                }
            }
        }
    });
});