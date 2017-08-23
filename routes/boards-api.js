var express = require('express');
var BoardContents = require('../models/boardsSchema'); //db를 사용하기 위한 변수
var fs = require('fs');
var path = require('path');
var gm = require('gm');
var multer = require('multer'); // 파일 저장을 위한  multer
var storage = multer.diskStorage({ 
    destination: function(req, file, cb){
        cb( null, 'uploads/'); // cb 콜백함수를 통해 전송된 파일 저장 디렉토리 설정
    },
    filename: function(req, file, cb){
        var objFile = path.parse(file.originalname);
        cb(null, objFile.name + '-' + new Date().valueOf() + objFile.ext ) // cb 콜백함수를 통해 전송된 파일 이름 설정
    }
})

// var upload = multer({dest:'./tmp/'}); // multer 경로 설정, 파일이 업로드 되면 먼저 임시 폴더로 가서 저장됨
var upload = multer({storage: storage});
var router = express.Router();
var limitSize = 3;

//===
router.get('/get-list', function(req,res){
    var search_word = req.param('searchWord');
    var searchCondition = {$regex:search_word};    

    var page = req.param('page');
    if(page == null) {page = 1;}

    var limitSize = 5;
    var skipSize = (page-1)*limitSize;    
    var pageNum = 1;    

    BoardContents.count({deleted:false, $or:[{title:searchCondition},{contents:searchCondition},{writer:searchCondition}]},function(err, searchCount){
        if(err) throw err;
        pageNum = Math.ceil(searchCount/limitSize);

        BoardContents.find({deleted:false, $or:[{title:searchCondition},{contents:searchCondition},{writer:searchCondition}]}).sort({date:-1}).skip(skipSize).limit(limitSize).exec(function(err, searchContents){
            if(err) throw err;
            res.setHeader('Content-Type', 'application/json');
            res.send(JSON.stringify( {title: "Board", contents: searchContents, pagination: pageNum, searchWord: search_word} ));            
        });
    });
});
//=== 게시판 상세보기
router.get('/view', function(req, res){
    // 글 보는 부분. 글 내용을 출력하고 조회수를 늘려줘야함
    // 댓글 페이지 추가 해줌, 5개씩 출력함
    var contentId = req.param('id');
    BoardContents.findOne({_id:contentId}, function(err, rawContent){
        if(err) throw err;
        rawContent.count += 1;
        // console.log('//'+ rawContent.count );
        var reply_pg = Math.ceil(rawContent.comments.length/5);
        //----
        rawContent.save(function(err){
            if(err) throw err;
            res.setHeader('Content-Type', 'application/json');            
            res.send(JSON.stringify( {title: "Board", content:rawContent, replyPage: reply_pg} ) );            
        });
    })
});
//=== 게시글 작성
router.post('/', upload.array('UploadFile'),function(req, res){
    // field name은 form의 input file의 name과 같아야함    
    var addNewTitle = req.body.addContentSubject;
    var addNewWriter = req.body.addContentWriter;
    var addNewPassword = req.body.addContentPassword;
    var addNewContent = req.body.addContents;
    var upFile = req.files; // 업로드 된 파일을 받아옴        
    
    if( upFile.length > 0 ){
        makeThumbnails(upFile, function(){            
            addBoard(addNewTitle, addNewWriter, addNewContent, addNewPassword, upFile );
            res.send();
        });
    }else{
        addBoard(addNewTitle, addNewWriter, addNewContent, addNewPassword, upFile );
        res.send();
    }          
});
//=== 게시글 수정
router.put('/', function(req, res){
    var modTitle = req.body.modContentSubject;
    var modContent = req.body.modContents;
    var modId = req.body.modId;    
    var modPassword = req.body.modContentPassword; 

    checkPassword( modId, modPassword, function(isMatch){
        if( isMatch ){
            modBoard(modId, modTitle, modContent);
            res.send();
        }else{
            res.send({error: 'not match password'});
        }
    });    
});
//=== 게시글 삭제
router.delete('/', function(req, res){
    var contentId = req.param('id');
    var delPw = req.param('pw');        
    checkPassword( contentId, delPw, function(isMatch){
        if( isMatch ){        
            BoardContents.update({_id:contentId}, {$set:{deleted:true}}, function(err){
                if(err) throw err;        
                res.send();        
            });
        }else{            
            res.setHeader('Content-Type', 'application/json');
            res.send({error: 'not match password'});
        }    
    });  
});

