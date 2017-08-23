var express = require('express');
var router = express.Router();

//=== 처음 로드: ejs 파일 렌더링~
router.get('/', function(req,res){    
    res.render('board', {title: "Board", contents: ''});    
});

module.exports = router;