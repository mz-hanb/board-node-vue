var express = require('express');
var router = express.Router();
const csurf = require('csurf');
const csrfProtection = csurf({cookie: true}); //set save token secret to user cookie or req.session
var passport = require('passport');


/* GET home page. */
router.route('/').get(csrfProtection, function(req, res, next) {
  // res.render('index', { title: 'Express' });    
  res.render('index', { title: 'Express', csrfToken: req.csrfToken() });  
});

router.post('/signup', passport.authenticate('signup', {
  successRedirect : '/boards',
  failureRedirect : '/', // 가입 실패시 redirect 할 url 주소
  failureFlash : true
}));

// router.post('/singup', passport.authenticate('signup', {
//   successRedirect: '/boards',
//   failureRedirect: '/', // 가입 실패시 redirect 할 url 주소
//   failureFlash: true
// }));


router.post('/login', passport.authenticate('login', {
  successRedirect : '/boards', 
  failureRedirect : '/', // 로그인 실패시 redirect 할 url 주소
  failureFlash : true
}) );


module.exports = router;
