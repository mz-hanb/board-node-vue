// $(function(){
/*
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
*/

// if (page == null) { // 메인화면에서는 page 쿼리가 없으므로 빈값일 때
//   $(".pagination a:eq(0)").attr('class', 'current-page');
// }

// $(".pagination a:eq(" + index + ")").attr('class', 'current-page');

/***********************************************
 * vue
 * *********************************************/

// 게시판
var boardList = new Vue({
  el: '#v-board',
  data: {
    items: [],    
    objPage: {
      list: [], 
      listCurrent: [],
      total: 1, 
      groupTotal: 1,
      groupCurrent: 1,
      groupLimit: 5
    },        
    detail: {},
    loadedList: [],
    addFile: {
      onAdded: true,
      paths: [],
      names: []
    },
    onAddFile: true,
    delPw: '',
    newItem: {
      title: '',
      writer: '',
      password: '',
      contents: ''
    },
    searchWord: '', 
    onDetail: false,
    onAddNew: false,
    onModify: false
  },
  computed: {},
  methods: {   
    getPage: function(page, searchWord ) {      
      var self = this; 
      var thisPage = this.objPage;
      if( page === null || page === undefined ) page = 1;
      if( searchWord === null || searchWord === undefined ) searchWord = '';

      $.get('/boards-api/get-list?page=' + page + '&searchWord='+searchWord, function(data, status) {
        self.items = data.contents;            
        thisPage.total = data.pagination;        
        
        for( var i = 0; i < thisPage.total; i++){
          // 전체리스트
          thisPage.list.push({page: i+1, pageGroup: Math.ceil( (i+1)/thisPage.groupLimit ) } );
        }
        // 그룹 총 개수 
        thisPage.groupTotal = Math.ceil( thisPage.total / thisPage.groupLimit );
        // 현재페이지의 페이지그룹 알아내기: 페이지네비의 보여줄 그룹을 셋팅하기 위해
        var objCurrentPage = thisPage.list.filter(function(item, index, array){          
          if( item.page === page ) return item;
        });
        thisPage.groupCurrent = objCurrentPage[0].pageGroup;        
        self.getCurrentPageList();                                
      })      
    }, 
    showDetail: function(id) {
      var self = this;
      $.get('/boards-api/view?id=' + id, function(data, status) {
        self.detail = data.content;                 
        self.items.forEach(function(item, idx){
          if(item._id == self.detail._id ) item.count++;
        });
        self.initView();
        self.onDetail = true;   

        console.log( '//////////////// detail' );
        console.dir( self.detail );
        if( data.content.fileUp ){
          self.addFile.onAdded = true;          
          self.setLoadedFile(data.content.fileUp);
        }else{
          self.addFile.onAdded = false;          
        }
      })
    },
    setLoadedFile: function(list){
      this.loadedList = [];              
      for( var i = 0; i < list.length; i++ ){
        var temp = list[i].split('#');
        var obj = {'filename': temp[0], 'filePath': temp[1], 'thumbUrl': temp[2]};
        this.loadedList.push(obj);
      }
    },
    searchItemSubmit: function(){
      console.log( this.searchWord );      
      if( this.searchWord === '' ){
        alert("검색어를 입력해주세요!!!");        
      }else{        
        this.getPage(1, this.searchWord );
      }      
    },    
    addItemSubmit: function(){     
      if( this.newItem.title === '' || this.newItem.writer === ' '|| this.newItem.password === '' || this.newItem.contents === '' ){
        alert("제목과 내용, 작성자 비밀번호 모두 있어야합니다.");
        return;
      }
      var self = this;
      var form = $('#write-action')[0];
      var formData = new FormData(form);
      $.ajax({
        type: 'POST',
        url: '/boards-api',
        processData: false,
        contentType: false,
        data: formData,
        success: function(result){
          self.initView();
          self.getPage();                    
        }
      });
    },
    addItemCancle: function(){
      this.onAddNew = false;      
    },
    modifyItem: function(){
      this.initView();
      this.onModify = true;
    },
    modifyItemComp: function(){
      var self = this;   
      $.ajax({
        type: 'POST',         
        url: '/boards-api?_method=PUT',                
        data: $('#modify-action').serialize(),
        async: false,
        success: function(data) {      
          if( data.error ){
            alert('비밀번호가 일치하지 않습니다.');
          }else{
            self.initView();
            self.getPage();          
          }                 
        }
      });
    },
    modifyItemCancle: function(){
      this.onModify = false;      
    },
    deleteItem: function(){
      var self = this;
      $.ajax({
        type: 'POST',         
        url: '/boards-api?_method=DELETE&id=' + this.detail._id + '&pw=' + this.delPw,
        success: function(data){
          if( data.error ){
            alert('비밀번호가 일치하지 않습니다.');
          }else{
            self.initView();      
            self.getPage();
          }       
        }
      });
    },
    deleteItemCancle: function(){
      // this.onDetail = false      
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
      this.delPw = '';

      for( var key in this.newItem ){
        this.newItem[key] = '';
      }      
    },
    goPrevPageGroup: function(){        
      this.objPage.groupCurrent--;             
      this.getCurrentPageList();
    },
    goNextPageGroup: function(){         
      this.objPage.groupCurrent++;            
      this.getCurrentPageList();
    },
    getCurrentPageList: function(){           
      if( this.objPage.groupCurrent <= 0 ){
        this.objPage.groupCurrent = 1;
        return;
      } 
      if( this.objPage.groupCurrent > this.objPage.groupTotal ){
        this.objPage.groupCurrent = this.objPage.groupTotal;
        return;
      } 
      var thisPage = this.objPage;
      var startNum = (thisPage.groupCurrent-1) *5;
      var endNum = thisPage.groupCurrent * 5;          
      if( endNum > this.objPage.total ) endNum = this.objPage.total;

      thisPage.listCurrent = thisPage.list.slice(startNum, endNum); 
    }    
  }
})

boardList.getPage();
// }());