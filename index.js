/**
 * Created by gsolovyev on 5/3/15.
 */
var request = require('request');
var js2xmlparser = require('js2xmlparser');
var ERR_UNKNOWN = "UNKNOWN";
var USER_AGENT = "zmsoap";
getAdminAuthToken = function(hostName,adminLogin,adminPassword,cb) {
    var adminURL = getAdminURL(hostName);
    var authRequestObject = {
        "AuthRequest": {
            "@": {
                "xmlns": "urn:zimbraAdmin"
            },
            name: adminLogin,
            password: adminPassword
        }
    };
    var req = makeSOAPEnvelope(authRequestObject,"",USER_AGENT);
    request({
            method:"POST",
            uri:adminURL,
            headers: {
                "Content-Type": "application/soap+xml; charset=utf-8"
            },
            body: req,
            strictSSL: false,
            jar: false,
            timeout: 10000
        },
        function(err,resp,body) {
            if(err != null) {
                cb(err,null);
            } else {

                var result = processResponse(body);
                if(result.err != null) {
                    cb(err,null);
                } else if(result.payload.Body.AuthResponse != null) {
                    cb(null,result.payload.Body.AuthResponse.authToken[0]._content);
                } else {
                    cb({"message":"Error: could node parse response from Zimbra ","resp":resp,"body":body});
                }
            }

        });
}

getUserAuthToken = function(hostName,login,password,cb) {
    var soapURL = getUserSoapURL(hostName);
    var authRequestObject = {
        "AuthRequest": {
            "@": {
                "xmlns": "urn:zimbraAccount"
            },
            account: {
                "@":{
                    "by":"name"
                },
                "#":login
            },
            password: password
        }
    };
    var req = makeSOAPEnvelope(authRequestObject,"",USER_AGENT);
    request({
            method:"POST",
            uri:soapURL,
            headers: {
                "Content-Type": "application/soap+xml; charset=utf-8"
            },
            body: req,
            strictSSL: false,
            jar: false,
            timeout: 10000
        },
        function(err,resp,body) {
            if(err != null) {
                cb(err,null);
            } else {

                var result = processResponse(body);
                if(result.err != null) {
                    cb(err,null);
                } else if(result.payload.Body.AuthResponse != null) {
                    cb(null,result.payload.Body.AuthResponse.authToken[0]._content);
                } else {
                    cb({"message":"Error: could node parse response from Zimbra ","resp":resp,"body":body});
                }
            }

        });
}

createAccount = function(hostName, user, adminAuthToken, cb) {
    var adminURL = getAdminURL(hostName);
    var createAccountRequestObj = {
        "CreateAccountRequest":user
    };
    createAccountRequestObj.CreateAccountRequest["@"] = {"xmlns": "urn:zimbraAdmin"};
    var req = makeSOAPEnvelope(createAccountRequestObj,adminAuthToken,USER_AGENT);
    request({
            method:"POST",
            uri:adminURL,
            headers: {
                "Content-Type": "application/soap+xml; charset=utf-8"
            },
            body: req,
            strictSSL: false,
            jar: true,
            timeout: 10000
        },
        function(err,resp,body) {
            if(err != null) {
                cb(err,null);
            } else {

                var result = processResponse(body);
                if(result.err != null) {
                    cb(result.err,null);
                } else if(result.payload.Body.CreateAccountResponse != null &&
                    result.payload.Body.CreateAccountResponse.account != null &&
                    result.payload.Body.CreateAccountResponse.account[0] != null) {
                    cb(null,result.payload.Body.CreateAccountResponse.account[0]);
                } else {
                    cb({"message":"Error: could node parse response from Zimbra ","resp":resp,"body":body,code:ERR_UNKNOWN}, null);
                }
            }

        });
}

adminRequest = function(hostName, requestName, reqObject, adminAuthToken, cb) {
    var adminURL = getAdminURL(hostName);
    var wrapperObj = {};
    var responseName = requestName.replace("Request","Response");
    wrapperObj[requestName] = reqObject;
    wrapperObj[requestName]["@"] = {"xmlns": "urn:zimbraAdmin"};
    var req = makeSOAPEnvelope(wrapperObj,adminAuthToken,USER_AGENT);
    request({
            method:"POST",
            uri:adminURL,
            headers: {
                "Content-Type": "application/soap+xml; charset=utf-8"
            },
            body: req,
            strictSSL: false,
            jar: true,
            timeout: 10000
        },
        function(err,resp,body) {
            if(err != null) {
                cb(err,null);
            } else {

                var result = processResponse(body);
                if(result.err != null) {
                    cb(result.err,null);
                } else if(result.payload.Body[responseName] != null) {
                    cb(null,result.payload.Body[responseName]);
                } else {
                    cb({"message":"Error: could node parse response from Zimbra ","resp":resp,"body":body,code:ERR_UNKNOWN}, null);
                }
            }

        });
}

