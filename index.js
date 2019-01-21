const http = require("http"),
  { urlparser, extend, isArray } = require("ps-ultility");
function server( host ){
  class newServer {
    constructor( host ){
      let  { protocol, address, port, path } = typeof host === "string"
        ? urlparser( host ) : host;
      this.protocol = protocol;
      this.hostname = address;
      this.port = port;
      this.path = path;
    }
    request( method, path, param ) {
      let option = this.makeOption( method, path );
      return request.call(this, option, param );
    }
    get( path, param ) {
      return this.request( "get", path, param );
    }
    post( path, param ){
      return this.request( "post", path, param );
    }
    service( name ){
      let clone = extend({}, this), ins;
      clone.path = "/" + joinPath( clone.path, name );
      clone.address = clone.hostname;
      ins = new newServer( clone );
      ins.parent = this;
      return ins;
    }
    setBasePath( path ) {
      this.path = path;
      return this;
    }
    makeOption( method, path ){
      return {
        protocol : this.protocol + ":",
        hostname : this.hostname,
        port : this.port,
        path : "/" + joinPath( this.path, path ),
        method : method.toUpperCase(),
        headers: {
          'Content-Type': 'application/json;charset=UTF-8'
        }
      }
    }
  }
  function joinPath(){
    let args = [].slice.call(arguments);
      return args.reduce(function(a, b){
        return a.concat( b.split("/").filter( n => n) );
      }, []).join("/");
  }
  function toString( str ){
    try {
      if(!isArray( str ) && typeof str !== "undefined"){
        str = [str];
      }
      str = JSON.stringify(str);
    } catch ( e ){
      console.warn( str );
    } finally {
      if(typeof str === "string" || typeof str === "number"){
        return str;
      } else {
        return "[]";
      };
    }
  }
  function getRoot( obj ){
    while( obj.parent ){
      obj = obj.parent;
    }
    return obj;
  }
  function request(option, param){
    let rootNode = getRoot(this);
    return new Promise((resolve, reject) => {
      let req = http.request(option, res => {
        let data = "";
        rootNode.cookies = rootNode.cookies || res.headers["set-cookie"];
        res.on("data",  chunk => {
          data += chunk.toString();
        });
        res.on("end", d => {
          let json = JSON.parse( data );
          if( json.code == 0 ){
            resolve( json.data );
          } else {
            reject( json );
          }
        })
        res.on("error", e => {
          reject( e );
        })
      });
      param = toString( param );
      if( rootNode.cookies ){
        req.setHeader( "cookie", rootNode.cookies.join(",") );
      }
      req.write( param );
      req.on("error", e => {
        reject( e );
      })
      req.end()
    })
  }
  return new newServer( host )
}
module.exports = server;
