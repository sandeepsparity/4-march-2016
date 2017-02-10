(function () {
    "use strict";
    angular.module('app').factory('openRecent', openRecent);
    openRecent.$inject = ['$http', 'Constants', 'usSpinnerService', "user"];


    function openRecent($http, Constants, usSpinnerService, user) {
        var openRecentData = {};
        return {
            getOpenRecentData: getOpenRecentData
        };

        function getOpenRecentData() {
            if (!user || !user.get()) {
                return;
            }

            if (openRecentData.data) {
                return openRecentData.data;
            } else {
                usSpinnerService.spin('spinner-1');
                return $http.get(Constants.openRecentUrl + "?usernameParam=" + user.get())
                    //return $http.get(Constants.openRecentUrl + "?usernameParam=test_user")
                    .then(getOpenRecentSuccess)
                    .catch(getOpenRecentFailed);
            }

            function getOpenRecentSuccess(response) {
                usSpinnerService.stop('spinner-1');
                if (response && response.data) {
                    openRecentData.data = response.data;
                    return response.data;
                }
            }

            function getOpenRecentFailed(error) {
                usSpinnerService.stop('spinner-1');
                alert('XHR Failed for getOpenRecentFailed [ ' + error.data + ' ]');
            }



        }
    }
})();

(function () {
    "use strict";
    angular.module('app').factory('user', user);
    //user.$inject = ['$state'];

    var userInfo = {};


    function user() {

        return {
            set: set,
            get: get
        };

        function set(username) {
            userInfo.username = username;
        }

        function get() {
            if (!userInfo.username) {
                return;
            }
            return userInfo.username;
        }
    }
})();

(function () {
    "use strict";
    angular.module('app').factory('openList', openList);
    openList.$inject = ['$http', 'Constants', 'usSpinnerService', "user"];


    function openList($http, Constants, usSpinnerService, user) {
        var openListData = {};
        return {
            getData: getData
        };

        function getData() {
            if (!user || !user.get()) {
                return;
            }

            //return {"userfiles":[{"id":"1","saveddate":"2016-01-18","configname":"TestLL1"},{"id":"2","saveddate":"2016-01-18","configname":"TestLL1"},{"id":"3","saveddate":"2016-01-18","configname":"LGCase"},{"id":"4","saveddate":"2016-01-18","configname":"test with nilesh"},{"id":"5","saveddate":"2016-01-18","configname":"test with nilesh ji"},{"id":"6","saveddate":"2016-01-18","configname":"NIleshTest"},{"id":"8","saveddate":"2016-01-19","configname":"BBTest"},{"id":"9","saveddate":"2016-01-19","configname":"TestTed"}]};

            if (openListData.data) {
                return openListData.data;
            } else {
                usSpinnerService.spin('spinner-1');
                return $http.get(Constants.openList + "usernameParam=" + user.get())
                    .then(getListSuccess)
                    .catch(getListFailed);
            }

            function getListSuccess(response) {
                usSpinnerService.stop('spinner-1');
                if (response && response.data) {
                    for (var i = 0; i < response.data.userfiles.length; i++) {
                        response.data.userfiles[i].modifiedDate = moment(response.data.userfiles[i].saveddate).startOf('day').fromNow();
                    }
                    openListData.data = response.data;
                    return response.data;
                }
            }

            function getListFailed(error) {
                usSpinnerService.stop('spinner-1');
                alert('XHR Failed for getListFailed [ ' + error.data + ' ]');
            }



        }
    }
})();

