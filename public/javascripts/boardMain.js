$(function(){
  /*
var page = location.href.split("page=")[1]; // url에 page 넘버로 구분
var index = page - 1; // 0부터 시작이므로 1 빼줌
var $boardDetailDel = $('.boardDetailDel');


var fileUp = '{{ detail.fileUp }}';
var files = '';
var cnt = '';
var output = '';
if (fileUp != "") {
  files = fileUp.split(',');
  cnt = files.length;
  for (var i = 0; i < cnt; i++) {
    output += "<button type='button' onclick=downloadFiles('" + files[i].split(':')[0] + "');>";
    output += "<span id='downloadFile'>" + files[i].split(':')[1] + "</span>";
    output += "</button>";
  }
} else {
  output = "파일이 없습니다.";
}
$('.download-file').html(output);

var storage = {
  currentObj: {}
}
*/

// if (page == null) { // 메인화면에서는 page 쿼리가 없으므로 빈값일 때
//   $(".pagination a:eq(0)").attr('class', 'current-page');
// }

// $(".pagination a:eq(" + index + ")").attr('class', 'current-page');

/***********************************************
 * vue
 * *********************************************/

// 게시판
var boarList = new Vue({
  el: '#v-board',
  data: {
    items: [],
    pages: '1', 
    detail: {}, 
    onDetail: false,
    onAddNew: false,
    onModify: false
  },    
  computed: {    
    
  },
  methods: {    
    getDetail: function(id) {
      var self = this;
      $.get('/boards/view?id=' + id, function(data, status) {
        self.detail = data.content;                 
        self.items.forEach(function(item, idx){
          if(item._id == self.detail._id ) item.count++;
        });
        self.initView();
        self.onDetail = true;
      })
    },
    getPage: function(page) {      
      var self = this;
      $.get('/boards/get-list?page=1', function(data, status) {
        self.items = data.contents;               
      })      
    },
    addItemComp: function(){

    },
    addItemCancle: function(){
      this.onAddNew = false;      
    },
    modifyItem: function(){
      this.initView();
      this.onModify = true;
    },
    modifyItemComp: function(){

    },
    modifyItemCancle: function(){
      this.onModify = false;      
    },
    deleteItem: function(){
      this.initView();
      // this.onModify = true;
    },
    formateDate: function(date){
      return moment(date).format('YYYY-MM-DD, h:mm:ss a') ;
    },
    showAddNew: function(){
      this.initView();
      this.onAddNew = true;
    },
    initView: function(){
      this.onDetail = false;
      this.onAddNew = false;
      this.onModify = false;
    }
  }
})

boarList.getPage();
console.log( boarList.detailShow );

//--- get board list: 페이지 로딩시 요청
function getList() {
  $.get('/boards/get-list?page=1', function(data, status) {
    boarList.items = data.contents;
    boarList.pages = data.pagination;
    // $('.board-section').hide();
    // $('#searchAction input').val('');
  });
}

//--- show UIs
function showSection(stId) {
  $('.board-section').hide();
  $('#' + stId).show();
  // 새글 입력폼 초기화
  $('#writeAction input').val('');
  $('#writeAction textarea').val('');
}

function cancelWriteForm(option) {
  if (option == 'cancel') $('.write_form').fadeOut();
  if (option == 'ok') $('.content_box').fadeOut();
}

//=== 새글 등록
function submitContents() {
  var title = $('#addContentSubject').val();
  var content = $('#addContents').val();
  var writer = $('#addContentWriter').val();
  var password = $('#addContentPassword').val();

  // 새 글 등록 시
  if (title == '' || content == '' || writer == '' || password == '') {
    alert("제목과 내용, 작성자 비밀번호 모두 있어야합니다.");
    return;
  } else {
    // $('#writeAction').submit();
    uploadFile();
  }
}
//=== upload file
function uploadFile(){
  var form = $('#writeAction')[0];
  var formData = new FormData(form);
  $.ajax({
    url: '/boards?mode=add',
    processData: false,
    contentType: false,
    data: formData,
    type: 'POST',
    success: function(result){
      getList();      
      // alert('success');
    }
  });
}

//=== 검색
function searchContent() {
  if ($('#searchWord').val() === '') {
    alert("검색어를 입력해주세요!!!");
  } else {    
    $.ajax({
      url: '/boards/search',
      data: $('#searchAction').serialize(),      
      success: function(data) {
        boarList.items = data.contents;
      }
    });
  }
}

function downloadFiles(filepath) {
  var path = filepath;
  if (confirm("파일이 다운로드 됩니다.") == true) {
    // location.href = "/boards/download/" + path;
    // getList();
  }
}

//=== 수정
function modifyContents() {
  // 글 수정 버튼 눌렀을 때 화면 전환 시
  showSection('boardModify');
  $('.modSubject').val(boardDetail.detail.title);
  $('.modWriter').text(boardDetail.detail.writer);
  $('.textContents').html(boardDetail.detail.contents);
}

function checkPW(inputPassword) {
  var result = '';

  $.ajax({
    // url: '/boards/password/?id=<%=content._id%>',
    url: '/boards/password/?id=' + boardDetail.detail._id,
    async: false,
    success: function(password) {
      if (inputPassword == password) result = true;
      else result = false;
    }
  });
  return result;
}

//=== 게시글 수정
function modifySubmitContents() {
  // 글 수정후 db 저장 시 비번 확인 후 맞으면 수정으로 submit
  var title = $('#modContentSubject').val();
  var content = $('#modContents').val();
  var inputPassword = $('#modContentPassword').val();
  var chkpw = checkPW(inputPassword);

  if (chkpw == true) {
    if (title == '' || content == '') {
      alert("제목과 내용 모두 있어야합니다.");
      return;
    } else {
      // $('#modifyAction').submit();
      $.ajax({
        type: "POST",
        url: 'boards?mode=modify',
        data: $('#modifyAction').serialize(),
        async: false,
        success: function(data) {
          // boarList.items = data.contents;
          getList();
        }
      });


    }
  } else {
    alert("글 작성 시 입력한 비밀 번호를 입력해주세요");
    return;
  }

}

//=== 취소
function cancelForm(option) {
  if (option == 'modify') {
    // 수정하다 취소시
    $('.content_detail').show();
    $('.modify_form').hide();
  } else {
    $('.delete_confirm').hide();
  }

}
//=== 글지우기 ui 보기
function deleteContents() {
  // 글 삭제시 비번 확인 후 맞으면 삭제로 submit
  $('.boardDetailDel').show();
}

function deleteConfirm() {
  var inputPassword = $('#delPassword').val();
  var chkpw = checkPW(inputPassword);

  if (chkpw == true) {
    // location.href='/boards/delete?id=<%=content._id%>';
    // location.href='/boards/delete?id=' + boardDetail.detail._id;
    $.get('/boards/delete?id=' + boardDetail.detail._id, function(data, status) {
      console.log('//////////////////////////deleteConfirm');
      getList();
    }).fail(function() {
      console.log("fail");
    })

  } else {
    alert("글 작성 시 입력한 비밀 번호를 입력해주세요");
    return;
  }
}

function changePage(page) {
  $.get('/boards/reply?id=<%=content._id%>&page=' + page + "&max=<%=content.comments.length%>", function(replyList) {
    var output = '';
    for (var i = 0; i < replyList.length; i++) {
      output += '<div class="reply_content"><div class="reply_info">' + replyList[i].name + ' / ' + dateFormatChangeScript(replyList[i].date) + '</div>';
      output += '<div class="reply_text">' + replyList[i].memo.replace(/\\r\\n/gi, " ") + '</div></div>';
    }

    $('.reply_list').html(output);
  });

  $.ajax({
    url: '/boards/reply?id=<%=content._id%>&page=' + page + "&max=<%=content.comments.length%>",
    type: "get",
    success: function(data) {
      var output = '';
      for (var i = 0; i < data.length; i++) {
        output += '<div class="reply_content"><div class="reply_info">' + data[i].name + ' / ' + dateFormatChangeScript(data[i].date) + '</div>';
        output += '<div class="reply_text">' + data[i].memo.replace(/\\r\\n/gi, " ") + '</div></div>';
      }

      $('.reply_list').html(output);
    }
  });
}

function dateFormatChangeScript(date) {
  var newdate = new Date(date);
  var options = {
    weekday: "short",
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit"
  };
  return newdate.toLocaleTimeString("ko-KR", options);
}

  
}());

