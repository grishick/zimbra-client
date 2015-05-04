#  zimbra-client #
## Overview ##
zimbra-client is a Node.js module that implements a SOAP client for Zimbra SOAP API

## Features ##
So far this module supports 2 methods
* `getAuthToken`
* `createAccount`

## Usage ##
Following example demonstrates creating a new Zimbra account using zimbra-client. In this example, the code assumes Zimbra is running on localhost, admin username is "admin" and admin password is "test123"

    zimbra = require("zimbra-client");
    zimbra.getAuthToken("localhost", "admin", "test123",
        function(err, body) {
            if(err != null) {
                console.log(err.message);
            }
            //console.log(res);
            console.log("got authtoken" + body);
            var authToken = body;
            zimbra.createAccount("localhost",{sn:"Solovyev",givenName:"Greg",displayName:"Greg Solovyev",password:"test123",name:"greg4@gregs-mbp.local"},authToken,
                function(err1,accountObj) {
                    if(err1 != null) {

                        if(err1.code == "account.ACCOUNT_EXISTS") {
                            console.log("an account with this name already exists");
                        } else
                        {
                            console.log(err1.message);
                        }
                    } else {
                        console.log("new account ID" + accountObj.id);
                    }
                }
            );
        })
## License ##
zimbra-client is licensed under Apache 2

