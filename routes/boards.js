var express = require('express');
var router = express.Router();
const csurf = require('csurf');
const csrfProtection = csurf({cookie: true}); //set save token secret to user cookie or req.session

//=== 처음 로드: ejs 파일 렌더링~
router.get('/', csrfProtection, function(req,res){    
    res.render('board', {title: "Board", contents: '', csrfToken: req.csrfToken()});        
});

module.exports = router;