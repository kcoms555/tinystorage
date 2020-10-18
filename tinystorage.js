const app = require('express')();
const async = require('async');
const bodyParser = require('body-parser');
const readConfig = require('read-config');

//they can be set by config.json
var config = {}
var use_public = true;
var auth_keys = [];
var PORT = 3003;
var limit = '1kb';

try{
	config = readConfig('config.json');
	if(config.use_public == false) use_public = false;
	if(config.auth_keys) auth_keys = config.auth_keys;
	if(config.port) PORT = config.port;
	if(config.limit) limit = config.limit;
} catch(error){
	console.log('config file \'config.json\' is not found. It will accept all users');
}

console.log('Server settings : ');
console.log(`	auth_keys : ${auth_keys}`);
console.log(`	use_public : ${use_public}`);
console.log(`	port : ${PORT}`);
console.log(`	limit : ${limit}`);


const public_data = {};
const private_data = {};
const data = {};

const CODE_ERROR = 0;
const CODE_POST_SUCCESS = 1;
const CODE_GET_SUCCESS = 2;

const ERROR_UNKNOWN = 0;
const ERROR_NOT_FOUND_DICT_KEY = 1;
const ERROR_NEED_DICT_KEY = 2;
const ERROR_NOT_VALID_AUTH_KEY = 3;
const ERROR_NOT_FOUND_AUTH_KEY = 4;

const HTTP_OK = 200;
const HTTP_OK_ANYWAY = 201;
const HTTP_USER_ERROR = 400;
const HTTP_SERVER_ERROR = 500;


//express setting
app.use(bodyParser.raw({'inflate': true, 'limit': limit, 'type': '*/*'}));
//app.use(bodyParser.urlencoded({extended: true}));
app.use(function(req, res, next){
	res.setHeader("content-Type", "application/json");
	next();
});


//async wrapper setting. It enables async routers
const wrapper = asyncFn => {
	return (async (req, res, next) => {
		try {
			return await asyncFn(req, res, next);
		} catch (error) {
			return SEND(req, res, {'ts_status':CODE_ERROR, 'errorcode':error});
		}
	});
};

const SEND = async (req, res, msg)=>{
	var status = HTTP_SERVER_ERROR;
	var errormsg = ''
	console.log(msg);
	switch(msg.ts_status){
		case CODE_ERROR:
			switch(msg.errorcode){
				case ERROR_NOT_FOUND_AUTH_KEY: errormsg = `auth_key \'${req.params.auth_key}\' is not found`; break;
				case ERROR_NOT_FOUND_DICT_KEY: errormsg = `dict_key \'${req.params.dict_key}\' is not found`; break;
				case ERROR_NOT_VALID_AUTH_KEY: errormsg = `auth_key \'${req.params.auth_key}\' is not valid`; break;
				case ERROR_NEED_DICT_KEY: errormsg = 'need dict_key'; break;
				default: errormsg = 'unknown error';
			}
			console.log(`${req.headers['x-real-ip']} got errormsg: ${errormsg}`);
			status = HTTP_USER_ERROR;
			break;
		case CODE_POST_SUCCESS:
			console.log(`${req.headers['x-real-ip']} posts : [${req.params.auth_key}][${req.params.dict_key}]=${req.body}`);
			if( msg.is_inuse ) status = HTTP_OK_ANYWAY;
			else status = HTTP_OK;
			break;
		case CODE_GET_SUCCESS:
			console.log(`${req.headers['x-real-ip']} gets : [${req.params.auth_key}][${req.params.dict_key}]=${msg.message}`);
			status = HTTP_OK;
			break;
		default:
			console.log(`unknown ${ts_status}`);
			console.log(`${req.headers['x-real-ip']}: ${req.body}`);
			status = HTTP_SERVER_ERROR;
	}
	if( status == HTTP_USER_ERROR ) return res.status(status).send(errormsg);
	if( msg.ts_status == CODE_GET_SUCCESS) return res.status(status).send(msg.message);
	else return res.status(status).send();
};

function verify_auth_key(auth_key){
	if( use_public ) {} // If use_public is true, then It does not care auth_key
	else if( !(auth_keys.includes(auth_key)) ) throw(ERROR_NOT_VALID_AUTH_KEY);
	return true;
}

app.post('/:auth_key/:dict_key', wrapper( async (req, res, next) =>{
	const auth_key = req.params.auth_key;
	const dict_key = req.params.dict_key;
	verify_auth_key(auth_key);
	if( !req.params.dict_key ) throw(ERROR_NEED_DICT_KEY);

	if( !(auth_key in data) ) data[auth_key] = {};

	var is_inuse = false;
	if( dict_key in data[auth_key] ) is_inuse = true;
	data[auth_key][dict_key] = req.body;
	return SEND(req, res, {'ts_status':CODE_POST_SUCCESS, 'is_inuse':is_inuse});
}));

app.get('/:auth_key/:dict_key', wrapper( async (req, res, next) =>{
	const auth_key = req.params.auth_key;
	const dict_key = req.params.dict_key;
	verify_auth_key(auth_key);
	if( !req.params.dict_key ) throw(ERROR_NEED_DICT_KEY);
	if( !(auth_key in data) ) throw(ERROR_NOT_FOUND_AUTH_KEY);

	var msg = '';
	if( dict_key in data[auth_key] ) msg = data[auth_key][dict_key];
	else throw(ERROR_NOT_FOUND_DICT_KEY);
	delete data[auth_key][dict_key];
	return SEND(req, res, {'ts_status':CODE_GET_SUCCESS, 'message':msg});
}));

app.listen(PORT, () => {
	console.log(`port ${PORT} open!\n`);
});