getUserAuthTokenByName = function(hostName, login, seconds, adminAuthToken, cb) {
    delegateAuth(hostname, "name", login, seconds, adminAuthToken, cb);
}

getUserAuthTokenById = function(hostName, id, seconds, adminAuthToken, cb) {
    delegateAuth(hostname, "id", id, seconds, adminAuthToken, cb);
}

delegateAuth = function(hostName, by, val, seconds, adminAuthToken, cb) {
    var adminURL = getAdminURL(hostName);
    var delegateAuthObj = {
        "DelegateAuthRequest":{
            "@":{
                "xmlns":"urn:zimbraAdmin",
                "duration":seconds
            },
            "account":{
                "@":{
                    "by":by
                },
                "#":val
            }
        }
    };
    var req = makeSOAPEnvelope(delegateAuthObj,adminAuthToken,USER_AGENT);
    request({
            method:"POST",
            uri:adminURL,
            headers: {
                "Content-Type": "application/soap+xml; charset=utf-8"
            },
            body: req,
            strictSSL: false,
            jar: true,
            timeout: 10000
        },
        function(err,resp,body) {
            if(err != null) {
                cb(err,null);
            } else {

                var result = processResponse(body);
                if(result.err != null) {
                    cb(result.err,null);
                } else if(result.payload.Body["DelegateAuthResponse"] != null
                    && result.payload.Body["DelegateAuthResponse"].authToken != null) {
                    cb(null,result.payload.Body["DelegateAuthResponse"].authToken);
                } else {
                    cb({"message":"Error: could node parse response from Zimbra ","resp":resp,"body":body,code:ERR_UNKNOWN}, null);
                }
            }

        });
}

createDomain = function(hostName, domainName, domainAttrs, adminAuthToken, cb) {
    var adminURL = getAdminURL(hostName);
    var createDomainObj = {"CreateDomainRequest":{name:domainName}};
    createDomainObj.CreateDomainRequest["@"] = {"xmlns": "urn:zimbraAdmin"};
    if(domainAttrs != null && domainAttrs.length > 0) {
        createDomainObj.CreateDomainRequest["a"] = [];
        for(var name in domainAttrs) {
            createDomainObj.CreateDomainRequest.a.push({"@":{"name":name},"#":domainAttrs[name]});
        }
    }
    var req = makeSOAPEnvelope(createDomainObj,adminAuthToken,USER_AGENT);
    request({
            method:"POST",
            uri:adminURL,
            headers: {
                "Content-Type": "application/soap+xml; charset=utf-8"
            },
            body: req,
            strictSSL: false,
            jar: true,
            timeout: 10000
        },
        function(err,resp,body) {
            if(err != null) {
                cb(err,null);
            } else {

                var result = processResponse(body);
                if(result.err != null) {
                    cb(result.err,null);
                } else if(result.payload.Body.CreateDomainResponse != null &&
                    result.payload.Body.CreateDomainResponse.domain != null &&
                    result.payload.Body.CreateDomainResponse.domain[0] != null) {
                    cb(null,result.payload.Body.CreateDomainResponse.domain[0]);
                } else {
                    cb({"message":"Error: could node parse response from Zimbra ","resp":resp,"body":body,code:ERR_UNKNOWN}, null);
                }
            }

        });
}

function processResponse(body) {
    var errcode = ERR_UNKNOWN;
    var respJSON = JSON.parse(body);
    if(respJSON != null) {
        if (respJSON.Body.Fault != null) {
            if(respJSON.Body.Fault.Detail != null && respJSON.Body.Fault.Detail.Error != null &&
                respJSON.Body.Fault.Detail.Error.Code != null) {
                errcode = respJSON.Body.Fault.Detail.Error.Code;
            }
            return {err:{"message":respJSON.Body.Fault.Reason.Text,"body":body,code:errcode}, payload:null};
        } else {
            return {err:null, payload:respJSON,code:errcode};
        }
    } else {
        return {err:{"message":"Error: could node parse response from Zimbra ","body":body,code:errcode},payload:null};
    }
}

