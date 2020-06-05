/* jshint esversion: 6*/
/* jslint node: true */
// jshint ignore: start

const path = require("path");
const express = require('express');
const sqlite3 = require('sqlite3').verbose();
var db = new sqlite3.Database('m.db');
const Promise = require('bluebird');

var bodyParser = require('body-parser');

const app = express();
const port = process.env.PORT || 7000;

app.use(bodyParser.json()); // support json encoded bodies
app.use(bodyParser.urlencoded({ extended: true })); // support encoded bodies


app.use(express.static('public'));

app.get('/',function(req,res){
     res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.get('/api/texts', async (req, res, next) => {
  try {    
    // const posts = await db.all('select f.id, f.title, count(l.id) as qty from   catspaw_folders as f left  join  catspaw_links as l  on f.id = l.fid group by f.id'); // <=
	db.all("select strings.p, strings.form as v, strings.seq, strings.token_id as tid, tokens.token as t, tokens.meta as cl from strings left  join tokens on strings.token_id = tokens.id", function(err, rows) {
		res.send(rows);
	});
    
	
  } catch (err) {
    next(err);
  }
});

app.post('/api/tokens', function(req, res){
	var id = req.body.id;
    var props = req.body.props;
	console.log(id, props); 
    db.run("UPDATE tokens SET meta = ? WHERE id = ?", [props, id], function(err, row){
        if (err){
            console.err(err);
            res.status(500);
        }
        else {
            res.status(202);
        }
        res.end();
    });
	// res.status(500)
	// res.send('error', { error: err })
	// res.send()
});



app.listen(port);  
// while(true){};

console.log("Running at Port "+ port);
