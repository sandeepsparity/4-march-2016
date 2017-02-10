angular.module('app').controller('inputController', function ($scope, $state, Data, $http, usSpinnerService, Constants, openRecent, user, $stateParams) {
    if (!user.get()) {
        $state.go("login");
    }


    $scope.slsProductOptions = [
        {
            value: "Select",
            display: "Select"
                    }
                ]

    $http.get(Constants.slsDropDown).success(function (slsDropDown) {
        if ($scope.slsProductOptions.length == 1) {
            for (var i = 0; i < slsDropDown.slsproducts.length; i++) {
                $scope.slsProductOptions.push({
                    value: slsDropDown.slsproducts[i],
                    display: slsDropDown.slsproducts[i]
                })
            }
        }

    });

    $scope.open = function () {
        if (user.get()) {
            usSpinnerService.spin('spinner-1');
            $http.get(Constants.openList + "usernameParam=" + user.get())
                .then(function (response) {
                    if (response && response.data) {
                        for (var i = 0; i < response.data.userfiles.length; i++) {
                            response.data.userfiles[i].modifiedDate = moment(response.data.userfiles[i].saveddate).format("MM-DD-YYYY");
                        }
                        $scope.openList = response.data.userfiles;

                    }
                })
                .catch(function (error) {
                    alert('XHR Failed for getListFailed [ ' + error.data + ' ]');
                });
        }
    }
    $scope.logout = function () {
        $http.get(Constants.logout).then(function () {
            alert("success")
        }).catch(function () {
            //alert("error")
        });
        $state.go("login");
        $(".modal-backdrop.fade.in").remove();
        $("body").removeClass("modal-open");
        $("body").css("padding-right", "0px");
    }
    $scope.openSelectedFile = function (id) {
        $scope.selectedFileId = id;
    }
    $scope.deleteFile = function (index) {
        if (user.get()) {
            var list = $scope.openList[index];
            usSpinnerService.spin('spinner-1');
            $http.get(Constants.deleteFile + "usernameParam=" + user.get() + "&idParam=" + list.id + "&confignameParam=" + list.configname)
                .success(function (response) {
                    console.log("resonse.." + JSON.stringify(response));
                    if (response && response.error) {
                        alert(response.error);
                    } else {
                        $scope.openList.splice(index, 1);
                    }
                })
                .error(function (error) {
                    $scope.openList.splice(index, 1);
                });
        }
    }

    $scope.openRecent = function () {
        if (user.get()) {
            usSpinnerService.spin('spinner-1');
            $http.get(Constants.openRecentUrl + "?usernameParam=" + user.get())
                .then(function (response) {
                    if (response && response.data) {
                        $scope.recentData = response.data.configfile;
                    }
                })
                .catch(function (error) {
                    alert('Failed to Populate List.');
                });
        }
    }
    $scope.openRecentById = function (id) {
        $scope.fileId = id;
        usSpinnerService.spin('spinner-1');
        $http.get(Constants.open + "?usernameParam=" + user.get() + "&unoParam=" + id)
            .then(function (response) {
                if (response && response.data) {
                    $("#idCol2MFRate").hide();
                    $("#idCol3NOCoal").hide();
                    $scope.operationEditable = false;
                    $scope.configurationName = response.data.configfile.configname;
                    $scope.showSaveBox = true;
                    $scope.prePopulateOperatingCondition(response.data.configfile, function () {
                        setTimeout(function () {
                            $scope.prePopulateContineousPhase(response.data.configfile, function (flag) {
                                if (!flag) {
                                    return false;
                                }
                                setTimeout(function () {
                                    if ($scope.lgCase) {
                                        $scope.sgEditable = true;
                                    }
                                    $scope.prePopulateDiscontineousPhase(response.data.configfile);

                                }, 100);

                            }, 100);


                        });
                    });
                    console.log(JSON.stringify(response.data));
                }
            })
            .catch(function (error) {
                alert('XHR Failed for open [ ' + error + ' ]');
            });
    }
    $scope.prePopulateOperatingCondition = function (data, callback) {

        $scope.handleSelectTagValue();
        var solveFor = data.solv4;
        if (solveFor == "N") {
            $scope.selectValue = $scope.selectOptions[0];
            $scope.flowRate = Number(data.qasys);
            $scope.flowRateUnit = data.qasysunit;
            $scope.flowRateUnitChange();
        } else if (solveFor == "Q") {
            $scope.selectValue = $scope.selectOptions[1];
            $scope.number_of_col = Number(data.nc);
            $scope.coalesUnits = data.typeofcall;
            if (data.typeofcall == 'LL') {
                $scope.lgCase = false;
                $scope.llCase = true;
            } else {
                $scope.lgCase = true;
                $scope.llCase = false;
            }
        }
        $scope.maximum_pressure = Number(data.pmaxg);
        $scope.maxPressureUnits = data.pmaxgunit;

        $scope.operating_pressure = Number(data.popg);
        $scope.opPressureUnits = data.popgunit;

        $scope.temp_operating = Number(data.top);
        $scope.temprature = data.topunit == "F" ? "Fahrenheit" : "Celsius";

        $scope.nozzleSize = Number(data.dnu);
        $scope.nozzleSizeUnit = data.dnuunit;

        $scope.maxSaturatedDP = Number(data.dptmax);
        $scope.maxSaturatedDPUnit = data.dptmaxunit;

        $scope.maxCleanDP = Number(data.dpsmax);
        $scope.maxCleanDPUnit = data.dpsmaxunit;
        callback();
    }
    $scope.prePopulateContineousPhase = function (data, callback) {
        $scope.validateNext();

        if ($scope.errorMessage) {
            $scope.resetContinuousPhaseErrorMsg();
            $scope.resetDiscontPhaseErrorMsg();
            $scope.resetDisLiquidData();


            callback(false);
            return;
        }
        $scope.gasValue = data.cpname;
        $scope.liquidData.name = data.cpname;
        $scope.liquidData.density.value = Number(data.rhoc);
        $scope.liquidData.density.unit = data.rhocunit.toString().toLowerCase();

        $scope.liquidData.viscosity = Number(data.muc);
        if ($scope.lgCase) {
            $scope.liquidData.gravity = Number(data.sg);
        }

        callback(true);
    }
    $scope.prePopulateDiscontineousPhase = function (data) {
        $scope.showDiscontinuousPhase();
        $scope.disGasValue = data.dpname;
        $scope.disLiquidData.name = data.dpname;
        $scope.disLiquidData.density.value = Number(data.rhod);
        $scope.disLiquidData.density.unit = data.rhodunit.toString().toLowerCase();
        $scope.disLiquidData.interfacialTension = Number(data.ift);
        $scope.disLiquidData.concentration.value = Number(data.mfd);
        $scope.disLiquidData.concentration.unit = data.mfdunit == "PPM weight" ? "ppm" : "percentage";

        if ($scope.llCase) {
            $scope.presapration = false;
            //populateVariousUnits();



            console.log(JSON.stringify($scope.slsProductOptions))
            if (data.pnsls == "AQUASEP PLUS") {
                $scope.slsProduct = $scope.slsProductOptions[1].value;
            } else if (data.pnsls == "PHASESEP") {
                $scope.slsProduct = $scope.slsProductOptions[2].value;
            } else {
                $scope.slsProduct = $scope.slsProductOptions[0].value;
            }
            $scope.testedFlowrate = Number(data.qsls);
            $scope.slsTestUnit = data.qslsunit;

            if ($scope.slsProduct !== "Select") {
                $scope.slsCheck = true;
            }




        } else if ($scope.lgCase) {
            $scope.slsCheck = false;
            if (data.pre && Number(data.pre) !== 0) {
                $scope.projected = Number(data.pre);
                $scope.presapration = true;
            }
        }

    }
    $scope.saveConfiguration = function () {
        $scope.showSaveBox = true;
        if (!(($scope.temp_operating > 0 && $scope.temprature == 'Celsius') || ($scope.temp_operating > 32 && $scope.temprature == 'Fahrenheit')) && ($scope.gasValue == 'Water' || $scope.discontGasValue == 'Water')) {
            return;
        }
        if ($scope.validateNext(true)) {
            if ($scope.validateContinuousPhase()) {
                if ($scope.validateDisContinuousPhase()) {

                    if (!$scope.configurationName || $scope.configurationName == undefined) {
                        $scope.configurationNameError = true;
                        return;
                    }

                    $scope.configurationNameError = false;

                    var url = "";
                    url += "configNameParam=" + $scope.configurationName;
                    if ($scope.selectValue == "Number of Coalescer") {
                        url += "&solv4Param=N";
                    } else if ($scope.selectValue == "Maximum Flowrate") {
                        url += "&solv4Param=Q";
                    }


                    if ($scope.llCase) {
                        url += '&typeofcallParam=LL';
                    } else {
                        url += '&typeofcallParam=LG';
                    }


                    if ($scope.selectValue == "Number of Coalescer") {


                        if ($scope.flowRate) {
                            url += "&qasysParam=" + String($scope.flowRate);
                        }

                        if ($scope.flowRateUnit !== 'u') {
                            url += "&qasysUnitParam=" + $scope.flowRateUnit.toString();
                        }
                        url += '&ncParam=-999';
                    } else if ($scope.selectValue == "Maximum Flowrate") {

                        url += '&qasysParam=-999';
                        url += '&qasysUnitParam=-10';
                        if ($scope.number_of_col) {
                            url += '&ncParam=' + String($scope.number_of_col);
                        }

                    }

                    if ($scope.maximum_pressure) {
                        url += "&pmaxParam=" + String($scope.maximum_pressure);
                    }

                    if ($scope.maxPressureUnits) {
                        url += '&pmaxUnitParam=' + $scope.maxPressureUnits.toString();
                    }

                    if ($scope.temp_operating) {
                        url += "&topParam=" + String($scope.temp_operating);
                    }

                    url += '&topUnitParam=' + ($scope.temprature == "Fahrenheit" ? "F" : "C");

                    if ($scope.operating_pressure) {
                        url += '&popgParam=' + String($scope.operating_pressure);
                    }

                    if ($scope.opPressureUnits) {
                        url += '&popgUnitParam=' + $scope.opPressureUnits.toString();
                    }


                    if ($scope.liquidData.name) {
                        url += "&cpnameParam=" + $scope.liquidData.name;
                    }

                    if ($scope.liquidData.density.value) {
                        url += '&rhoCParam=' + String($scope.liquidData.density.value);
                    }

                    if ($scope.liquidData.density.unit != 'Units') {
                        url += '&rhoCUnitParam=' + ($scope.liquidData.density.unit.toString());
                    }

                    if ($scope.liquidData.viscosity) {
                        url += '&muCParam=' + String($scope.liquidData.viscosity);
                    }

                    if ($scope.disLiquidData.name) {
                        url += '&dpnameParam=' + $scope.disLiquidData.name;
                    }

                    if ($scope.disLiquidData.density.value) {
                        url += "&rhoDParam=" + String($scope.disLiquidData.density.value);
                    }

                    if ($scope.disLiquidData.density.unit != 'Units') {
                        url += '&rhoDUnitParam=' + ($scope.disLiquidData.density.unit.toString());
                    }

                    if ($scope.disLiquidData.interfacialTension) {
                        url += '&IFTParam=' + String($scope.disLiquidData.interfacialTension);
                        //url += '&IFTUnitParam=dyn/cm';
                    }

                    if ($scope.disLiquidData.concentration.value) {
                        url += '&mfdParam=' + String($scope.disLiquidData.concentration.value);
                    }

                    if ($scope.disLiquidData.concentration.unit != 'Units') {
                        url += '&mfdUnitParam=' + ($scope.disLiquidData.concentration.unit == "ppm" ? "PPM weight" : "% weight");
                    }

                    if ($scope.nozzleSize) {
                        url += '&dnuParam=' + String($scope.nozzleSize);
                    }

                    if ($scope.nozzleSizeUnit != 'Units') {
                        url += '&dnuUnitParam=' + ($scope.nozzleSizeUnit);
                    }
                    if ($scope.lgCase) {
                        if ($scope.maxSaturatedDP) {
                            url += '&dptMaxParam=' + String($scope.maxSaturatedDP);
                        }

                        if ($scope.maxSaturatedDPUnit != 'Units') {
                            url += '&dptMaxUnitParam=' + ($scope.maxSaturatedDPUnit);
                        }

                        if ($scope.maxCleanDP) {
                            url += '&dpsMaxParam=' + String($scope.maxCleanDP);
                        }

                        if ($scope.maxCleanDPUnit != 'Units') {
                            url += '&dpsMaxUnitParam=' + ($scope.maxCleanDPUnit);
                        }
                    }

                    url += '&usernameParam=' + user.get();

                    if ($scope.fileId) {
                        url += '&unoParam=' + String($scope.fileId);
                    } else {
                        url += '&unoParam = 0';
                    }



                    if ($scope.lgCase) {
                        if ($scope.liquidData.gravity) {
                            url += "&sgParam=" + String($scope.liquidData.gravity);
                        }
                    }


                    if ($scope.llCase) {
                        if ($scope.slsProduct != 'Select' && $scope.slsProduct != undefined) {
                            url += '&pnslsParam=' + $scope.slsProduct.toString();
                        }

                        if ($scope.testedFlowrate) {
                            url += '&qslsParam=' + String($scope.testedFlowrate);
                        }
                        if ($scope.slsTestUnit != 'u' && $scope.slsTestUnit != undefined) {
                            url += '&qslsUnitParam=' + $scope.slsTestUnit.toString();
                        }
                    } else if ($scope.lgCase) {
                        if ($scope.projected) {
                            url += '&preParam=' + String($scope.projected);
                        }
                    }


                    console.log(encodeURI(url));


                    $http.get(Constants.saveConfiguration + url).success(function (response) {

                        if (response.error) {
                            alert(response.error)
                        } else {
                            alert("File saved Successfully")
                        }
                        $scope.fileId = undefined;

                        //console.log(response);
                    }).error(function (e) {
                        alert("File saved Successfully");
                    });

                }
            }
        }
    }
    usSpinnerService.stop('spinner-1');
    if ($stateParams && $stateParams.id && user.get()) {
        $scope.openRecentById($stateParams.id);
    }

    function populateVariousUnits() {
        $scope.selectOptions = ["Number of Coalescer", "Maximum Flowrate"];
        $scope.nozzleSizeOptions = [
            {
                value: "u",
                display: "Units"
                    },
            {
                value: "in",
                display: "in"
                    },
            {
                value: "mm",
                display: "mm"
                    }
        ]
        $scope.tempratureOptions = [
            {
                value: "u",
                display: "Units"
                    },
            {
                value: "Fahrenheit",
                display: "Fahrenheit ('F)"
                    },
            {
                value: "Celsius",
                display: "Celsius ('C)"
                    }
                ];
        $scope.coalesUnitsOptions = [
            {
                value: "u",
                display: "Units"
                    },
            {
                value: "LG",
                display: "LG"
                    },
            {
                value: "LL",
                display: "LL"
                    }
                ];
        $scope.liquidFlowRateUnits = ["GPM", "LPM", "M^3/HR (LIQ)"];
        $scope.flowRateUnitOptions = [
            {
                value: "u",
                display: "Units"
                    },
            {
                value: "GPM",
                display: "GPM"
                    },
            {
                value: "LPM",
                display: "LPM"
                    },
            {
                value: "M^3/HR (LIQ)",
                display: "M^3/HR (LIQ)"
                    },
            {
                value: "NM^3/HR",
                display: "NM^3/HR"
                        },

            {
                value: "SCFM",
                display: "SCFM"
                    },

            {
                value: "ACFM",
                display: "ACFM"
                    },

            {
                value: "AM^3/HR",
                display: "AM^3/HR"
                    },

            {
                value: "MMSCFD",
                display: "MMSCFD"
                    }
                ];
        $scope.maxPressureOptions = [
            {
                value: "u",
                display: "Units"
                    },
            {
                value: "PSIG",
                display: "PSIG"
                    },
            {
                value: "Barg",
                display: "Barg"
                    },
            {
                value: "mBarg",
                display: "mBarg"
                    }
                ];
        
        $scope.dpPressureOptions = [
            {
                value: "u",
                display: "Units"
                    },
            {
                value: "PSID",
                display: "PSID"
                    },
            {
                value: "BarD",
                display: "BarD"
                    },
            {
                value: "mBarD",
                display: "mBarD"
                    }
                ]
        $scope.densityUnitsOptions = [
            {
                value: "Units",
                display: "Units"
                    }, {
                value: "kg/m3",
                display: "kg/m3"
                    },
            {
                value: "lb/ft3",
                display: "lb/ft3"
                    },
            {
                value: "grams/ml",
                display: "grams/ml"
                    }
                ];
        $scope.densityUnit = $scope.densityUnitsOptions[0].value;
        $scope.disDensityUnit = $scope.densityUnitsOptions[0].value;
        $scope.liquidData = {
            density: {
                unit: $scope.densityUnitsOptions[0].value
            }
        };
        $scope.concentrationUnitsOptions = [
            {
                value: "Units",
                display: "Units"
                    }, {
                value: "ppm",
                display: "PPM weight"
                    },
            {
                value: "percentage",
                display: "% weight"
                    }
                ];
        $scope.disLiquidData = {
            density: {
                unit: $scope.densityUnitsOptions[0].value
            },
            concentration: {
                unit: $scope.concentrationUnitsOptions[0].value
            }
        };
        $scope.nozzleSizeUnit = $scope.nozzleSizeOptions[0].value;
        $scope.concentrationUnit = $scope.concentrationUnitsOptions[1].value;

    }
    populateVariousUnits();


    $scope.slTest = ["Select", "LCS2HAH", "LCS2B1AH", "LCS4HAH", "LCS4B1AH"];
    $scope.populatePressureOptions = function () {
        if ($scope.llCase) {
            /*$scope.maxPressureOptions.push({
    value: "KPa",
    display: "KPa"
});*/
        }
    }
    $scope.populateSlsTestUnitOptions = function () {
        if ($scope.llCase) {
            $scope.slsTestUnitOptions = [{
                value: "u",
                display: "Units"
                                        }, {
                value: "GPM",
                display: "GPM"
                                        }, {
                value: "M^3/HR (LIQ)",
                display: "M^3/HR (LIQ)"
                                        }, {
                value: "LPM",
                display: "LPM"
                     }]
        } else {
            $scope.slsTestUnitOptions = [{
                value: "u",
                display: "Units"
                                        }, {
                value: "NM^3/hr",
                display: "NM^3/hr"
                                        }, {
                value: "SCFM",
                display: "SCFM"
                                        }, {
                value: "ACFM",
                display: "ACFM"
                                        }, {
                value: "AM^3/hr",
                display: "AM^3/hr"
                    }]
        }
        if (!$scope.slsTestUnit || $scope.slsTestUnit == undefined) {
            $scope.slsTestUnit = $scope.slsTestUnitOptions[0].value;
        }

    }
    $scope.populateDropDownOptions = function () {
        var continuousPhaseOptions = ["Generic"];
        // populating drop down options recieved from the service
        if ($scope.continuousPhaseOptions && $scope.continuousPhaseOptions.liquidelement && $scope.continuousPhaseOptions.liquidelement.length > 0) {
            for (var i = 0; i < $scope.continuousPhaseOptions.liquidelement.length; i++) {
                continuousPhaseOptions.push($scope.continuousPhaseOptions.liquidelement[i].cpname);
            }
        }
        if ($scope.llCase) {
            $scope.isLiquid = true;
            $scope.gasOptions = continuousPhaseOptions;
            $scope.discontGasOptions = continuousPhaseOptions;
        } else {
            $scope.isLiquid = false;
            $scope.gasOptions = ["Generic", "Natural Gas", "Methane", "Carbon Dioxide", "Air", "Hydrogen"];
            $scope.discontGasOptions = ["Generic", "Natural Gas", "Methane", "Carbon Dioxide", "Air", "Hydrogen"];
        }
        $scope.populateSlsTestUnitOptions();
    }
    $scope.maximumPressureChange = function () {
        $scope.opPressureUnits = $scope.maxPressureUnits;
        var index = $scope.maxPressureOptions.indexOf($scope.maxPressureUnits);  
        var index = -1;
        for(var i=0;i<$scope.maxPressureOptions.length;i++){
            if($scope.maxPressureOptions[i].value == $scope.maxPressureUnits){
                index = i;
            }
        }
        if(index != -1){
            $scope.maxCleanDPUnit = $scope.dpPressureOptions[index].value;
            $scope.maxSaturatedDPUnit = $scope.dpPressureOptions[index].value;
        }
        
    }

    $scope.closeException = function () {
        $("#exceptionModal").modal('hide');
        $(".modal-backdrop.in").css("opacity", "0");
        $(".modal-backdrop.fade.in").hide();
        location.reload();
        return;
    }

    if (Data.backButtonClicked) {
        console.log("Data.data.." + JSON.stringify(Data.data));
        $(".homePage").addClass("slideInDown animated");
        $scope.selectValue = Data.data.solveFor;
        if ($scope.selectValue == "Maximum Flowrate") {
            $scope.number_of_col = Data.data.number_of_col;
            $scope.coalesUnits = Data.data.coalesUnits;
        } else {
            $scope.flowRate = Data.data.flowRate;
            $scope.flowRateUnit = Data.data.flowRateUnit;
        }
        $scope.testedFlowrate = Data.data.testedFlowrate;
        $scope.maximum_pressure = Data.data.maximum_pressure;
        $scope.operating_pressure = Data.data.operating_pressure;
        $scope.temp_operating = Data.data.temp_operating;
        $scope.maxPressureUnits = Data.data.maxPressureUnits;
        $scope.opPressureUnits = Data.data.opPressureUnits;
        $scope.temprature = Data.data.temprature;
        $scope.gasValue = Data.data.gasValue;
        $scope.disGasValue = Data.data.disGasValue;
        $scope.liquidData = Data.data.liquidData;
        $scope.disLiquidData = Data.data.disLiquidData;
        $scope.densityUnit = Data.data.densityUnit;
        $scope.disDensityUnit = Data.data.disDensityUnit;
        $scope.concentrationUnit = Data.data.concentrationUnit;
        $scope.projected = Data.data.projected;
        $scope.presapration = Data.data.presapration;
        $scope.projected = Data.data.projected;
        $scope.liquidFlowRateUnits = Data.data.liquidFlowRateUnits;
        $scope.slTest = Data.data.slTest;
        $scope.operationEditable = true;
        $scope.slsProduct = Data.data.slsProduct;
        $scope.slsCheck = Data.data.slsCheck;
        $scope.testedFlowrate = Data.data.testedFlowrate;
        $scope.slsTestUnit = Data.data.slsTestUnit;
        $scope.lgCase = Data.data.lgCase;
        $scope.llCase = Data.data.llCase;
        $scope.nozzleSize = Data.data.nozzleSize;
        $scope.nozzleSizeUnit = Data.data.nozzleSizeUnit;
        $scope.maxCleanDPUnit = Data.data.maxCleanDPUnit;
        $scope.maxCleanDP = Data.data.maxCleanDP;
        $scope.maxSaturatedDP = Data.data.maxSaturatedDP;
        $scope.maxSaturatedDPUnit = Data.data.maxSaturatedDPUnit;
        /*$scope.hideButtons = !$scope.hideButtons;*/
        $scope.showCalc = true;

        $scope.disEdittable = true;
        $scope.hideButtons = true;
        $scope.hideContinuousButtons = true;
        $("#idCol2MFRate").show();
        $("#idCol3NOCoal").show();
        $scope.errorMessage = false;
        $scope.showFooterButtons = true;
        $scope.gasOptions = Data.data.gasOptions;
        $scope.discontGasOptions = Data.data.discontGasOptions;
        $scope.populateSlsTestUnitOptions();
        $scope.gasValue = Data.data.gasValue;
        $scope.discontGasValue = Data.data.discontGasValue;
        $scope.slsProductOptions = Data.data.slsProductOptions;
        $scope.configurationName = Data.data.configurationName;
        $scope.showSaveBox = Data.data.showSaveBox;
        if ($scope.gasValue !== 'Generic') {
            $scope.edittable = true;
        } else {
            $scope.edittable = true;
            $scope.cpEditable = false;
        }
        if ($scope.lgCase) {
            $scope.sgEditable = true;
        }
        $scope.populatePressureOptions();
    } else {
        $scope.operationEditable = false;
        $scope.selectValue = $scope.selectOptions[0];
        $scope.hideButtons = false;
        $scope.edittable = true;
        $scope.disEdittable = true;
        $scope.refresh = false;
        $scope.cpEditable = false;
        $scope.hideButtons = false;
        $scope.coalesUnits = $scope.coalesUnitsOptions[0].value;
        $scope.flowRateUnit = $scope.flowRateUnitOptions[0].value;
        $scope.maxPressureUnits = $scope.maxPressureOptions[0].value;
        $scope.opPressureUnits = $scope.maxPressureOptions[0].value;
        $scope.maxCleanDPUnit = $scope.dpPressureOptions[0].value;
        $scope.maxSaturatedDPUnit = $scope.dpPressureOptions[0].value;
        $scope.temprature = $scope.tempratureOptions[0].value;
        $scope.slsProduct = $scope.slsProductOptions[0].value;
    }
    $scope.handleSelectTagValue = function () {
        $scope.flowRate = undefined;
        $scope.number_of_col = undefined;
        $scope.coalesUnits = $scope.coalesUnitsOptions[0].value;
        $scope.flowRateUnit = $scope.flowRateUnitOptions[0].value;
        $scope.maximum_pressure = undefined;
        $scope.operating_pressure = undefined;
        $scope.temp_operating = undefined;
        $scope.nozzleSize = undefined;
        $scope.maxCleanDP = undefined;
        $scope.maxSaturatedDP = undefined;
        $scope.maxPressureUnits = $scope.maxPressureOptions[0].value;
        $scope.opPressureUnits = $scope.maxPressureOptions[0].value;
        $scope.maxCleanDPUnit = $scope.dpPressureOptions[0].value;
        $scope.maxSaturatedDPUnit = $scope.dpPressureOptions[0].value;
        $scope.temprature = $scope.tempratureOptions[0].value;
        $scope.nozzleSizeUnit = $scope.nozzleSizeOptions[0].value;
        $scope.operationConditionsForm.$setPristine();
        $scope.operationConditionsForm.$setUntouched();
        $scope.lgCase = false;
    }

    $scope.showhideCol2MFRate = function () {
        $("#idCol2MFRate").show();
    }

    $scope.resetContinuousPhaseErrorMsg = function () {
        $scope.continousPhaseErrorMsg = {
            name: false,
            density: {
                value: false,
                unit: false
            },
            viscosity: false,
            negativeViscocity: false,
            gravity: false
        };
    }

    $scope.validateNext = function (flag) {


        if ($scope.lgCase && $scope.temp_operating < -40 && $scope.temprature != undefined) {
            return;
        }

        $scope.errorMessage = undefined;
        var count = 0;
        $("#panel-body-white").find(".green_clr").each(function () {
            if ($(this).css("display") != "none") {
                count++;
            }

        });
        if ($scope.llCase && count < 5) {
            $scope.errorMessage = "Please fill all the fields";
            return false;
        } else if ($scope.lgCase && count < 7) {
            $scope.errorMessage = "Please fill all the fields";
            return false;
        } else if (count < 5) {
            $scope.errorMessage = "Please fill all the fields";
            return false;
        } else {
            if (!flag) {
                $scope.resetContinuousPhaseErrorMsg();
                $scope.populateContDropDownOptions();
                return true;
            } else {
                return true;
            }
        }
    }

    $scope.populateContDropDownOptions = function () {
        //var dropDownUrl = "https://search.pall.com/services/sizing/rest/testgetlist?";
        var dropDownUrl = Constants.getList;
        if ($scope.llCase) {
            dropDownUrl += 'TypeOfCallParam=LL';
        } else {
            dropDownUrl += 'TypeOfCallParam=LG';
        }
        usSpinnerService.spin('spinner-1');
        $http.get(dropDownUrl).success(function (response) {
            if (response && response.error && response.error.moremsg) {
                $scope.exceptionMsg = response.error.moremsg;
                $("#exceptionModal").modal('show');
                return;
            }
            if ($scope.llCase) {
                $scope.isLiquid = true;
            } else {
                $scope.isLiquid = false;
            }
            if ($scope.lgCase) {
                $scope.getListResponse = response.elements;
                $scope.gasOptions = Object.keys(response.elements);

            } else {
                $scope.gasOptions = response.elements;
            }
            $scope.gasOptions.splice(0, 0, "Generic");
            $scope.populateSlsTestUnitOptions();
            $scope.gasValue = $scope.gasOptions[0];
            $scope.operationEditable = true;
            $scope.showhideCol2MFRate();


        })
    }
    $scope.showOperationCondition = function () {
        $scope.gasValue = undefined;
        $scope.resetLiquidData();
        $("#idCol2MFRate").hide();
        $scope.operationEditable = false;
        if ($scope.lgCase) {
            $scope.showCalculate = false;
            $scope.showChangeSG = false;
            $scope.sgEditable = false;
        }
        console.log("$scope.liquidData.." + JSON.stringify($scope.liquidData))
    }
    $scope.save = function (val) {
        if (val == 'dis') {
            $scope.disEdittable = !$scope.disEdittable;
            $scope.hideDisButtons = !$scope.hideDisButtons;
            $scope.disableBackButton = !$scope.disableBackButton;
        } else {
            $scope.edittable = !$scope.edittable;
            $scope.hideButtons = !$scope.hideButtons;
            $scope.disableContinuousButtons = !$scope.disableContinuousButtons;
            if ($scope.lgCase) {
                $scope.showChangeSG = !$scope.showChangeSG;
            }
        }
    }
    $scope.cancel = function (val) {
        if (val == 'dis') {
            $scope.disLiquidData = $scope.disLiquidDataClone;
            $scope.disEdittable = !$scope.disEdittable;
            $scope.hideDisButtons = !$scope.hideDisButtons;
            $scope.disableBackButton = !$scope.disableBackButton;
        } else {
            $scope.edittable = !$scope.edittable;
            $scope.hideButtons = !$scope.hideButtons;
            $scope.disableContinuousButtons = !$scope.disableContinuousButtons;
            $scope.liquidData = $scope.liquidDataClone;
            if ($scope.lgCase) {
                $scope.showChangeSG = !$scope.showChangeSG;
            }
        }
    }
    $scope.modifyGasOptions = function () {
        if ($scope.lgCase) {
            $scope.showChangeSG = !$scope.showChangeSG;
        }
        $scope.hideButtons = !$scope.hideButtons;
        $scope.liquidDataClone = angular.copy($scope.liquidData);
        $scope.liquidDataClone = angular.copy($scope.liquidData);
        $scope.edittable = !$scope.edittable;
        $scope.disableContinuousButtons = !$scope.disableContinuousButtons;
    }

    $scope.changeSG = function () {
        $scope.hideButtons = !$scope.hideButtons;
        $scope.showChangeSG = !$scope.showChangeSG;
        $scope.sgEditable = !$scope.sgEditable;
        $scope.showCalculate = !$scope.showCalculate;
    }
    $scope.calculateGasProps = function () {
        $scope.hideButtons = !$scope.hideButtons;
        $scope.sgEditable = !$scope.sgEditable;
        $scope.showChangeSG = !$scope.showChangeSG;
        $scope.showCalculate = !$scope.showCalculate;
        var units = {
            units: []
        };
        var dropDownDataUrl = "";
        dropDownDataUrl += Constants.gasProp;
        dropDownDataUrl += "gasParam=" + $scope.gasValue;
        dropDownDataUrl += "&tempParam=" + $scope.temp_operating;
        dropDownDataUrl += "&pressureParam=" + $scope.operating_pressure;
        dropDownDataUrl += "&sgParam=" + $scope.liquidData.gravity;
        units.units.push($scope.temprature == 'Fahrenheit' ? 'F' : 'C');
        if ($scope.maxPressureUnits == 'Barg') {
                units.units.push('Bar');
            } else if ($scope.maxPressureUnits == 'mBarg') {
                units.units.push('mBar');
            } else {
                units.units.push($scope.maxPressureUnits);
            }
        
        dropDownDataUrl += '&unitParam=' + JSON.stringify(units);
        dropDownDataUrl = encodeURI(dropDownDataUrl);
        console.log("dropDownUrl for continuous phase.." + dropDownDataUrl);
        usSpinnerService.spin('spinner-1');
        $http.get(dropDownDataUrl).success(function (response) {
            if (response && response.error && response.error.moremsg) {
                $scope.exceptionMsg = response.error.moremsg;
                $("#exceptionModal").modal('show');
                return;
            }
            var mu = response.gas.muc;
            if (mu == -999) {
                $scope.density999 = true;
            }
            if ($scope.getDecimalLength(mu)) {
                mu = Number(mu).toFixed(6);
            }
            $scope.liquidData.viscosity = Number(mu);


            var rho = response.gas.rho;
            if (rho == -999) {
                $scope.viscosity999 = true;
            }
            if ($scope.getDecimalLength(rho)) {
                rho = Number(rho).toFixed(6);
            }

            $scope.liquidData.density = {
                value: Number(rho),
                unit: $scope.densityUnitsOptions[1].value
            };
            $scope.liquidData.name = $scope.gasValue;
        })
    }

    $scope.flowRateUnitChange = function () {
        $scope.llCase = false;
        $scope.lgCase = false;
        if ($scope.selectValue == "Number of Coalescer") {
            if ($scope.liquidFlowRateUnits.indexOf($scope.flowRateUnit) !== -1) {
                $scope.llCase = true;
            } else {
                $scope.lgCase = true;
            }
        } else {
            if ($scope.coalesUnits == 'LG') {
                $scope.lgCase = true;
            } else {
                $scope.llCase = true;
            }
        }

        /*if (($scope.flowRateUnit !== 'u' && $scope.liquidFlowRateUnits.indexOf($scope.flowRateUnit) !== -1) || ($scope.coalesUnits !== 'u' && $scope.coalesUnits == 'LL')) {
    var found = false
    for (var i = 0; i < $scope.maxPressureOptions.length; i++) {
        if ($scope.maxPressureOptions[i].value == "KPa") {
            found = true;
        }
    }
    if (!found) {
        $scope.maxPressureOptions.push({
            value: "KPa",
            display: "KPa"
        });
    }
} else {
    for (var i = 0; i < $scope.maxPressureOptions.length; i++) {
        if ($scope.maxPressureOptions[i].value == "KPa") {
            $scope.maxPressureOptions.splice(i, 1);
        }
    }
}*/

    }
    $scope.validateContinuousPhase = function () {
        $scope.resetContinuousPhaseErrorMsg();
        var showMsg = false;
        if (!$scope.liquidData.name || $scope.liquidData.name == undefined) {
            showMsg = true;
            $scope.continousPhaseErrorMsg.name = true;
        }
        if (!$scope.liquidData.viscosity || $scope.liquidData.viscosity == undefined) {
            showMsg = true;
            $scope.continousPhaseErrorMsg.viscosity = true;
        }

        if ($scope.liquidData.viscosity && $scope.liquidData.viscosity < 0) {
            showMsg = true;
            $scope.continousPhaseErrorMsg.negativeViscosity = true;
        }

        if (!$scope.liquidData.density.value || $scope.liquidData.density.value == undefined) {
            showMsg = true;
            $scope.continousPhaseErrorMsg.density.value = true;
        }
        if ($scope.liquidData.density.value <= 0) {
            showMsg = true;
            $scope.continousPhaseErrorMsg.density.value = false;
        }
        if ($scope.liquidData.density.unit == 'Units') {
            showMsg = true;
            $scope.continousPhaseErrorMsg.density.unit = true;
        }
        if ($scope.lgCase) {
            if ((!$scope.liquidData.gravity || $scope.liquidData.gravity == undefined) && $scope.liquidData.gravity != 0) {
                showMsg = true;
                $scope.continousPhaseErrorMsg.gravity = true;

            }
        }
        if (showMsg) {
            return false;
        } else {
            return true;
        }
    }
    $scope.resetDiscontPhaseErrorMsg = function () {
        $scope.disContinousPhaseErrorMsg = {
            name: false,
            density: {
                value: false,
                unit: false
            },
            ift: false,
            concentration: {
                value: false,
                unit: false
            },
            sameDensityUnits: false
        };
    }
    $scope.validateDisContinuousPhase = function () {
        $scope.resetDiscontPhaseErrorMsg();
        var showMsg = false;
        if (!$scope.disLiquidData.name || $scope.disLiquidData.name == undefined) {
            showMsg = true;
            $scope.disContinousPhaseErrorMsg.name = true;
        }
        if (!$scope.disLiquidData.interfacialTension || $scope.disLiquidData.interfacialTension == undefined) {
            showMsg = true;
            $scope.disContinousPhaseErrorMsg.ift = true;
        }
        if (!$scope.disLiquidData.density.value || $scope.disLiquidData.density.value == undefined) {
            showMsg = true;
            $scope.disContinousPhaseErrorMsg.density.value = true;
        }
        if ($scope.disLiquidData.density.unit == 'Units') {
            showMsg = true;
            $scope.disContinousPhaseErrorMsg.density.unit = true;
        }

        if (!$scope.disLiquidData.concentration.value || $scope.disLiquidData.concentration.value == undefined) {
            showMsg = true;
            $scope.disContinousPhaseErrorMsg.concentration.value = true;
        }
        if ($scope.disLiquidData.concentration.unit == 'Units') {
            showMsg = true;
            $scope.disContinousPhaseErrorMsg.concentration.unit = true;
        }



        if (showMsg) {
            return false;
        } else {
            return true;
        }
    }

    $scope.resetDisLiquidData = function () {
        $scope.disLiquidData = {
            density: {
                unit: $scope.densityUnitsOptions[0].value
            },
            concentration: {
                unit: $scope.concentrationUnitsOptions[0].value
            }
        }

    }
    $scope.contDensityUnitChange = function () {
        $scope.contdensityUnitFilled = false;
        if ($scope.liquidData.density.unit != 'Units') {
            $scope.contdensityUnitFilled = true;
        }
    }
    $scope.discontDensityUnitChange = function () {
        $scope.densityUnitFilled = false;
        if ($scope.disLiquidData.density.unit != 'Units') {
            $scope.densityUnitFilled = true;
        }
    }
    $scope.discontConcentrationUnitChange = function () {
        $scope.concentrationUnitFilled = false;
        if ($scope.disLiquidData.concentration.unit != 'Units') {
            $scope.concentrationUnitFilled = true;
        }
    }

    $scope.showDiscontinuousPhase = function () {
        if (!$scope.validateContinuousPhase()) {
            return;
        }


        if (!(($scope.temp_operating > 0 && $scope.temprature == 'Celsius') || ($scope.temp_operating > 32 && $scope.temprature == 'Fahrenheit')) && ($scope.gasValue == 'Water')) {
            //alert("not valid case")
            return;
        }
        if ($scope.lgCase) {
            $scope.showChangeSG = false;
        }
        $scope.viscosity999 = false;
        $scope.density999 = false;
        $scope.resetDiscontPhaseErrorMsg();
        $scope.resetDisLiquidData();
        $scope.populateDiscontLiquidOptions();
        $scope.disLiquidData.density.unit = $scope.liquidData.density.unit;

    }
    $scope.populateDiscontLiquidOptions = function () {
        //var dropDownUrl = "https://search.pall.com/services/sizing/rest/testgetlist?";
        var dropDownUrl = Constants.getList;
        dropDownUrl += 'TypeOfCallParam=LL';
        usSpinnerService.spin('spinner-1');
        $http.get(dropDownUrl).success(function (response) {
            if (response && response.elements) {
                response.elements.splice(0, 0, "Generic");
            }
            $scope.discontGasOptions = response.elements;
            $scope.discontGasValue = $scope.discontGasOptions[0];
            $scope.showFooterButtons = true;
            $scope.hideContinuousButtons = true;
            $scope.hideButtons = true;
            $scope.showCalc = true;
            $("#idCol3NOCoal").show();
        })
    }

    $scope.showBackContinousPhase = function () {
        if ($scope.lgCase) {
            $scope.showChangeSG = !$scope.showChangeSG;
        }
        $scope.resetDisLiquidData();
        $scope.slsProduct = $scope.slsProductOptions[0].value;
        $scope.testedFlowrate = "";
        $scope.slsTestUnit = $scope.slsTestUnitOptions[0].value;
        //$scope.discontGasValue = $scope.discontGasOptions[0];
        $scope.discontGasValue = undefined;
        $scope.slsCheck = false;
        $scope.presapration = false;
        $scope.projected = "";
        $scope.showFooterButtons = false;
        $scope.configurationNameError = false;
        $scope.showSaveBox = false;
        $scope.hideContinuousButtons = !$scope.hideContinuousButtons;
        $scope.disLiquidData.density.value = "";
        $scope.cpEditable = false;
        $scope.hideButtons = !$scope.hideButtons;
        $scope.showDangerProduct = false;
        $scope.showDangerTestedFlowRate = false;
        $scope.showDangerTestUnit = false;
        $scope.showDanger = false;
        $("#idCol3NOCoal").hide();
    }

    $scope.validateAll = function () {

        if (!(($scope.temp_operating > 0 && $scope.temprature == 'Celsius') || ($scope.temp_operating > 32 && $scope.temprature == 'Fahrenheit')) && ($scope.gasValue == 'Water' || $scope.discontGasValue == 'Water')) {
            //alert("not valid")
            return;
        }



        if ($scope.validateNext(true)) {
            if ($scope.validateContinuousPhase()) {
                if ($scope.validateDisContinuousPhase()) {
                    if ($scope.slsCheck) {
                        var showError = false;
                        $scope.showDangerProduct = false;
                        $scope.showDangerTestedFlowRate = false;
                        $scope.showDangerTestUnit = false;
                        if ($scope.slsProduct == 'Select' || $scope.slsProduct == undefined) {
                            $scope.showDangerProduct = true;
                            showError = true;
                        }
                        if ($scope.testedFlowrate == undefined) {
                            $scope.showDangerTestedFlowRate = true;
                            showError = true;
                        }
                        if ($scope.slsTestUnit == 'u' || $scope.slsTestUnit == undefined) {
                            $scope.showDangerTestUnit = true;
                            showError = true;
                        }
                        if (showError) {
                            return;
                        }
                    } else if ($scope.presapration) {
                        $scope.showDanger = false;
                        if ($scope.projected == undefined || $scope.projected == 0) {
                            $scope.showDanger = true;
                            return;
                        }
                    }
                    $scope.populateDataInFactory();
                    $scope.cpEditable = true
                    $scope.hideButtons = true;
                    $scope.hideDisButtons = true;
                    $state.go("graph");
                }
            }
        }
    }


    $scope.refreshPage = function () {
        $(".modal-backdrop.in").css("opacity", "0");
        $(".modal-backdrop.fade.in").css("display", "none");
        $("#newModal").modal('hide');
        Data.backButtonClicked = false;
        $state.go($state.current, {}, {
            reload: true
        });
    }

    $scope.modifyDisGasOptions = function () {
        $scope.disLiquidDataClone = angular.copy($scope.disLiquidData);
        $scope.disEdittable = !$scope.disEdittable;
        $scope.hideDisButtons = !$scope.hideDisButtons;
        $scope.disableBackButton = !$scope.disableBackButton;
    }
    $scope.disGasValueChange = function () {
        if ($scope.discontGasValue == 'Generic') {
            $scope.resetDisLiquidData();
        } else {
            var units = {
                units: []
            };
            usSpinnerService.spin('spinner-1');
            $scope.resetDiscontPhaseErrorMsg();
            var dropDownDataUrl = "";
            //dropDownDataUrl = 'https://search.pall.com/services/sizing/rest/testgetliquidprop?';
            dropDownDataUrl = Constants.liquidProp;
            dropDownDataUrl += "liquidParam=" + $scope.discontGasValue;
            dropDownDataUrl += "&tempParam=" + $scope.temp_operating;
            dropDownDataUrl += "&pressureParam=" + $scope.operating_pressure;
            dropDownDataUrl += "&optCorDParam=D";
            dropDownDataUrl += "&rhocParam=" + $scope.liquidData.density.value;

            if ($scope.lgCase) {
                dropDownDataUrl += "&gasParam=" + $scope.gasValue;
            }


            units.units.push($scope.temprature == 'Fahrenheit' ? 'F' : 'C');
            if ($scope.maxPressureUnits == 'Barg') {
                units.units.push('Bar');
            } else if ($scope.maxPressureUnits == 'mBarg') {
                units.units.push('mBar');
            } else {
                units.units.push($scope.maxPressureUnits);
            }
        
            units.units.push($scope.liquidData.density.unit);
            dropDownDataUrl += '&unitParam=' + JSON.stringify(units);
            dropDownDataUrl = encodeURI(dropDownDataUrl);
            console.log("dropDownUrl for discontinuous phase.." + dropDownDataUrl);
            usSpinnerService.spin('spinner-1');
            $http.get(dropDownDataUrl).success(function (response) {
                if (response && response.error && response.error.moremsg) {
                    $scope.exceptionMsg = response.error.moremsg;
                    $("#exceptionModal").modal('show');
                    return;
                }


                var rho = response.liquid.rho;
                if (rho == -999) {
                    $scope.disDensity999 = true;
                }
                if ($scope.getDecimalLength(rho)) {
                    rho = Number(rho).toFixed(6);
                }


                $scope.disLiquidData.name = $scope.discontGasValue;
                $scope.disLiquidData.density = {
                    value: Number(rho),
                    unit: $scope.densityUnitsOptions[1].value
                };
                if (response.liquid.IFT) {
                    var ift = response.liquid.IFT;
                    if (ift == -999) {
                        $scope.disIFT999 = true;
                    }
                    if ($scope.getDecimalLength(ift)) {
                        ift = Number(ift).toFixed(6);
                    }
                    $scope.disLiquidData.interfacialTension = Number(ift);
                }

            })
        }
    }
    $scope.resetLiquidData = function () {
        $scope.liquidData = {
            density: {
                unit: $scope.densityUnitsOptions[0].value
            }
        };
    }
    var selectedContinuousPhase = {};

    $scope.getDecimalLength = function (value) {
        if (!value) return;
        if (value == "NaN") {
            return "NaN";
        }

        value = value.split(".");

        if (value && value.length > 0) {
            value = value[1];
            if (value.toString().length > 6) {
                return true;
            }
            return false;
        }
    }


    $scope.gasValueChange = function () {
        if ($scope.lgCase) {
            $scope.liquidData.gravity = Number(($scope.getListResponse[$scope.gasValue])).toFixed(3);
        }
        if ($scope.gasValue == 'Generic') {
            if ($scope.lgCase) {
                $scope.sgEditable = false;
                $scope.showChangeSG = false;
            }
            $scope.resetLiquidData();
        } else {
            if ($scope.lgCase) {
                $scope.sgEditable = true;
                $scope.showChangeSG = true;
            }
            var units = {
                units: []
            };
            $scope.resetContinuousPhaseErrorMsg();
            var dropDownDataUrl = "";
            if ($scope.llCase) {
                dropDownDataUrl = Constants.liquidProp;
                dropDownDataUrl += "liquidParam=" + $scope.gasValue;
                dropDownDataUrl += "&tempParam=" + $scope.temp_operating;
                dropDownDataUrl += "&pressureParam=" + $scope.operating_pressure;
                dropDownDataUrl += "&optCorDParam=C";
                dropDownDataUrl += "&rhocParam=0";
                units.units.push($scope.temprature == 'Fahrenheit' ? 'F' : 'C');
                //units.units.push($scope.maxPressureUnits);
            } else {
                dropDownDataUrl += Constants.gasProp;
                dropDownDataUrl += "gasParam=" + $scope.gasValue;
                dropDownDataUrl += "&tempParam=" + $scope.temp_operating;
                dropDownDataUrl += "&pressureParam=" + $scope.operating_pressure;
                dropDownDataUrl += "&sgParam=" + $scope.liquidData.gravity;
                units.units.push($scope.temprature == 'Fahrenheit' ? 'F' : 'C');
                //units.units.push($scope.maxPressureUnits);
            }
            if ($scope.maxPressureUnits == 'Barg') {
                units.units.push('Bar');
            } else if ($scope.maxPressureUnits == 'mBarg') {
                units.units.push('mBar');
            } else {
                units.units.push($scope.maxPressureUnits);
            }
            dropDownDataUrl += '&unitParam=' + JSON.stringify(units);
            dropDownDataUrl = encodeURI(dropDownDataUrl);
            console.log("dropDownUrl for continuous phase.." + dropDownDataUrl);
            usSpinnerService.spin('spinner-1');
            $http.get(dropDownDataUrl).success(function (response) {
                if (response && response.error && response.error.moremsg) {
                    $scope.exceptionMsg = response.error.moremsg;
                    $("#exceptionModal").modal('show');
                    return;
                }

                if ($scope.llCase) {
                    var mu = response.liquid.muc;
                    if (mu == -999) {
                        $scope.viscosity999 = true;
                    } else {
                        $scope.viscosity999 = false;
                    }
                    if ($scope.getDecimalLength(mu)) {
                        mu = Number(mu).toFixed(6);
                    }

                    $scope.liquidData.viscosity = Number(mu);

                    var rho = response.liquid.rho;
                    if ($scope.getDecimalLength(rho)) {
                        rho = Number(rho).toFixed(6);
                    }
                    if (rho == -999) {
                        $scope.density999 = true;
                    } else {
                        $scope.density999 = false;
                    }
                    $scope.liquidData.density = {
                        value: Number(rho),
                        unit: $scope.densityUnitsOptions[1].value
                    };
                } else {
                    var mu = response.gas.muc;
                    if (mu == -999) {
                        $scope.density999 = true;
                    } else {
                        $scope.density999 = true;
                    }
                    if ($scope.getDecimalLength(mu)) {
                        mu = Number(mu).toFixed(6);
                    }
                    $scope.liquidData.viscosity = Number(mu);


                    var rho = response.gas.rho;
                    if (rho == -999) {
                        $scope.viscosity999 = true;
                    } else {
                        $scope.viscosity999 = false;
                    }
                    if ($scope.getDecimalLength(rho)) {
                        rho = Number(rho).toFixed(6);
                    }

                    $scope.liquidData.density = {
                        value: Number(rho),
                        unit: $scope.densityUnitsOptions[1].value
                    };


                }


                $scope.liquidData.name = $scope.gasValue;



            })
        }
    }

    $scope.populateDataInFactory = function () {
        Data.data.solveFor = $scope.selectValue;
        if ($scope.selectValue == "Maximum Flowrate") {
            Data.data.number_of_col = $scope.number_of_col;
            Data.data.coalesUnits = $scope.coalesUnits;
        } else {
          
            Data.data.flowRate = $scope.flowRate;
            Data.data.flowRateUnit = $scope.flowRateUnit;
        }
        Data.data.testedFlowrate = $scope.testedFlowrate;
        Data.data.maximum_pressure = $scope.maximum_pressure;
        Data.data.operating_pressure = $scope.operating_pressure;
        Data.data.temp_operating = $scope.temp_operating;
        Data.data.maxPressureUnits = $scope.maxPressureUnits;
        Data.data.opPressureUnits = $scope.opPressureUnits;
        Data.data.temprature = $scope.temprature;
        Data.data.gasValue = $scope.gasValue;
        Data.data.disGasValue = $scope.disGasValue;
        Data.data.liquidData = $scope.liquidData;
        Data.data.disLiquidData = $scope.disLiquidData;
        Data.data.densityUnit = $scope.densityUnit;
        Data.data.disDensityUnit = $scope.disDensityUnit;
        Data.data.concentrationUnit = $scope.concentrationUnit;
        Data.data.projected = $scope.projected;
        Data.data.presapration = $scope.presapration;
        Data.data.liquidFlowRateUnits = $scope.liquidFlowRateUnits;
        Data.data.slTest = $scope.slTest;
        Data.data.discontGasValue = $scope.discontGasValue;
        Data.data.slsProduct = $scope.slsProduct;
        Data.data.slsCheck = $scope.slsCheck;
        Data.data.testedFlowrate = $scope.testedFlowrate;
        Data.data.slsTestUnit = $scope.slsTestUnit;
        Data.data.llCase = $scope.llCase;
        Data.data.lgCase = $scope.lgCase;
        Data.data.gasOptions = $scope.gasOptions;
        Data.data.discontGasOptions = $scope.discontGasOptions;
        Data.data.slsCheck = $scope.slsCheck;
        Data.data.presapration = $scope.presapration;
        Data.data.slsProductOptions = $scope.slsProductOptions;
        Data.data.configurationName = $scope.configurationName;
        Data.data.fileId = $scope.fileId;
        Data.data.showSaveBox = $scope.showSaveBox;
        Data.data.nozzleSize = $scope.nozzleSize;
        Data.data.nozzleSizeUnit = $scope.nozzleSizeUnit;
        Data.data.maxSaturatedDP = $scope.maxSaturatedDP;
        Data.data.maxCleanDP = $scope.maxCleanDP;
        Data.data.maxSaturatedDPUnit = $scope.maxSaturatedDPUnit;
        Data.data.maxCleanDPUnit = $scope.maxCleanDPUnit;

    }
});
