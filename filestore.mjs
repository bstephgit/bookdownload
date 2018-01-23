import pcloud from "pcloud-sdk-js";
import BoxSDK from 'box-node-sdk';
import fs from 'fs';

function pcloud_download (book_info)
{
    const link = book_info._data.link;
    
    console.log('pcloud: create client.');
    
    const client = pcloud.createClient(link.access_token);
    console.log('pcloud: download file.');
    
    client.downloadfile( parseInt(link.file_id), book_info._folder + link.file_name,
        {
            onBegin: function() {
            console.log('download started.');
            },
            onProgress: function(progress) {
            console.log(progress);
            },
            onFinish: function(data) {
                book_info._event.emit('downloaded')   
            }   
        }).catch((e) => { book_info._event.emit('error',e); } );
}

function box_download (book_info)
{
    const link = book_info._data.link;
    var boxsdk = new BoxSDK({
        clientID: '2en9g8pt7jgu5kgvyss7qbrxgk783212', // required
        clientSecret: 't0nY1UF8AkmKZZp7qPEHWU8i2OG2pZwD' // required
      });
    var client = boxsdk.getBasicClient(link.access_token);

    client.files.getReadStream(link.file_id, null, function(error, stream) {

        if (error) {
            book_info._event.emit('error',error);
        }
        else
        {
            // write the file to disk
            try{
                var progress = { direction: 'download', loaded: 0, total: link.file_size };
                
                var output = fs.createWriteStream(book_info._folder + link.file_name);
                output.on('close', () => {
                    book_info._event.emit('downloaded');
                }) ;
                stream.on('data', (d) => {
                    progress.loaded += d.length;
                    console.log(progress); 
                } );
                stream.pipe(output);
            }
            catch(err)
            {
                book_info._event.emit('error',err);
            }
            
        }
    });
}

function FileStore(book_info)
{
    this._book_info = book_info;
}

FileStore.prototype.downloadFile = function ()
{
    const vendor = this._book_info._data.link.vendor_code;
    if(vendor === 'PCLD')
    {
        pcloud_download(this._book_info); 
    }
    else if(vendor === 'BOX')
    {
        box_download(this._book_info);
    }
    else
    {
        var err = new Error('Vendor ' + vendor + ' not handled');
        this._book_info._event.emit('error',err);
    }
}



export default FileStore;