(function () {
    "use strict";
    angular.module('app').factory('calculateService', calculateService);
    calculateService.$inject = ['$http', 'Constants', 'usSpinnerService'];

    function calculateService($http, Constants, usSpinnerService) {
        return {
            getData: getData
        };

        function getData(data, lgCase, llCase) {
            
            var url = '';
            if (lgCase) {
                url += Constants.calculate + '/testcalculateLG?';
            } else {
                url += Constants.calculate + '/testcalculateLL_v2?';
            }
            if (data.solveFor != 'Number of Coalescer') {
                url += 'qasysParam=-999';
                url += '&ncParam=' + data.number_of_col;

            } else {
                url += 'ncParam=-999';
                url += '&qasysParam=' + data.flowRate;
            }
            url += '&pmaxgParam=' + data.maximum_pressure;
            url += '&popgParam=' + data.operating_pressure;
            url += '&topParam=' + data.temp_operating;
            url += '&cpnameParam=' + data.liquidData.name;
            if (data && data.liquidData.density) {
                url += '&rhocParam=' + data.liquidData.density.value;
            }

            url += '&mucParam=' + data.liquidData.viscosity;
            url += '&dpnameParam=' + data.disLiquidData.name;
            url += '&rhodParam=' + data.disLiquidData.density.value;
            url += '&iftParam=' + data.disLiquidData.interfacialTension;
            url += '&mfdParam=' + data.disLiquidData.concentration.value;
            if (lgCase) {
                url += '&dptParam=' + data.maxCleanDP;
                url += '&dpsParam=' + data.maxSaturatedDP;
            }
            url += '&dnuParam=' + data.nozzleSize;
            if (llCase && data.slsCheck) {
                if (data.slsProduct !== "Select") {
                    url += '&pnslsParam=' + data.slsProduct;
                }
                if (data.testedFlowrate) {
                    url += '&qslsParam=' + data.testedFlowrate;
                }
            } else if (data.presapration) {
                if (data.projected) {
                    url += '&preParam=' + data.projected;
                }
            }
            if (lgCase) {
                url += '&sgParam=' + data.liquidData.gravity;
            }
            
            // units
            var units = {};
            //**************** flowrate unit*********************
            if (llCase && data.solveFor == 'Number of Coalescer') {
                units.flowRateUnit = data.flowRateUnit;
            }
            if (lgCase && data.solveFor == 'Number of Coalescer') {
                if (data.flowRateUnit == "NM^3/hr" || data.flowRateUnit == "NM^3/HR") {
                    units.flowRateUnit = "NM^3/HR";
                } else 
                if (data.flowRateUnit == "AM^3/hr" || data.flowRateUnit == "AM^3/HR") {
                    units.flowRateUnit ="M^3/HR (LIQ)";
                } else {
                    units.flowRateUnit = data.flowRateUnit;
                }
            }
            if (data.solveFor == "Maximum Flowrate") {
                units.flowRateUnit ="GPM";
            }
            //*****************max pressure*****************
            if (data.maxPressureUnits == 'Barg') {
                units.maxPressureUnit = 'Bar';
            } else if (data.maxPressureUnits == 'mBarg') {
                units.maxPressureUnit = 'mBar';
            } else {
                units.maxPressureUnit = data.maxPressureUnits;
            }
            //*****************operating pressure*****************
            if (data.opPressureUnits == 'Barg') {
                units.opPressureUnit = 'Bar';
            } else if (data.opPressureUnits == 'mBarg') {
                units.opPressureUnit = 'mBar';
            } else {
                units.opPressureUnit = data.opPressureUnits;
            }
            //*****************operating temperatur*****************
            units.temperatureUnit =(data.temprature== 'Fahrenheit' ? 'F' : 'C');
            //*****************nozzle diameter*****************
            units.nozzleSizeUnit = data.nozzleSizeUnit;
            if(lgCase){
                //*****************max clean dry dp****************
                if (data.maxCleanDPUnit == 'BarD') {
                    units.maxCleanDPUnit = 'Bar';
                } else if (data.maxCleanDPUnit == 'mBarD') {
                   units.maxCleanDPUnit = 'mBar';
                } else if (data.maxCleanDPUnit == 'PSID') {
                   units.maxCleanDPUnit = 'PSIG';
                } else {
                    units.maxCleanDPUnit = data.maxCleanDPUnit;
                }
                
                //*****************max clean dry dp*****************
                if (data.maxSaturatedDPUnit == 'BarD') {
                    units.maxSaturatedDPUnit = 'Bar';
                } else if (data.maxSaturatedDPUnit == 'mBarD') {
                   units.maxSaturatedDPUnit = 'mBar';
                }else if (data.maxSaturatedDPUnit == 'PSID') {
                   units.maxSaturatedDPUnit = 'PSIG';
                } else {
                    units.maxSaturatedDPUnit = data.maxSaturatedDPUnit;
                }
               
            }
            //*****************continuous density*****************
            units.continuousDensity  = data.liquidData.density.unit
            //*****************discontinuous density*****************
            units.discontinuousDensity  = data.disLiquidData.density.unit
            //*****************concentration*****************
            units.concentrationUnit =(data.disLiquidData.concentration.unit == 'ppm' ? 'PPM weight' : 'ppt weight'); 
            
            if (llCase) {
                //*****************sls test unit****************
                    if (data.slsTestUnit != 'u' && data.slsCheck) {
                    units.slsTestUnit = data.slsTestUnit;
                }
            }
            url += '&unitParam=' + JSON.stringify(units);
            
            url = encodeURI(url);
            usSpinnerService.spin('spinner-1');
            console.log("url to get data..." + url);
            return $http({
                    method: "GET",
                    url: url
                })
                .success(function (res, status, headers, config) {
                    usSpinnerService.stop('spinner-1');
                    return res;
                })
                .error(function (res, status, headers, config) {
                    usSpinnerService.stop('spinner-1');
                    return res;
                });
        }
    }
})();