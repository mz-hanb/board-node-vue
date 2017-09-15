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
  console.log(reply_writer);
  console.log(reply_comment);

  addComment(reply_id, reply_writer, reply_comment);
  res.send();
});

function addComment(id, writer, comment) {
  BoardContents.findOne({ _id: id }, (err, rawContent) => {
    if (err) throw err;

    rawContent.comments.unshift({ name: writer, memo: comment });
    rawContent.save((err) => {
      if (err) throw err;
    });
  });
}

module.exports = router;

