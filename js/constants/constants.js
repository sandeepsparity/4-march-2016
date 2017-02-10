var env = "prod";
var serviceUrl = "https://webservices.pall.com/sizing-coalescer";
console.log("location.hostname.." + location.hostname);

if (location.hostname.indexOf("www.pall.com") >= 0) {
    //use production web service
    serviceUrl = "https://webservices.pall.com/sizing-coalescer";
    env = "prod";
} else if ((location.hostname.indexOf("staging.pall.com") >= 0) || (location.hostname.indexOf("127.0.0.1") >= 0) || (location.hostname.indexOf("70.38.37.105") >= 0)) {
    //use stageing web service
    serviceUrl = "https://search.pall.com/services/sizing";
    env = "staging";
} else {

}

angular.module("app")
    .constant('Constants', {
        openRecentUrl: serviceUrl + "/rest/testrecentopen",
        open: serviceUrl + "/rest/testopenconfig",
        login: serviceUrl + "/rest/ajaxLogin?",
        getList: serviceUrl + "/rest/testgetlist?",
        liquidProp: serviceUrl + "/rest/testgetliquidprop?",
        gasProp: serviceUrl + "/rest/testgetgasprop?",
        saveConfiguration: serviceUrl + "/rest/testsaveconfig?",
        openList: serviceUrl + "/rest/testgetopenlist?",
        logout: serviceUrl + "/logout",
        calculate: serviceUrl + "/rest",
        slsDropDown: serviceUrl + "/rest/testproductsls",
        forgotPassword: serviceUrl + "/rest",
        deleteFile: serviceUrl + "/rest/testdeleteconfig?"
    });
