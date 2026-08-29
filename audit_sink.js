const fs=require('fs');
class JsonlAuditSink{
  constructor(file){if(!file)throw new Error('AUDIT_FILE_REQUIRED');this.file=file}
  write(event){
    const safe={ts:Date.now(),type:event.type||'audit',...event};
    fs.appendFileSync(this.file,JSON.stringify(safe)+'\n',{encoding:'utf8',mode:0o600});
    return safe;
  }
}
module.exports={JsonlAuditSink};
