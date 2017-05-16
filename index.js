// var express = require('express');
// var app = express();

// app.get('/', function(req, res) {
//   res.send('hello, express');
// });
// app.get('/users/:name', function(req, res) {
//   res.send('hello, ' + req.params.name);
// });
// app.listen(3000);

// var path = require('path');
// var express = require('express');
// var app = express();
// var indexRouter = require('./routes/index');
// var userRouter = require('./routes/users');


// app.set('views', path.join(__dirname, 'views'));// 设置存放模板文件的目录
// app.set('view engine', 'ejs');// 设置模板引擎为 ejs

// app.use('/', indexRouter);
// app.use('/users', userRouter);

// app.listen(3000);



// var express = require('express');
// var app = express();

// app.use(function(req, res, next) {
//   console.log('1');
//   next(new Error('haha'));
// });

// app.use(function(req, res, next) {
//   console.log('2');
//   res.status(200).end();
// });

// //错误处理
// app.use(function(err, req, res, next) {
//   console.error(err.stack);
//   res.status(500).send('Something broke!');
// });

// app.listen(3000);






var path = require('path');
var express = require('express');
var session = require('express-session');
var MongoStore = require('connect-mongo')(session);
var flash = require('connect-flash');
var config = require('config-lite')(__dirname);       //这句话是教程里没有的
var routes = require('./routes');
var pkg = require('./package');
var winston = require('winston');
var expressWinston = require('express-winston');
var app = express();


// 设置模板目录
app.set('views', path.join(__dirname, 'views'));
// 设置模板引擎为 ejs
app.set('view engine', 'ejs');

// 设置静态文件目录
app.use(express.static(path.join(__dirname, 'public')));
// session 中间件
app.use(session({
  name: config.session.key,// 设置 cookie 中保存 session id 的字段名称
  secret: config.session.secret,// 通过设置 secret 来计算 hash 值并放在 cookie 中，使产生的 signedCookie 防篡改
  cookie: {
    maxAge: config.session.maxAge// 过期时间，过期后 cookie 中的 session id 自动删除
  },
  store: new MongoStore({// 将 session 存储到 mongodb
    url: config.mongodb// mongodb 地址
  })
}));
// flash 中间价，用来显示通知
app.use(flash());

// 处理表单及文件上传的中间件
app.use(require('express-formidable')({
  uploadDir: path.join(__dirname, 'public/img'),// 上传文件目录
  keepExtensions: true// 保留后缀
}));





// 设置模板全局常量
app.locals.blog = {
  title: pkg.name,
  description: pkg.description
};

// 添加模板必需的三个变量
app.use(function (req, res, next) {
  res.locals.user = req.session.user;
  res.locals.success = req.flash('success').toString();
  res.locals.error = req.flash('error').toString();
  next();
});





// error page
app.use(function (err, req, res, next) {
  res.render('error', {
    error: err
  });
});



// 路由

// 正常请求的日志
app.use(expressWinston.logger({
  transports: [
    new (winston.transports.Console)({
      json: true,
      colorize: true
    }),
    new winston.transports.File({
      filename: 'logs/success.log'
    })
  ]
}));
// 路由
routes(app);
// 错误请求的日志
app.use(expressWinston.errorLogger({
  transports: [
    new winston.transports.Console({
      json: true,
      colorize: true
    }),
    new winston.transports.File({
      filename: 'logs/error.log'
    })
  ]
}));

// 监听端口，启动程序
app.listen(config.port, function () {
  console.log(`${pkg.name} listening on port ${config.port}`);
});