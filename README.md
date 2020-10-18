# tinystorage
__Tiny Cloud Storage Server__  
It serves a tiny storage and can be used as a short-term tiny data transfer service and etc.

## Example
#### Sender
`curl http://jeto.ga/api/tinystorage/guest/source_code.c --data-binary @source_code.c`  
Upload a file to the server.  
#### Receiver
`wget http://jeto.ga/api/tinystorage/guest/source_code.c`  
Download it from the server.  

## Test Server
`http://jeto.ga/api/tinystorage`  
If it is not available, then send me a mail.  
Any `auth_key` is acceptable.  

## Installation
__1. Download or clone it__  
```
git clone https://github.com/kcoms555/tinystorage
```
__2. Go to the tinystorage directory__  
```
cd tinystorage
```
__3. Install dependencies__  
```
npm install
```
or
```
npm install body-parser express read-config async
```
__4. Run Server__  
```
node tinystorage.js
```

# API

## Upload data
#### Request
`POST /{auth_key}/{dict_key}`
``` bash
curl http://jeto.ga/api/tinystorage/guest/mymessage -d "I am tinystorage !"  
```
`auth_key` is a key registered to the server. If `use_public` option is true, then any value for `auth_key` is acceptable.
`dict_key` is a dictionary key. Any value for `dict_key` is acceptable.  

It will upload a message "I am tinystorage !" to the server on '/guest/mymessage'.  
Anyone having valid auth_key can upload anything he wants.
#### Response
```
HTTP/1.1 200 OK
Date: Sat, 26 Sep 2020 17:39:05 GMT
Content-Type: application/json
Transfer-Encoding: chunked
Connection: keep-alive
X-Powered-By: Express
```
## Download data
#### Request
`GET /{auth_key}/{dict_key}`
``` bash
curl http://jeto.ga/api/tinystorage/guest/mymessage
```
It will download a message "I am tinystorage !" from the on '/guest/mymessage'.  
Anyone having valid auth_key can download anything he needs.  
Once data is read, then it will be deleted.  
#### Response
```
HTTP/1.1 200 OK
Date: Sat, 26 Sep 2020 17:42:16 GMT
Content-Type: application/json
Content-Length: 18
Connection: keep-alive
X-Powered-By: Express
ETag: W/"12-Y5fDOSAhmtW9uFIFMK1cfvw+/Vo"

I am tinystorage !
```
## HTTP Status Code
`HTTP 200` : Successfully uploaded or downloaded.  
`HTTP 201` : Successfully overwritten.  
`HTTP 400` : auth_key or dict_key or data is not available.  
`HTTP 500` : Server Internal Error.  

## Configuration
Open `config.json` and write it as you need.  
* `auth_keys` : A list for `auth_key`s. A `auth_key` in `auth_keys` is valid when `use_public` is `false`.  
* `use_public` : if true, any `auth_key` is accepable.  
* `port` : A server port.  
* `limit` : Limit of data size to upload.  

## Known Problems (will be fixed)
* There is no limit to upload.  
* Data that is not read is on the memory as long as the server is alive.  
* If the server is closed, there is no way to restore data not read.
