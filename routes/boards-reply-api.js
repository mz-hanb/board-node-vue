const express = require('express');
const BoardContents = require('../models/boards-schema'); // db를 사용하기 위한 변수
/*********************************** 
 * 댓글달기 api * 
*********************************** */
const router = express.Router();

router.post('/', (req, res) => {
  // 댓글 다는 부분
  const reply_writer = req.body.replyWriter;
  const reply_comment = req.body.replyComment;
  const reply_id = req.body.replyId;
  const reply_pw = req.body.replyAddPw;  

  addComment(reply_id, reply_pw, reply_writer, reply_comment);
  res.send();
});

function addComment(id, pw, writer, comment) {
  BoardContents.findOne({ _id: id }, (err, rawContent) => {
    if (err) throw err;

    rawContent.comments.unshift({ name: writer, pw: pw, memo: comment });
    rawContent.save((err) => {
      if (err) throw err;
    });
  });
}

router.delete('/', (req, res) => {
  const id = req.param('id');
  var delPw = req.param('pw');

  BoardContents.findOne({_id: id}, (err, data)=>{
    if(err) console.log( '////// ');           

    data.comments.forEach(function(comment, idx){
      console.log( idx + '// ' + comment.pw + ' > ' + delPw  + '//// ');
      if( comment.pw === delPw ){        
        console.log( 'matched >> ');
        data.comments.splice(idx, 1);
        data.save(function(err){
          res.send();
          return;
        })
      } 
    });    
  });

});

module.exports = router;

