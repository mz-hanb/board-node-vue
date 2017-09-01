const express = require('express');
const BoardContents = require('../models/boards-schema'); // db를 사용하기 위한 변수
const fs = require('fs');
const path = require('path');
const gm = require('gm');
const multer = require('multer');
// 파일 저장을 위한  multer
const storage = multer.diskStorage({
  destination(req, file, cb) {
    cb(null, 'uploads/'); // cb 콜백함수를 통해 전송된 파일 저장 디렉토리 설정
  },
  filename(req, file, cb) {
    const objFile = path.parse(file.originalname);
    cb(null, `${objFile.name}-${new Date().valueOf()}${objFile.ext}`); // cb 콜백함수를 통해 전송된 파일 이름 설정
  },
});

// var upload = multer({dest:'./tmp/'}); // multer 경로 설정, 파일이 업로드 되면 먼저 임시 폴더로 가서 저장됨
const upload = multer({ storage });
const router = express.Router();
var limitSize = 2; // 페이지당 게시글 수 

//= ==
router.get('/get-list', (req, res) => {
  const search_word = req.param('searchWord');
  const searchCondition = { $regex: search_word };

  let page = req.param('page');
  if (page == null) { page = 1; }
  
  const skipSize = (page - 1) * limitSize;
  let pageNum = 1;

  BoardContents.count({ deleted: false, $or: [{ title: searchCondition }, { contents: searchCondition }, { writer: searchCondition }] }, (err, searchCount) => {
    if (err) throw err;
    pageNum = Math.ceil(searchCount / limitSize);

    BoardContents.find({ deleted: false, $or: [{ title: searchCondition }, { contents: searchCondition }, { writer: searchCondition }] }).sort({ date: -1 }).skip(skipSize).limit(limitSize).exec((err, searchContents) => {
      if (err) throw err;
      res.setHeader('Content-Type', 'application/json');
      res.send(JSON.stringify({ title: 'Board', contents: searchContents, pagination: pageNum, searchWord: search_word }));
    });
  });
});
//= == 게시판 상세보기

router.get('/view', (req, res) => {
  // 글 보는 부분. 글 내용을 출력하고 조회수를 늘려줘야함
  // 댓글 페이지 추가 해줌, 5개씩 출력함
  const contentId = req.param('id');
  BoardContents.findOne({ _id: contentId }, (err, rawContent) => {
    if (err) throw err;
    rawContent.count += 1;
    // console.log('//'+ rawContent.count );
    const reply_pg = Math.ceil(rawContent.comments.length / 5);
    //----
    rawContent.save((err) => {
      if (err) throw err;
      res.setHeader('Content-Type', 'application/json');

      // console.log( rawContent.fileUp.length );
      if (rawContent.fileUp.length > 0) {
        rawContent.fileUp.forEach(function (fileData){
          fs.existsSync(fileData.fileThumbPath, function (result){
            fileData.exist = result;
          });
        });
      }


      res.send(JSON.stringify({ title: 'Board', content: rawContent, replyPage: reply_pg }));
    });
  });
});
//= == 게시글 작성
router.post('/', upload.array('UploadFile'), (req, res) => {
  // field name은 form의 input file의 name과 같아야함    
  const addNewTitle = req.body.addContentSubject;
  const addNewWriter = req.body.addContentWriter;
  const addNewPassword = req.body.addContentPassword;
  const addNewContent = req.body.addContents;
  const upFile = req.files; // 업로드 된 파일을 받아옴        

  if (upFile.length > 0) {
    makeThumbnails(upFile, () => {
      addBoard(addNewTitle, addNewWriter, addNewContent, addNewPassword, upFile);
      res.send();
    });
  } else {
    addBoard(addNewTitle, addNewWriter, addNewContent, addNewPassword, upFile);
    res.send();
  }
});
//= == 게시글 수정
router.put('/', (req, res) => {
  const modTitle = req.body.modContentSubject;
  const modContent = req.body.modContents;
  const modId = req.body.modId;
  const modPassword = req.body.modContentPassword;

  checkPassword(modId, modPassword, (isMatch) => {
    if (isMatch) {
      modBoard(modId, modTitle, modContent);
      res.send();
    } else {
      res.send({ notice: 'not match password' });
    }
  });
});
//= == 게시글 삭제
router.delete('/', (req, res) => {
  const contentId = req.param('id');
  const delPw = req.param('pw');

  checkPassword(contentId, delPw, (isMatch) => {
    if (isMatch) {
      // BoardContents.update({_id:contentId}, {$set:{deleted:true}}, function(err){
      //     if(err) throw err;        
      //     res.send();        
      // });                       

      // BoardContents.find({_id:contentId}, function(err, originContent){                
      BoardContents.findById(contentId, (err, tgData) => {
        tgData.fileUp.forEach((fileData) => {
          fs.unlinkSync(fileData.fileOriginPath);
          fs.unlinkSync(fileData.fileThumbPath);
        });
      }).remove((err) => {
        res.send();
      });
    } else {
      res.setHeader('Content-Type', 'application/json');
      // 불일치에 대한 처리
      res.send({ notice: 'not match password' });
    }
  });
});

