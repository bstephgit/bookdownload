import https from 'https';
import vm from 'vm';
import util from 'util';
import events from 'events';
import FileStore from './filestore';
import path from 'path';

function BookInfo(bookid,dest_folder)
{
    var self = this;
    self._options = {
        hostname: 'albertdupre.byethost13.com',
        port: 443,
        path: '/books/rest.php?bookid=' + bookid,
        rejectUnauthorized: false,
        method: 'GET',
        auth: 'b13_17778490:tecste1'
    };
    self._folder = dest_folder;
    self._event = new events.EventEmitter();
    self.on('bookdata', (info) => {
        self._data = info;
    });

    self.on('error', (e) => { console.error(e); } );

    self._doRequest(self._options,self._onReq );
}

BookInfo.prototype.on = function (event_name,cb)
{
    this._event.addListener(event_name,cb);
}
BookInfo.prototype._runScripts = function(scripts,sandbox) {
    
    vm.createContext(sandbox);
    for(var i=0;i<scripts.length;++i)
    {
        vm.runInContext(scripts[i],sandbox);
    }
    return sandbox;
}

BookInfo.prototype._doRequest = function (options,cb)
{
    var self = this;
    var req = https.get(options);
    req.on('error', (e) => {
        self._event.emit('error',e);
    });
    req.on('response', (res) => {
        var bufarray = [];
        res.on('data', (d) => { bufarray.push(d) });
        res.on('end', (res) => {  
            cb.call( self, Buffer.concat(bufarray) );
        });
    } );
    req.end();
}

BookInfo.prototype._onReq = function(buf)
{
    var self = this;
    var str = buf.toString();
    var reg = str.match(/<\s*script\s*type=[',"].+[',"]\s*src=[',"](.+)[',"]\s*>/);
    if(reg!=null)
    {
        var options = Object.assign({}, self._options);
        options.path = reg[1];

        self._doRequest(options, (script_buffer) => {

            var scripts = [];
            scripts.push( script_buffer.toString() );
            reg = str.match(/<\s*script\s*>([\s\S]*?)<\/\s*script\s*>/);
            if(reg!=null)
            {
                scripts.push(reg[1]);
            }
            const sandbox = { document: {}, location: {} };
            
            var script_result = self._runScripts(scripts,sandbox);
            self._options.headers = { cookie: sandbox.document.cookie };
                        
            self._doRequest(this._options,this._onReq);            
        });
    }
    else
    {
        try{
            var info_obj = JSON.parse(str);
            self._event.emit('bookdata', info_obj);
        }
        catch(e)
        {
            self._event.emit('error', e);
        }
    }
}

function main(argv)
{
    if(argv.length>2)
    {
        var bookid = argv[2];
        var dest_folder = '';
        if(argv.length>3)
        {
            dest_folder = argv[3];
            var len = dest_folder.length;
            if(len>0 && dest_folder[len-1]!==path.sep)
            {
                dest_folder = dest_folder.concat(path.sep);
            }
        }
        console.log('destination folder:',dest_folder);
        var book_info = new BookInfo(bookid,dest_folder);
        book_info.on('downloaded', () => { console.log('main : file downloaded to',dest_folder+book_info._data.link.file_name);});
        book_info.on('bookdata', (data) => {
            //console.log(data);
            var filestore = new FileStore(book_info);
            filestore.downloadFile();
        } );
    }
    else
    {
        console.error('bad args number: book id expected');
    }

}




main(process.argv);