router.get('/download/:path', function(req, res){
    // file download
    var path = req.params.path;
    res.download('./upload/'+path, path);
    // console.log(path);
});
router.post('/reply', function(req, res){
    // 댓글 다는 부분
    var reply_writer = req.body.replyWriter;
    var reply_comment = req.body.replyComment;
    var reply_id = req.body.replyId;

    addComment(reply_id, reply_writer, reply_comment);
    res.redirect('/boards/view?id='+reply_id);
});
router.get('/reply', function(req, res) {
    // 댓글 ajax로 페이징 하는 부분
    var id = req.param('id');
    var page = req.param('page');
    var max = req.param('max'); // 댓글 총 갯수 확인
    var skipSize = (page-1)*5;
    var limitSize = skipSize + 5;

    if(max < skipSize+5) {limitSize = max*1;} // 댓글 갯수 보다 넘어가는 경우는 댓글 수로 맞춰줌 (몽고디비 쿼리에서 limit은 양의 정수여야함)

    BoardContents.findOne({_id: id}, {comments: {$slice: [skipSize, limitSize]}} , function(err, pageReply){
        if(err) throw err;
        res.send(pageReply.comments);
    });
});
// router.get('/password', function(req, res){
//     // 글 비밀번호 찾아오기
//     var id = req.param('id');
//     BoardContents.findOne({_id: id}, function(err, rawContents){
//        res.send(rawContents.password);
//     });
// });
module.exports = router;

//=== 게시글 추가
function addBoard(title, writer, content, password, upFile){

    var newContent = content.replace(/\r\n/gi, "\\r\\n");

    console.log(  'fn:addBoard> upFile> ' + upFile  );

    var newBoardContents = new BoardContents;
    newBoardContents.writer = writer;
    newBoardContents.title = title;
    newBoardContents.contents = newContent;
    newBoardContents.password = password;

    console.log( '=========== upFile>> ' + upFile.length );
    // console.log( '=========== upFile>> ' + upFile.length );

    newBoardContents.save(function (err) {
        if (err) throw err;
        BoardContents.findOne({_id: newBoardContents._id}, {_id: 1}, function (err, newBoardId) {
            if (err) throw err;

            if (upFile != null) {               
                for (var i = 0; i < upFile.length; i++) {                    
                    // console.dir( upFile[i]);
                    var objFile = upFile[i];
                    BoardContents.update({_id: newBoardId.id}, {$push: {fileUp: objFile.filename + '#' + objFile.path + '#' + objFile.thumbUrl }}, function (err) {
                        if (err) throw err;
                    });
                }
            }
        });
    });
}
//=== 게시글 수정
function modBoard(id, title, content) {
    var modContent = content.replace(/\r\n/gi, "\\r\\n");

    BoardContents.findOne({_id:id}, function(err, originContent){
        if(err) throw err;
        originContent.updated.push({title: originContent.title, contents:originContent.contents});
        originContent.save(function(err){
            if(err) throw err;
        });
    });

    BoardContents.update({_id:id}, {$set: {title: title, contents: modContent, date: Date.now()}}, function(err) {
        if(err) throw err;
    });
}

function addComment(id, writer, comment) {
    BoardContents.findOne({_id: id}, function(err, rawContent){
        if(err) throw err;

        rawContent.comments.unshift({name:writer, memo: comment});
        rawContent.save(function(err){
            if(err) throw err;
        });
    });
}

// check password
function checkPassword(id, pw, callback){        
    // isMatch = false;    
    BoardContents.findOne({_id: id}, function(err, rawContents){                
        var isMatch = false;
        if( rawContents.password === pw ){
            isMatch = true;
        }else{
            isMatch = false;           
        }
        callback( isMatch );        
    });
}

function makeThumbnails(fileDataList, cb){
    var cnt = 0;
    fileDataList.forEach(function(file, idx){
        console.dir(file);
        var width = 100;
        var height = 100;
        var objFile = path.parse(file.filename)
        var stPath = 'uploads/thumbnails/'+ objFile.name + '-' + Date.now().valueOf() + objFile.ext;
        gm(file.path)
        .resize(width, height)
        .noProfile()
        .write(stPath , function(err){        
            if(err){
                console.error(err);
            }
            file.thumbUrl = stPath;
            cnt++;               
            if( cnt === fileDataList.length ){
                cb();
            } 
        })        
    });  
}

/* 미사용: 정리에정
function isSaved(upFile) {
    // 파일 저장 여부 확인해서 제대로 저장되면 디비에 저장되는 방식
    var savedFile = upFile;
    var count = 0;

    if(savedFile != null) { // 파일 존재시 -> tmp폴더에 파일 저장여부 확인 -> 있으면 저장, 없으면 에러메시지
        for (var i = 0; i < savedFile.length; i++) {
            if(fs.statSync(getDirname(1) + savedFile[i].path).isFile()){ //fs 모듈을 사용해서 파일의 존재 여부를 확인한다.
                count ++; // true인 결과 갯수 세서
            };

        }
        if(count == savedFile.length){  //올린 파일 갯수랑 같으면 패스
            return true;
        }else{
            return false;
        }
    }else{ // 파일이 처음부터 없는 경우
        return true;
    }
}
*/