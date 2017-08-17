var express = require('express');
var BoardContents = require('../models/boardsSchema'); //db를 사용하기 위한 변수
var fs = require('fs');
var multer = require('multer'); // 파일 저장을 위한  multer
var upload = multer({dest:'./tmp/'}); // multer 경로 설정, 파일이 업로드 되면 먼저 임시 폴더로 가서 저장됨
var router = express.Router();
var limitSize = 3;

//=== 처음 로드: ejs 파일 렌더링~
router.get('/', function(req,res){    
    res.render('board', {title: "Board", contents: ''});    
});

// router.get('/download/:path', function(req, res){
//     // file download

//     var path = req.params.path;
//     res.download('./upload/'+path, path);
//     console.log(path);
// });

// router.post('/reply', function(req, res){
//     // 댓글 다는 부분
//     var reply_writer = req.body.replyWriter;
//     var reply_comment = req.body.replyComment;
//     var reply_id = req.body.replyId;

//     addComment(reply_id, reply_writer, reply_comment);

//     res.redirect('/boards/view?id='+reply_id);
// });

// router.get('/reply', function(req, res) {
//     // 댓글 ajax로 페이징 하는 부분
//     var id = req.param('id');
//     var page = req.param('page');
//     var max = req.param('max'); // 댓글 총 갯수 확인
//     var skipSize = (page-1)*5;
//     var limitSize = skipSize + 5;

//     if(max < skipSize+5) {limitSize = max*1;} // 댓글 갯수 보다 넘어가는 경우는 댓글 수로 맞춰줌 (몽고디비 쿼리에서 limit은 양의 정수여야함)

//     BoardContents.findOne({_id: id}, {comments: {$slice: [skipSize, limitSize]}} , function(err, pageReply){
//         if(err) throw err;
//         res.send(pageReply.comments);
//     });
// });


module.exports = router;