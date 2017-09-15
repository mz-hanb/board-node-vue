/*** 게시물 db 스키마 ***/
var mongoose = require('mongoose');
var bcrypt = require('bcrypt-nodejs');


var userSchema = mongoose.Schema({
    name: String,
    email: String,
    password: String   
});

// password 를 암호화
userSchema.methods.generateHash = function(password){
    return bcrypt.hashSync(password, bcrypt.genSaltSync(8), null);
};

// password 의 유효성 검증
userSchema.methods.validPassword = function(password){
    console.log(this.password);
    return bcrypt.compareSync(password, this.password );
}

module.exports = mongoose.model('User2', userSchema);
