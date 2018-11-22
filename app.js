import express from 'express';
import path from 'path';
import logger from 'morgan';
import cookieParser from 'cookie-parser';
import bodyParser from 'body-parser';
import index from './routes/index';

var app = express();
const {
    log,
    error
} = require('./lib/LogUtils');
app.set('view engine', 'jade');

// 跨域设置
var protocols = ['http://', 'https://'];
var allowOrigin = ['localhost', 'm.yoyow.org', 'download.yoyow.org', 'demo.yoyow.org'];
app.use(function (req, res, next) {
    let origin = req.headers.origin || req.headers.referer || false;
    if (origin) {
        if (origin.endsWith("/")) origin = origin.substr(0, origin.length - 1);
        for (var ao of allowOrigin) {
            if (origin.startsWith(protocols[0] + ao) || origin.startsWith(protocols[1] + ao)) {
                res.header('Access-Control-Allow-Origin', origin);
                res.header('Access-Control-Allow-Methods', 'GET,POST,DELETE');
                res.header('Access-Control-Allow-Headers', 'Content-Type');
                res.header('Access-Control-Allow-Credentials', 'true');
            }
        }
    }
    next();
});

// uncomment after placing your favicon in /public
app.use(logger('dev'));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({
    extended: false
}));
app.use(cookieParser());
app.use("/test", express.static('public'));
// app.use(express.static(path.join(__dirname, 'public')));
app.use('/resource', index);

// catch 404 and forward to error handler
app.use(function (req, res, next) {
    var err = new Error('Not Found');
    err.status = 404;
    next(err);
});

// error handler
app.use(function (err, req, res, next) {
    // set locals, only providing error in development
    res.locals.message = err.message;
    res.locals.error = req.app.get('env') === 'development' ? err : {};
    log('!!! error stack ', err.stack);
    err.stack = null;
    // render the error page
    res.status(err.status || 500);
    next(err);
});

module.exports = app;