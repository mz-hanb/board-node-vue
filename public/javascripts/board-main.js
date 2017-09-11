/** *********************************************
 * vue
 * *********************************************/


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
    onEditable: false,
    onReply: false,
    replies: [],
    onShowReplies: false,
    replyWriter: '',
    replyComment: ''
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

      $.get(`api/boards/get-list?page=${page}&searchWord=${searchWord}`, function (data, status) {
        self.items = data.contents;
        thisPage.total = data.pagination; // 총 페이지 수                
        //--- 페이지네이션 그룹식별(한 페이지네이션 3페이지씩 보여줌 )을 위해
        for (var i = 0; i < thisPage.total; i++) {          
          thisPage.list.push({ page: i + 1, pageGroup: Math.ceil((i + 1) / thisPage.groupLimit) });
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
    showDetail(id) {
      var self = this;
      $.get(`api/boards/view?id=${id}`, function (data, status) {
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
    addItemSubmit() {
      // if (this.newItem.title === '' || this.newItem.writer === '' || this.newItem.password === '' || this.newItem.contents === '') {
      //   alert('제목과 내용, 작성자 비밀번호 모두 있어야합니다.');
      //   return;
      // }
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
    modifyItem() {
      this.onModify = "readonly";
      this.detail.contentsOri = this.detail.contents; 
      this.modPw = '';    
    },
    
    // 수정완료
    modifyItemComp() {     
      this.detail.contentsOri = this.detail.contents;
      var self = this;          
      
      $.ajax({
        type: 'POST',
        url: 'api/boards?_method=PUT',
        data: $('#modify-action').serialize(),
        async: false,
        success(data) {
          if (data.notice) {
            alert('비밀번호가 일치하지 않습니다.');
          } else {
            self.initView();
            self.getPage();
          }
        }
      });
    },
    modifyItemCancle() {    
      this.onModify = false;
      $('.add-files li').css('display', 'block');  
      this.modPw = '';
      this.detail.contents = this.detail.contentsOri;
    },
    deleteItem() {
      var self = this;
      $.ajax({
        type: 'POST',
        url: `api/boards?_method=DELETE&id=${this.detail._id}&pw=${this.delPw}`,
        success(data) {
          if (data.notice) {
            alert('비밀번호가 일치하지 않습니다.');
          } else {
            self.initView();
            self.getPage();
          }
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
      var endNum = thisPage.groupCurrent *thisPage.groupLimit;          
      if( endNum > this.objPage.total ) endNum = this.objPage.total;

      thisPage.listCurrent = thisPage.list.slice(startNum, endNum);  
      console.dir(  thisPage.listCurrent  );   
    },
    // reply 
    addReply(){
      var self = this;           
      $.ajax({
        type: 'POST',
        url: 'api/boards/reply',
        data: $('#add-reply').serialize(),
        async: false,
        success(data) {
          self.initView();
          self.getPage();
        }
      });   
    } 
  }
});

boardList.getPage();
