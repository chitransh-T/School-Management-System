import mysql from 'mysql'
var connection = mysql.createPool({
    host:'localhost',
    user:'root',
    password:'',
    database:'sms',
    port:3307
})
export default connection;