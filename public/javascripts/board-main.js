/** *********************************************
 * vue
 * *********************************************/
Vue.component('reply', {
  template: `
  <div>
    <p class=""><span class="">작성자: </span>{{writer}}</p>   
    <p class=""><span class="">내용: </span>{{memo}}</p> 
    <input type="text" placeholder="비밀번호를 입력해주세요." name="replyDelPw" v-model="replyDelPw">
    <button type="button" @click="delReply">댓글삭제</button></div>
  </div>
  `,
  props: [
    'writer', 'memo', 'parent'
  ],  
  data(){
    return{
      replyDelPw: ''
    }
  }, 
  methods: {    
    updateVal(val){
      this.$emit('input', pw);
    },
    delReply(){
      // console.log( '////' + this.replyDelPw );
      var self = this;
      $.ajax({
        type: 'POST',
        url: `api/boards-reply?_method=DELETE&id=${this.parent}&pw=${this.replyDelPw}`,
        success( status, data ) {
          if (status) {
            alert('비밀번호가 일치하지 않습니다.');
          } else {            
            self.$emit('secess');
            console.log( ' ///// success ' );
          }
        }, 
        error(status){
          alert('');
        }
      }); 
    }
  }

});

// 게시판
const boardList = new Vue({
  el: '#v-board',
  data: {
    items: [],
    itemNumPerPage: 2, // 페이지별 게시글 수
    objPage: {
      list: [],
      listCurrent: [],
      total: 1,
      pageCurrent: 1, // 현재 페이지 번호
      groupTotal: 1, // 총 page group 수 
      groupCurrent: 1, // 현재 page group 번호
      groupLimit: 5 // 한 그룹당 보여지는 페이지 수
    },
    detail: {},
    detailPre: {},
    loadedList: [],
    addFile: {
      onAdded: false,
      list: []
    },
    modPw: '', 
    delPw: '',    
    newItem: {
      title: '',
      writer: '',
      password: '',
      contents: '',
    },
    searchWord: '',
    onDetail: false,
    onAddNew: false,    
    onModify: false,    
    onReply: false,
    replies: [],
    onShowReplies: false,
    replyWriter: '',
    replyComment: '', 
    replyAddPw: ''
  },
  mounted(){    
  },
  created(){    
  },  
  computed: {
    // 첨부파일 수정시 사용자가 파일을 제했는지 목록
    modifyFileList(){      
      var list = [];
      $('.add-files li').each(function(idx, item){
        if( $(item).css('display') === 'none' ){
          list.push('removed');
        }else{
          list.push('exist');
        }
      });            
      return list.toString();
    },
    onEditable(){
      if( this.onModify ){
        return !this.onModify;
      }else{
        return 'readonly'
      }
    }
  },
  methods: {
    //--- 게시글 번호
    getListNum(idx){      
      return (this.objPage.pageCurrent-1) * 2 + idx + 1;
    },
    getPage(page, searchWord) {            

      var self = this;
      var thisPage = this.objPage;      
      // page 
      if (page === null || page === undefined) page = 1;
      thisPage.pageCurrent = page; 
          
      // search word
      if (searchWord === null || searchWord === undefined) searchWord = '';

      // $.get(`api/boards/get-list?page=${page}&searchWord=${searchWord}`, function (data, status) {
      $.get(`api/boards?page=${page}&searchWord=${searchWord}`, function (data, status) {
        // $.get(`api/boards/${page}?searchWord=${searchWord}`, function (data, status) {
        self.items = data.contents;

        //=== pagenation
        thisPage.total = data.pagination; // 총 페이지 수     
        thisPage.list = [];                          

        var pageNum = 0;
        var pageGropNum = 0;

        for (var i = 0; i < thisPage.total; i++) {
          pageGropNum = Math.ceil((i + 1) / thisPage.groupLimit);          
          pageNum = i+1;

          thisPage.list.push({
            page: pageNum,
            pageGroup: pageGropNum
          });
          // console.log(i + '> ' + pageNum + '// ' + pageGropNum);
        }             
        // 그룹 총 개수
        thisPage.groupTotal = Math.ceil(thisPage.total / thisPage.groupLimit);        

        // 현재페이지의 페이지그룹 알아내기: 페이지네비의 보여줄 그룹을 셋팅하기 위해
        var objCurrentPage = thisPage.list.filter(function (item, index, array) {
          if (item.page === page) return item;
        });
        thisPage.groupCurrent = objCurrentPage[0].pageGroup;            

        self.getCurrentPageList();           
      });
      
    },
    // 게시글 보기
    showDetail(id) {
      var self = this;
      // $.get(`api/boards/view?id=${id}`, function (data, status) {
      $.get(`api/boards/${id}`, function (data, status) {
        self.detail = data.content;
        self.items.forEach(function (item, idx) {
          if (item._id === self.detail._id) item.count++;
        });
        self.initView();
        self.onDetail = true;

        // console.dir( self.detail );
        if (data.content.fileUp.length > 0) {
          self.addFile.onAdded = true;
          self.setLoadedFile(data.content.fileUp);
        } else {
          self.addFile.onAdded = false;
        }
        // console.log( self.detail.comments );
        self.replies = self.detail.comments;   
        self.replyWriter = ''; 
        self.replyComment = '';   
        self.replyAddPw = '';
        // console.log( 'shoeDetail> ' + self.detail.title);
      });
    },
    setLoadedFile(list) {
      this.loadedList = [];
      for (var i = 0; i < list.length; i++) {
        if (list[i].exist) this.loadedList.push(list[i]);
      }
    },
    searchItemSubmit() {
      console.log(this.searchWord);
      if (this.searchWord === '') {
        alert('검색어를 입력해주세요!!!');
      } else {
        this.getPage(1, this.searchWord);
      }
    },
    // 새글 작성
        addItemSubmit() {      
      var self = this;
      var form = $('#write-action')[0];
      var formData = new FormData(form);
      $.ajax({
        type: 'POST',
        url: 'api/boards',
        processData: false,
        contentType: false,
        data: formData,
        success(result) {
          self.initView();
          self.getPage();
        },
        error(req, status, error){
          alert(req.responseText);
        }
      });
    },
    addItemCancle() {
      this.onAddNew = false;
    },
    //=== 게시글 수정
    modifyItem(){
      this.detail.contentsOri = this.detail.contents;
      this.detail.titleOri = this.detail.title;
      this.modPw = '';
      this.onModify = true;
    },    
    modifyItemComp(){
      var self = this;
      
      $.ajax({
        type: 'POST',
        url: 'api/boards?_method=PUT',
        data: $('#modify-action').serialize(),
        async: false,
        success(data){
          self.initView();
          self.getPage();
        },
        error(status){
          alert('비밀번호가 일치하지 않습니다.');
        }
      });
    },
    modifyItemCancle() {    
      this.onModify = false;
      $('.add-files li').css('display', 'block');  
      this.modPw = '';
      this.detail.contents = this.detail.contentsOri;
      this.detail.title = this.detail.titleOri;            
    },
    //=== 게시글 삭제
    deleteItem() {
      var self = this;
      $.ajax({
        type: 'POST',
        url: `api/boards?_method=DELETE&id=${this.detail._id}&pw=${this.delPw}`,
        success( status, data ) {
          if (status) {
            alert('비밀번호가 일치하지 않습니다.');
          } else {
            self.initView();
            self.getPage();
          }
        }, 
        error(status){
          alert('');

        }
      });
    },
    deleteItemCancle() {
      // this.onDetail = false
    },
    formateDate(date) {
      return moment(date).format('YYYY-MM-DD, h:mm:ss a');
    },
    showAddNew() {
      this.initView();
      this.onAddNew = true;
    },
    initView() {
      this.onDetail = false;
      this.onAddNew = false;
      this.onModify = false;
      this.delPw = '';

      for (var key in this.newItem) {
        this.newItem[key] = '';
      }
    },
    goPrevPageGroup() {
      this.objPage.groupCurrent--;
      this.getCurrentPageList();
    },
    goNextPageGroup() {
      this.objPage.groupCurrent++;
      this.getCurrentPageList();
    },
    getCurrentPageList() {
      if( this.objPage.groupCurrent <= 0 ){
        this.objPage.groupCurrent = 1;
        return;
      } 
      if( this.objPage.groupCurrent > this.objPage.groupTotal ){
        this.objPage.groupCurrent = this.objPage.groupTotal;
        return;
      } 
      var thisPage = this.objPage;      
      var startNum = (thisPage.groupCurrent-1) *thisPage.groupLimit;
      var endNum = thisPage.groupCurrent * thisPage.groupLimit;                
      if( endNum > this.objPage.total ) endNum = this.objPage.total;

      thisPage.listCurrent = thisPage.list.slice(startNum, endNum);        
    },
    //=== reply 
    addReply(){
      var self = this;           
      $.ajax({
        type: 'POST',
        // url: 'api/boards/reply',
        url: 'api/boards-reply',
        data: $('#add-reply').serialize(),
        async: false,
        success(data) {          
          self.showDetail(self.detail._id);
          
        }
      });   
    }
  }
});

boardList.getPage();