router.get('/download/:path', (req, res) => {
  // file download
  const path = req.params.path;
  res.download(`./upload/${path}`, path);
  // console.log(path);
});
router.post('/reply', (req, res) => {
  // 댓글 다는 부분
  const reply_writer = req.body.replyWriter;
  const reply_comment = req.body.replyComment;
  const reply_id = req.body.replyId;

  addComment(reply_id, reply_writer, reply_comment);
  res.redirect(`/boards/view?id=${reply_id}`);
});
router.get('/reply', (req, res) => {
  // 댓글 ajax로 페이징 하는 부분
  const id = req.param('id');
  const page = req.param('page');
  const max = req.param('max'); // 댓글 총 갯수 확인
  const skipSize = (page - 1) * 5;
  let limitSize = skipSize + 5;

  if (max < skipSize + 5) { limitSize = max * 1; } // 댓글 갯수 보다 넘어가는 경우는 댓글 수로 맞춰줌 (몽고디비 쿼리에서 limit은 양의 정수여야함)

  BoardContents.findOne({ _id: id }, { comments: { $slice: [skipSize, limitSize] } }, (err, pageReply) => {
    if (err) throw err;
    res.send(pageReply.comments);
  });
});

module.exports = router;

//= == 게시글 추가
function addBoard(title, writer, content, password, upFile) {
  const newContent = content.replace(/\r\n/gi, '\\r\\n');

  console.log(`fn:addBoard> upFile> ${upFile}`);

  const newBoardContents = new BoardContents();
  newBoardContents.writer = writer;
  newBoardContents.title = title;
  newBoardContents.contents = newContent;
  newBoardContents.password = password;
  newBoardContents.fileName = '';
  newBoardContents.fileOriginPath = '';
  newBoardContents.fileDownPath = '';


  console.log(`=========== upFile>> ${upFile.length}`);
  // console.log( '=========== upFile>> ' + upFile.length );

  newBoardContents.save((err) => {
    if (err) throw err;
    BoardContents.findOne({ _id: newBoardContents._id }, { _id: 1 }, (err, newBoardId) => {
      if (err) throw err;

      if (upFile != null) {
        for (let i = 0; i < upFile.length; i++) {
          const objFile = upFile[i];
          console.dir(objFile);
          // BoardContents.update({_id: newBoardId.id}, {$push: {fileUp: objFile.filename + '#' + objFile.path + '#' + objFile.thumbUrl }}, function (err) {                    
          BoardContents.update({ _id: newBoardId.id }, { $push: { fileUp: { fileName: objFile.filename, fileOriginPath: objFile.path, fileThumbPath: objFile.thumbUrl, exist: true } } }, (err) => {
            if (err) throw err;
          });
        }
      }
    });
  });
}
//= == 게시글 수정
function modBoard(id, title, content) {
  const modContent = content.replace(/\r\n/gi, '\\r\\n');

  BoardContents.findOne({ _id: id }, (err, originContent) => {
    if (err) throw err;
    originContent.updated.push({ title: originContent.title, contents: originContent.contents });
    originContent.save((err) => {
      if (err) throw err;
    });
  });

  BoardContents.update({ _id: id }, { $set: { title, contents: modContent, date: Date.now() } }, (err) => {
    if (err) throw err;
  });
}

function addComment(id, writer, comment) {
  BoardContents.findOne({ _id: id }, (err, rawContent) => {
    if (err) throw err;

    rawContent.comments.unshift({ name: writer, memo: comment });
    rawContent.save((err) => {
      if (err) throw err;
    });
  });
}
// check password
function checkPassword(id, pw, callback) {  
  BoardContents.findOne({ _id: id }, (err, rawContents) => {
    let isMatch = false;
    if (rawContents.password === pw) {
      isMatch = true;
    } else {
      isMatch = false;
    }
    callback(isMatch);
  });
}
function makeThumbnails(fileDataList, cb) {
  let cnt = 0;
  fileDataList.forEach((file, idx) => {
    console.dir(file);
    const width = 100;
    const height = 100;
    const objFile = path.parse(file.filename);
    const stPath = `uploads/thumbnails/${objFile.name}-${Date.now().valueOf()}${objFile.ext}`;
    gm(file.path)
      .resize(width, height)
      .noProfile()
      .write(stPath, (err) => {
        if (err) {
          console.error(err);
        }
        file.thumbUrl = stPath;
        cnt++;
        if (cnt === fileDataList.length) {
          cb();
        }
      });
  });
}