function getAdminURL(hostName) {
    return "https://" + hostName + ":7071/service/admin/soap";
}

function getUserSoapURL(hostName) {
    return "https://" + hostName + "/service/soap";
}

function makeSOAPEnvelope(requestObject, authToken, userAgent) {
    var soapReq = {
        "@":{
            "xmlns:soap":"http://www.w3.org/2003/05/soap-envelope"
        },
        "soap:Header":{
            "context":{
                "@":{
                    "xmlns":"urn:zimbra"
                },
                "authToken":authToken,
                "userAgent":{
                    "@":{
                        "name":userAgent
                    }
                },
                "nosession":"",
                "format":{
                    "@":{
                        "xmlns":"",
                        "type":"js"
                    }
                }
            }
        },
        "soap:Body":requestObject
    };
    return js2xmlparser("soap:Envelope",soapReq);
}

/**
 * All module exports are declared below this line
 */
exports.ERR_UNKNOWN = ERR_UNKNOWN;
exports.adminRequest = adminRequest;
exports.createAccount = createAccount;
exports.getAuthToken = getAuthToken;
exports.createDomain = createDomain;



/*
html:
 {"Header":{"context":{"_jsns":"urn:zimbra","userAgent":{"name":"ZimbraWebClient - GC42 (Mac)","version":"8.6.0_GA_1169"},"session":{"_content":124909,"id":124909},"notify":{"seq":19},"account":{"_content":"greg@zimbra.com","by":"name"},"csrfToken":"0_1f9ba47d2de9159879371451a6ae15dc3ffa8814"}},"Body":{"SendMsgRequest":{"_jsns":"urn:zimbraMail","suid":1430804429828,"m":{"idnt":"73230d32-6664-11d9-859e-f139bc5db393","e":[{"t":"t","a":"fiddlestring@gmail.com"},{"t":"f","a":"greg@zimbra.com","p":"Greg Solovyev"}],"su":{"_content":"test"},"mp":[{"ct":"multipart/alternative","mp":[{"ct":"text/plain","content":{"_content":"test \n\nThanks, \nGreg \n"}},{"ct":"text/html","content":{"_content":"<html><body><div style=\"font-family: Arial; font-size: 12pt; color: #000000\"><div>test</div><div><br></div><div data-marker=\"__SIG_PRE__\">Thanks,<br>Greg</div></div></body></html>"}}]}]}}}}

plain text:
 {"Header":{"context":{"_jsns":"urn:zimbra","userAgent":{"name":"ZimbraWebClient - GC42 (Mac)","version":"8.6.0_GA_1169"},"session":{"_content":124909,"id":124909},"notify":{"seq":23},"account":{"_content":"greg@zimbra.com","by":"name"},"csrfToken":"0_1f9ba47d2de9159879371451a6ae15dc3ffa8814"}},"Body":{"SendMsgRequest":{"_jsns":"urn:zimbraMail","suid":1430805301701,"m":{"idnt":"73230d32-6664-11d9-859e-f139bc5db393","e":[{"t":"t","a":"grishick@yahoo.com"},{"t":"f","a":"greg@zimbra.com","p":"Greg Solovyev"}],"su":{"_content":"plain text test"},"mp":[{"ct":"text/plain","content":{"_content":"this is plain text\n\nThanks,\nGreg\n"}}]}}}}

check mail:
 {"Header":{"context":{"_jsns":"urn:zimbra","userAgent":{"name":"ZimbraWebClient - GC42 (Mac)","version":"8.6.0_GA_1169"},"session":{"_content":124909,"id":124909},"notify":{"seq":24},"account":{"_content":"greg@zimbra.com","by":"name"},"csrfToken":"0_1f9ba47d2de9159879371451a6ae15dc3ffa8814"}},"Body":{"SearchRequest":{"_jsns":"urn:zimbraMail","sortBy":"dateDesc","header":[{"n":"List-ID"},{"n":"X-Zimbra-DL"},{"n":"IN-REPLY-TO"}],"tz":{"id":"America/Los_Angeles"},"locale":{"_content":"en_US"},"offset":0,"limit":100,"query":"in:inbox","types":"conversation","recip":"0","fullConversation":1,"needExp":1}}}
 */