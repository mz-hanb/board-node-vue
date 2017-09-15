var LocalStrategy = require('passport-local').Strategy;
var User = require('../models/user-schema');
// var ps = require('passport');

module.exports = function(passport){  
  passport.serializeUser(function (user, done) {
    done(null, user.id);
  });
  passport.deserializeUser(function (id, done) {
    User.findById(id, function (err, user) {
      done(err, user);
    });
  });

  //--- 회원가입
  passport.use('signup', new LocalStrategy({
    usernameField: 'email',
    passwordField: 'password',
    passReqToCallback: true
  },
    function (req, email, password, done) {
      User.findOne({ 'email': email }, function (err, user) {
        if (err) return done(err);
        if (user) {
          return done(null, false, req.flash('signupMessage', '이메일이 존재합니다.'));
        } else {

          var newUser = new User();

          newUser.name = req.body.name;
          newUser.email = email;
          newUser.password = newUser.generateHash(password);

          newUser.save(function (err) {
            if (err)
              throw err;
            return done(null, newUser);
          });
        }
      });
    }));

  // passport.use('signup', new LocalStrategy({
  //     usernameField: 'emial', 
  //     passwordField: 'password', 
  //     passReqCallback: true
  //   },
  // function(req, emial, password, done){
  //   User.findOne({'email': email}, function(err, user){
  //     if(err) return done(err);
  //     if(user){
  //       return done(null, false, req.flash('signupMessage', '이메일이 존재합니다.'));
  //     }else{
  //       var newUser = new User();
  //       newUser.name = req.body.name;
  //       newUser.emial =email;
  //       newUser.password = newUser.generateHash(password);

  //       newUser.save(function(err){
  //         if(err){
  //           throw err;
  //           return done(null, newUser);
  //         }
  //       })
  //     }
  //   });
  // }));

  //--- 로그인

  passport.use('login', new LocalStrategy({
    usernameField: 'email',
    passwordField: 'password',
    passReqToCallback: true
  },
    function (req, email, password, done) {

      User.findOne({ 'email': email }, function (err, user) {

        if (err)
          return done(err);
        if (!user)
          return done(null, false, req.flash('loginMessage', '사용자를 찾을 수 없습니다.'));
        if (!user.validPassword(password))
          return done(null, false, req.flash('loginMessage', '비밀번호가 다릅니다.'));
        return done(null, user);
      });
    }));

  // passport.use('login', new LocalStrategy({
  //   usernameField: 'email', 
  //   passwordField: 'password',
  //   passReqCallback: true 
  // },
  // function(req, email, password, done){
  //   User.findOne({'email': emial}, function(err, user){
  //     if(err) return done(err);
  //     if(!user) return done(null, false, req.flash('loginMessage', '사용자를 찾을 수 없습니다.'));
  //     if (!user.validPassword){
  //       return done(null, false, req.flash('loginMessage', '비밀번호가 다릅니다.'));
  //     }
  //     return done(null, user);
  //   });
  // }));


}
//---  