const http = require('http');
const openurl = require('openurl').open;
const express = require('express');
const fs = require('fs');
const path = require('path');
const glob = require("glob")
const hostname = 'localhost';
const port = 3000;
const baseurl =`http://${hostname}:${port}/`;

const ffProfilePath = 'C:/Users/hbb/AppData/Roaming/Mozilla/Firefox/Profiles/w877j3gm.default/';
const musicDirs = ['E:/Music', 'E:/DLs/#music/lib']

const sqlite3 = require('sqlite3').verbose();
const db = new sqlite3.Database(path.join(ffProfilePath, 'places.sqlite'), sqlite3.OPEN_READONLY);


function getMusicBookmarks(ffProfile, cb) {
  db.get("SELECT id FROM moz_bookmarks WHERE guid = 'tags________'", (err, row) => {
    var tagId = row.id;
    db.get(`SELECT id FROM moz_bookmarks WHERE parent = ${tagId} and title = 'music'`, (err, row) => {
      var musicId = row.id;
      db.all(`SELECT title.title, url.url FROM moz_bookmarks AS tag JOIN moz_bookmarks AS title ON tag.fk = title.fk AND title.title IS NOT NULL JOIN moz_places AS url ON title.fk = url.id WHERE tag.parent = ${musicId} AND url LIKE '%youtube.com/watch?v=%'`, (err, rows) => {
        if (typeof cb == 'function') {
          cb(rows);
        }
      });
    });
  });
}
function getMusicFiles(dirs, cb) {
  var collection = [];
  var waitHandles = dirs.length;
  dirs.forEach((dir, i) => {
    glob(dir + '/**/*.mp3', {}, function (err, subCollection) {
      collection = collection.concat(subCollection.map(p => path.join('/music', i.toString(), p.substr(dir.length)).replace(/\\/g,'/')));
      if (--waitHandles == 0 && typeof cb == 'function') cb(collection);
    });
  });
}

const app = express();

var parseUrl= require('parseurl')
app.use(express.static(__dirname));
musicDirs.forEach((dir, i) => {
  app.use(`/music/${i}/`, express.static(dir));
});

function startServer() {
  app.listen(port, function () {
    console.log(`Server running at ${baseurl}`);
    openurl(baseurl);
  });
}

var bookmarks;
var files;
function init() {
  getMusicFiles(musicDirs, f => {
    files = f;
    getMusicBookmarks(ffProfilePath, b => {
      bookmarks = b;
      startServer();      
    });
  });
}

app.get('/api/list-bookmarks', (req, res) => {
  res.send(bookmarks);
});

app.get('/api/list-local', (req, res) => {
  res.send(files);
});



init();