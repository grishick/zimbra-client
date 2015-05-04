#  zimbra-client #
## Overview ##
zimbra-client is a Node.js module that implements a SOAP client for Zimbra SOAP API

## Features ##
So far this module supports 2 methods
* `getAuthToken`
* `createAccount`

## Usage ##
Following example demonstrates creating a new Zimbra account using zimbra-client. In this example, the code assumes Zimbra is running on localhost, admin username is "admin" and admin password is "test123"

### Example 1: Creating a new account ###

    zimbra = require("zimbra-client");
    zimbra.getAuthToken("localhost", "admin", "test123",
        function(err, authToken) {
            if(err != null) {
                console.log(err.message);
            }
            zimbra.createAccount("localhost",{sn:"Solovyev",givenName:"Greg",displayName:"Greg Solovyev",password:"test123",name:"greg4@gregs-mbp.local"},authToken,
                function(err1,accountObj) {
                    if(err1 != null) {
                        if(err1.code == "account.ACCOUNT_EXISTS") {
                            console.log("an account with this name already exists");
                        } else {
                            console.log(err1.message);
                        }
                    } else {
                        console.log("new account ID" + accountObj.id);
                    }
                }
            );
        })

### Example 2: Sending a custom admin SOAP request ###
    zimbra.getAuthToken("localhost", "admin", "test123",
        function(err, authToken) {
            if(err != null) {
                console.log(err.message);
            } else {
            zimbra.adminRequest("localhost", "GetAllAdminAccountsRequest", {}, authToken,
                function (err1, respObj) {
                    if(err1 != null) {
                        console.log(err1.message);
                    } else {
                        console.log("response object: " + JSON.stringify(respObj));
                    }
                });
           }
        });
## License ##
zimbra-client is licensed under Apache 2

