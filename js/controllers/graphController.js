angular.module('app').controller('graphController', function ($scope, $state, Data, $http, $location, usSpinnerService, $filter, Constants, $timeout, user, calculateService) {
    if (Data && Object.keys(Data.data).length == 0) {
        //console.log($state)
        $state.go("home");
        return;
    }

    console.log("DAta.data..." + JSON.stringify(Data.data));
    var sFor = Data.data.solveFor;
    var flowRateUnitValue;
    if (sFor == "Maximum Flowrate") {
        flowRateUnitValue = Data.data.coalesUnits;
    } else {
        flowRateUnitValue = Data.data.flowRateUnit;
    }

    console.log("flowRateUnit...." + flowRateUnitValue);
    var imperialCaseUnits = ["LG", "GPM", "ACFM", "SCFM", "MMSCFD"];
    var metricCaseUnits = ["LL", "LPM", "NM^3/hr","NM^3/HR", "AM^3/hr","AM^3/HR", "M^3/HR (LIQ)"];

    $scope.outputUnits = {
        pressure: "PSID",
        length: "inch",
        coalesced_flow: "gpm",
        velocity: "ft/s",
        media_velocity: "ft/min"
    };

    if (metricCaseUnits.indexOf(flowRateUnitValue) != -1) {
        $scope.outputUnits = {
            pressure: "mBarD",
            length: "mm",
            coalesced_flow: "M^3/hr",
            velocity: "m/s",
            media_velocity: "m/min"
        };
    }

    var lineObj = {
        type: 'columnrange',
        name: 'Temperatures',
        datalabels: {
            enabled: false
        },
        data: []
    }
    var redLineObj = {
        name: 'Temperatures',
        datalabels: {
            enabled: false
        },
        type: 'columnrange',
        data: []
    }
    var pointsObj = {
        type: 'scatter',

        dataLabels: {
            enabled: true,
            x: 33,
            y: 12,
            style: {
                color: '#FFFFFF',
                textShadow: 'none',
                fontSize: "9px"
            }
        },
        lineWidth: 0,
        states: {
            hover: {
                enabled: false
            }
        },
        marker: {
            symbol: "url(./images/red.png)",
            radius: 5,
            lineWidth: 1,
            lineColor: Highcharts.getOptions().colors[3],
            fillColor: 'white'
        },
        data: []
    }
    var fixedPointsObj = {
        type: 'scatter',

        dataLabels: {
            enabled: true,
            x: -33,
            y: 12,
            style: {
                color: '#FFFFFF',
                textShadow: 'none',
                fontSize: "9px"
            }
        },
        lineWidth: 0,
        states: {
            hover: {
                enabled: false
            }
        },
        marker: {
            symbol: "url(./images/grey.png)",
            radius: 5

        },
        data: []
    }
    var slsObj = {
        type: 'scatter',

        dataLabels: {
            allowOverlap: false,
            enabled: true,
            x: 0,
            y: -20,
            borderRadius: 5,
            backgroundColor: '#0db9f0',
            borderWidth: 1,
            borderColor: '#0db9f0',
            style: {
                color: '#FFFFFF',
                textShadow: 'none',
                fontSize: "9px"
            },
            formatter: function () {
                return "SLS Tested"
            }
        },
        lineWidth: 0,
        states: {
            hover: {
                enabled: false
            }
        },
        marker: {
            symbol: "url(./images/circle-blue.png)"
        },
        data: []
    }
    var hiddenObj = {
        type: 'scatter',

        dataLabels: {
            allowOverlap: false,
            enabled: false,
            x: 0,
            y: -20,
            borderRadius: 5,
            backgroundColor: '#0db9f0',
            borderWidth: 1,
            borderColor: '#0db9f0',
            style: {
                color: '#FFFFFF',
                textShadow: 'none',
                fontSize: "9px"
            },
            formatter: function () {
                return "SLS Tested"
            }
        },
        lineWidth: 0,
        states: {
            hover: {
                enabled: false
            }
        },
        marker: {
            symbol: "url(./images/transparent.png)"
        },
        data: []
    }
    $scope.makeFileSelected = function (id) {
        $scope.selectedFileId = id;
    }
    $scope.openRecent = function () {
        if (user.get()) {
            usSpinnerService.spin('spinner-1');
            $http.get(Constants.openRecentUrl + "?usernameParam=" + user.get())
                .then(function (response) {
                    usSpinnerService.stop('spinner-1');
                    if (response && response.data) {
                        $scope.recentData = response.data.configfile;
                    }
                })
                .catch(function (error) {
                    usSpinnerService.stop('spinner-1');
                    alert('XHR Failed for getOpenRecentFailed [ ' + error.data + ' ]');
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
    $scope.open = function () {
        if (user.get()) {
            usSpinnerService.spin('spinner-1');
            $http.get(Constants.openList + "usernameParam=" + user.get())
                .then(function (response) {
                    usSpinnerService.stop('spinner-1');
                    if (response && response.data) {
                        for (var i = 0; i < response.data.userfiles.length; i++) {
                            response.data.userfiles[i].modifiedDate = moment(response.data.userfiles[i].saveddate).format("MM-DD-YYYY");
                        }
                        $scope.openList = response.data.userfiles;

                    }
                })
                .catch(function (error) {
                    usSpinnerService.stop('spinner-1');
                    alert('XHR Failed for getListFailed [ ' + error.data + ' ]');
                });
        }
    }
    $scope.openRecentById = function (id) {
        $(".modal-backdrop.in").css("opacity", "0");
        $(".modal-backdrop.fade.in").css("display", "none");
        $("#openModal").modal('hide');
        $state.go("home", {
            id: id
        });
    }
    var domainInfo = "";
    $scope.comparison = false;
    $scope.showModal = false;
    $scope.productjsonkeymap = {};
    $scope.$watch("inputRangeValue", function (newValue, oldValue) {

        if ($scope.dataRangeValue == 'Select Attribute') {
            return;
        }

        console.log("in watch");

        var element = angular.element(document.getElementById("horizontalSlider"));
        if (element && element.context.childNodes && element.context.childNodes.length > 0) {
            element.context.childNodes[0].text = newValue || 0;
        }
        if (newValue != oldValue && newValue !== undefined && oldValue !== undefined && !isNaN(oldValue) && !isNaN(newValue)) {
            var series = $scope.highchartsNG.series;
            var indexInSeries;
            for (var i = 0; i < $scope.currentProducts.length; i++) {
                if ($scope.currentProducts[i].prodid == $scope.selectedProductInfo.prodid) {
                    indexInSeries = i;
                    break;
                }
            }
            var qaSysSense = $scope.currentProducts[indexInSeries][$scope.outputVariable] || {};
            if (qaSysSense.OutVar) {
                newValue += $scope.slideRange.keys;
                $scope.jsonKey = newValue;
                var valueToSet = qaSysSense.OutVar[newValue];
                if (valueToSet) {
                    var finalValue = $scope.diameterOrLenght == "diameter" ? valueToSet.oDh : valueToSet.Lhs;
                    if (finalValue != -999) {
                        series[2].data[indexInSeries] = Number(Math.round(finalValue.toFixed(4)));
                        $scope.productjsonkeymap[$scope.selectedProductInfo.prodid] = {
                            jsonKey: $scope.jsonKey,
                            inputRangeValue: $scope.inputRangeValue
                        };
                        for (var i = 0; i < $scope.productsToCompare.length; i++) {
                            if ($scope.productsToCompare[i].prodid == $scope.selectedComparisonProduct.prodid) {
                                $scope.productsToCompare[i]["compareValues"] = $scope.productsToCompare[i]["compareValues"] || {};
                                $scope.productsToCompare[i]["compareValues"][$scope.outputVariable] = {};
                                var obj = $scope.productsToCompare[i][$scope.outputVariable].OutVar[$scope.jsonKey];
                                for (var key in obj) {
                                    $scope.productsToCompare[i]["compareValues"][$scope.outputVariable][key] = obj[key];
                                }
                            }
                        }
                    }
                }
            }
        }
    });

    function populateDataRangeSliderOptions() {
        $scope.dataRangeOptions = [];
        $scope.dataRangeOptions.push({
            value: "Select Attribute",
            display: "Nominal"
        });
        if (Data.data.solveFor == "Maximum Flowrate") {
            $scope.dataRangeOptions.push({
                value: "Number of Coalescer",
                display: "Number of Coalescer"
            })
            $scope.isGas = Data.data.coalesUnits == "LG" ? true : false;
        } else {
            $scope.dataRangeOptions.push({
                value: "Flowrate",
                display: "Flowrate"
            });
            if (Data.data.liquidFlowRateUnits && Data.data.liquidFlowRateUnits.length > 0) {
                $scope.isGas = Data.data.liquidFlowRateUnits.indexOf(Data.data.flowRateUnit) == -1 ? true : false;
            }
        }
        $scope.dataRangeOptions.push({
            value: "Max Pressure",
            display: "Max Pressure"
        }, {
            value: "Continuous Density",
            display: "Continuous Density"
        }, {
            value: "Discontinuous Density",
            display: "Discontinuous Density"
        }, {
            value: "Viscosity",
            display: "Viscosity"
        }, {
            value: "IFT",
            display: "IFT"
        }, {
            value: "Concentration",
            display: "Concentration"
        }, {
            value: "Nozzle DP",
            display: "Nozzle DP"
        });
        if ($scope.lgCase) {
            $scope.dataRangeOptions.push({
                value: "Max Clean DP",
                display: "Max Clean DP"
            })
        }
        $scope.dataRangeValue = $scope.dataRangeOptions[0].value;
    }

    function check999Case() {
        if ($scope.selectedProductInfo && $scope.selectedProductInfo[$scope.outputVariable]) {
            var dL = $scope.diameterOrLenght == 'diameter' ? 'oDh' : 'Lhs'
            $scope.selectedProductInfo[$scope.outputVariable][dL] == -999 ? $scope.selectedProductInfo.disableSlider = true : $scope.selectedProductInfo.disableSlider = false;
        }
    }
    $scope.selectComparedProduct = function (product) {
        for (var i = 0; i < $scope.productsToCompare.length; i++) {
            if ($scope.productsToCompare[i].prodid == product.prodid) {
                $scope.selectedComparisonProduct = $scope.productsToCompare[i];
                $scope.selectedProductInfo = $scope.productsToCompare[i];
            }
        }
        check999Case();
    }
    $scope.llCase = Data.data.llCase;
    $scope.lgCase = Data.data.lgCase;
    $scope.resetSlider = function (flag) {
        $scope.inputRangeValue = 0;
        $timeout(function () {
            $scope.$broadcast('rzSliderForceRender');
        });
        if (flag) {
            $scope.resetGraphPointer();
        }
    }
    $scope.solveFor = Data.data.solveFor;
    populateDataRangeSliderOptions();
    $scope.numberOfProductsToShow = 6;
    //service to get Chart Data
    setTimeout(function () {
        $scope.outputServiceResponse = [];
        $scope.outputServiceResponseClone = [];
        $scope.productColors = ["lightGreen", "darkGreen", "lightRed", "yellow", "voilet", "lightBlue", "seaGreen"];
        var promise = calculateService.getData(Data.data, $scope.lgCase, $scope.llCase);
        promise.then(function (response) {
            response = response.data;
            $scope.graphInput = angular.copy(Data.data);
            $scope.graphInput.length = "inch";
            $scope.graphInput.temprature = ($scope.graphInput.temprature == 'Fahrenheit') ? ' F' : ' C';
            $scope.graphInput.disLiquidData.concentration.unit = ($scope.graphInput.disLiquidData.concentration.unit == 'ppm' ? "PPM weight" : "% weight ");
            $scope.CPNAME = Data.data.liquidData.name;
            $scope.DPNAME = Data.data.disLiquidData.name;
            if (response && response.error && response.error.message) {
                $scope.exceptionMsg = response.error.message;
                $("#exceptionModal").modal('show');
                return;
            }
            $scope.outputServiceResponse = response.Products;
            $scope.outputServiceResponseClone = response.Products;
            $scope.outputVariable = Data.data.solveFor == 'Number of Coalescer' ? "QASysSense" : "NcSense";
            $scope.slideRange = {};
            if ($scope.outputServiceResponse && $scope.outputServiceResponse.length > 0) {
                $scope.setSliderRange($scope.outputServiceResponse);
            }
            $scope.highchartData = $scope.outputServiceResponse;
            $scope.productFamily = [];
            // populate product family
            if ($scope.outputServiceResponse && $scope.outputServiceResponse.length > 0) {
                for (var i = 0; i < $scope.outputServiceResponse.length; i++) {
                    if ($scope.productFamily.indexOf($scope.outputServiceResponse[i].ProductName) == -1) {
                        $scope.productFamily.push($scope.outputServiceResponse[i].ProductName);
                    }
                }
            }
            $scope.series = $scope.populateChartDataForNominal($scope.outputServiceResponse);
            //for pagination
            $scope.skip = 0;
            $scope.hasNext = ($scope.outputServiceResponse && $scope.outputServiceResponse.length > $scope.numberOfProductsToShow) ? true : false;
            $scope.limit = ($scope.outputServiceResponse && $scope.outputServiceResponse.length > $scope.numberOfProductsToShow) ? $scope.numberOfProductsToShow : ($scope.outputServiceResponse ? $scope.outputServiceResponse.length : 0);
            //for the first six products
            if ($scope.outputServiceResponse && $scope.outputServiceResponse.length > 0) {
                $scope.currentProducts = angular.copy($scope.outputServiceResponse).splice($scope.skip, $scope.limit);
            }
            console.log("currentProducts at start.." + JSON.stringify($scope.currentProducts));
            // defination of the ng-highchart 
            $scope.highchartsNG = {
                options: {
                    chart: {
                        events: {
                            load: function () {
                                this.renderer.image('./images/graph.jpg', 0, 0, 740, 240).add();
                            }
                        }
                    },
                    plotOptions: {
                        series: {
                            dataLabels: {

                            },
                            grouping: false,
                            borderWidth: 0,
                            pointWidth: 5
                        }
                    },
                    title: {
                        text: ""
                    },
                    subtitle: {
                        enabled: false
                    },
                    credits: {
                        enabled: false
                    },
                    exporting: {
                        enabled: false
                    },
                    legend: {
                        enabled: false
                    },
                    tooltip: {
                        enabled: false
                    }
                },
                xAxis: {
                    labels: {
                        enabled: false
                    },
                    visible: false
                        //categories: [1, 2]
                },
                yAxis: {
                    title: {
                        enabled: false
                    },
                    labels: {
                        distance: 0,
                        x: 0
                    },
                    style: {
                        "fontSize": "5px"
                    }
                },
                series: $scope.series
            }
            $scope.prev = function () {
                $scope.skip = $scope.skip - $scope.numberOfProductsToShow;
                if ($scope.currentProducts.length < $scope.numberOfProductsToShow) {
                    $scope.limit = $scope.limit - $scope.currentProducts.length;
                } else {
                    $scope.limit = $scope.limit - $scope.numberOfProductsToShow;
                }
                $scope.currentProducts = angular.copy($scope.outputServiceResponseClone).splice($scope.skip, $scope.numberOfProductsToShow);
                if ($scope.limit < $scope.outputServiceResponseClone.length) {
                    $scope.hasNext = true;
                }
                /*console.log("limit in prev.." + $scope.limit);
                console.log("skip in prev.." + $scope.skip);
                console.log("curretnProducts in prev.." + JSON.stringify($scope.currentProducts));*/
                $scope.updateChartData();
            }
            $scope.next = function () {
                $scope.skip = $scope.skip + $scope.numberOfProductsToShow;
                if (!(($scope.limit + $scope.numberOfProductsToShow) <= $scope.outputServiceResponseClone.length)) {
                    $scope.currentProducts = angular.copy($scope.outputServiceResponseClone).splice($scope.skip, ($scope.outputServiceResponseClone.length - $scope.limit));
                    $scope.limit = $scope.outputServiceResponseClone.length;
                } else {
                    $scope.limit = $scope.limit + $scope.numberOfProductsToShow;
                    $scope.currentProducts = angular.copy($scope.outputServiceResponseClone).splice($scope.skip, $scope.numberOfProductsToShow);
                }
                if ($scope.limit >= $scope.outputServiceResponseClone.length) {
                    $scope.hasNext = false;
                }
                /*console.log("limit in next.." + $scope.limit);
                console.log("skip in next.." + $scope.skip);
                console.log("curretnProducts in next.." + JSON.stringify($scope.currentProducts));*/
                $scope.updateChartData();
            }
            $scope.updateChartData = function () {
                // show Charts 
                if ($scope.dataRangeValue != 'Select Attribute') {
                    $scope.showOther($scope.diameterOrLenght);
                } else {
                    $scope.showNominal($scope.diameterOrLenght);
                }
                $scope.productColor = $scope.productColors[0];
                if ($scope.currentProducts && $scope.currentProducts.length > 0) {
                    $scope.selectedProductInfo = $scope.currentProducts[0];
                } else {
                    $scope.selectedProductInfo = {};
                }
                check999Case();
            }
            $scope.selectedProductInfo = (($scope.currentProducts && $scope.currentProducts.length > 0) ? $scope.currentProducts[0] : {});
            check999Case();
            $scope.productColor = $scope.productColors[0];
            $scope.selectedProduct = function (product, index) {
                $scope.resetSlider();
                $scope.productColor = $scope.productColors[index];
                for (var i = 0; i < $scope.currentProducts.length; i++) {
                    if ($scope.currentProducts[i].prodid == product.prodid) {
                        $scope.selectedProductInfo = $scope.currentProducts[i];
                    }
                }
                check999Case();
                if ($scope.productjsonkeymap[$scope.selectedProductInfo.prodid]) {
                    var obj = $scope.productjsonkeymap[$scope.selectedProductInfo.prodid];
                    $scope.inputRangeValue = obj.inputRangeValue;
                    $scope.jsonKey = obj.jsonKey;
                }
            }
            $scope.resetGraphPointer = function () {
                if ($scope.dataRangeValue != 'Select Attribute') {
                    var series = $scope.highchartsNG.series;
                    var indexInSeries;
                    for (var i = 0; i < $scope.currentProducts.length; i++) {
                        if ($scope.currentProducts[i].prodid == $scope.selectedProductInfo.prodid) {
                            indexInSeries = i;
                            break;
                        }
                    }
                    var qaSysSense = $scope.currentProducts[indexInSeries][$scope.outputVariable] || {};
                    if (qaSysSense.OutVar) {
                        var valueToSet = qaSysSense.OutVar[$scope.slideRange.keys];
                        //console.log("valueToSet..." + JSON.stringify(valueToSet));
                        if (valueToSet) {
                            var finalValue = ($scope.diameterOrLenght == "diameter" ? valueToSet.oDh : valueToSet.Lhs);
                            //console.log("finalValue at reset slider..." + Number((finalValue).toFixed(4)));
                            series[2].data[indexInSeries] = [series[2].data[indexInSeries][0], Number((finalValue).toFixed(4))];
                        }
                    }
                }
            }
            $scope.favourites = [];
            $scope.allFav = [];
            $scope.addFavourite = function (product) {
                var found = false;
                var index;
                for (var i = 0; i < $scope.favourites.length; i++) {
                    if ($scope.favourites[i].prodid === product.prodid) {
                        found = true;
                        index = i;
                        break;
                    }
                }
                if (!found) {
                    for (var i = 0; i < $scope.currentProducts.length; i++) {
                        if ($scope.currentProducts[i].prodid == product.prodid) {
                            product.color = $scope.productColors[i];
                        }
                    }
                    $scope.favourites.push(product);
                    $scope.allFav.push(product.prodid);
                } else {
                    $scope.favourites.splice(index, 1);
                    $scope.allFav.splice($scope.allFav.indexOf(product.prodid), 1);
                    var indexInProductsToCompare = $scope.getIndexInProductsToCompare(product);
                    if (indexInProductsToCompare) {
                        $scope.productsToCompare.splice(i, 1);
                    }
                }
            }
            $scope.productsToCompare = [];
            $scope.compareSelection = function (flag) {
                if ($scope.productsToCompare.length < 2 && flag) {
                    $scope.modalBody = "Select atleast 2 products to compare."
                    $scope.showModal = !$scope.showModal;
                } else {
                    $scope.selectedComparisonProduct = $scope.productsToCompare[0];
                    $scope.drawChartOfComparedProducts();
                    $scope.comparison = !$scope.comparison;
                }
            }
            $scope.resetSelection = function () {
                $scope.comparison = !$scope.comparison;
                $scope.toggleFilter();
            }
            $scope.drawChartOfComparedProducts = function () {
                var filteredProducts = [];
                for (var i = 0; i < $scope.productsToCompare.length; i++) {
                    filteredProducts.push($scope.productsToCompare[i]);
                }
                $scope.outputServiceResponseClone = filteredProducts;
                $scope.currentProducts = filteredProducts;
                if ($scope.currentProducts.length < $scope.numberOfProductsToShow) {
                    $scope.limit = $scope.currentProducts.length;
                } else {
                    $scope.limit = $scope.numberOfProductsToShow;
                }
                if ($scope.limit >= filteredProducts.length) {
                    $scope.hasNext = false;
                } else {
                    $scope.hasNext = true;
                }
                $scope.updateChartData();
            }
            $scope.getIndexInProductsToCompare = function (product) {
                var index;
                for (var i = 0; i < $scope.productsToCompare.length; i++) {
                    if ($scope.productsToCompare[i].prodid === product.prodid) {
                        index = i;
                        break;
                    }
                }
                return index;
            }
            $scope.compareList = [];
            $scope.addToCompareList = function (product) {
                var found = false;
                var index = $scope.getIndexInProductsToCompare(product);
                if (index !== undefined) {
                    found = true;
                }
                if (!found) {
                    if ($scope.productsToCompare.length >= 3) {
                        $scope.modalBody = "Maximum 3 Products can be compared at once."
                        $scope.showModal = !$scope.showModal;
                    } else {
                        $scope.compareList.push(product.prodid);
                        for (var i = 0; i < $scope.favourites.length; i++) {
                            if ($scope.favourites[i].prodid == product.prodid) {
                                $scope.favourites[i].color = $scope.productColors[i];
                                $scope.favourites[i]["compareValues"] = $scope.favourites[i]["compareValues"] || {};
                                $scope.favourites[i]["compareValues"][$scope.outputVariable] = {};
                                var index = $scope.productjsonkeymap[product.prodid] ? $scope.productjsonkeymap[product.prodid].jsonKey : $scope.jsonKey;
                                var obj = $scope.favourites[i][$scope.outputVariable].OutVar[index];
                                for (var key in obj) {
                                    $scope.favourites[i]["compareValues"][$scope.outputVariable][key] = obj[key];
                                }
                                $scope.productsToCompare.push($scope.favourites[i]);
                            }
                        }
                        if ($scope.comparison) {
                            $scope.drawChartOfComparedProducts();
                        }
                    }
                } else {
                    $scope.compareList.splice($scope.compareList.indexOf(product.prodid), 1);
                    $scope.productsToCompare.splice(index, 1);
                    if ($scope.comparison) {
                        $scope.drawChartOfComparedProducts();
                    }
                }
            }
        })
    }, 1600)
    $scope.populateChartDataForNominal = function (outputServiceResponse) {
        var highChartSeries = [];
        var lineObj = {
            type: 'columnrange',
            name: 'Temperatures',
            datalabels: {
                enabled: false
            },
            data: []
        }
        var pointsObj = {
            type: 'scatter',

            dataLabels: {
                enabled: true,
                x: 33,
                y: 12,
                style: {
                    color: '#FFFFFF',
                    textShadow: 'none',
                    fontSize: "9px"
                }
            },
            lineWidth: 0,
            states: {
                hover: {
                    enabled: false
                }
            },
            marker: {
                symbol: "url(./images/red.png)",
                radius: 5,
                lineWidth: 1,
                lineColor: Highcharts.getOptions().colors[3],
                fillColor: 'white'
            },
            data: []
        }
        var slsObj = {
            type: 'scatter',

            dataLabels: {
                allowOverlap: false,
                enabled: true,
                x: 0,
                y: -20,
                borderRadius: 5,
                backgroundColor: '#0db9f0',
                borderWidth: 1,
                borderColor: '#0db9f0',
                style: {
                    color: '#FFFFFF',
                    textShadow: 'none',
                    fontSize: "9px"
                },
                formatter: function () {
                    return "SLS Tested"
                }
            },
            lineWidth: 0,
            states: {
                hover: {
                    enabled: false
                }
            },
            marker: {
                symbol: "url(./images/circle-blue.png)"
            },
            data: []
        }
        var hiddenObj = {
            type: 'scatter',

            dataLabels: {
                allowOverlap: false,
                enabled: false,
                x: 0,
                y: -20,
                borderRadius: 5,
                backgroundColor: '#0db9f0',
                borderWidth: 1,
                borderColor: '#0db9f0',
                style: {
                    color: '#FFFFFF',
                    textShadow: 'none',
                    fontSize: "9px"
                },
                formatter: function () {
                    return "SLS Tested"
                }
            },
            lineWidth: 0,
            states: {
                hover: {
                    enabled: false
                }
            },
            marker: {
                symbol: "url(./images/transparent.png)"
            },
            data: []
        }
        var length;
        if (outputServiceResponse && outputServiceResponse.length > $scope.numberOfProductsToShow) {
            length = $scope.numberOfProductsToShow;
        } else {
            length = outputServiceResponse ? outputServiceResponse.length : 0;
        }
        for (var i = 0; i < length; i++) {
            var nominal = outputServiceResponse[i].Nominal;
            nominal.oDh = Number(Math.round((nominal.oDh).toFixed(4)))
            if (nominal.oDh != -999) {
                lineObj.data.push({
                    x: i,
                    low: nominal.oDh_Min,
                    high: nominal.oDh_Max,
                    color: "#636363"
                })
            } else {
                lineObj.data.push("");
            }
            if (nominal.oDh != -999) {
                var imageUrl;
                if ($scope.lgCase) {
                    imageUrl = "url(./images/red-orange.png)"
                } else {
                    imageUrl = outputServiceResponse[i].config == 2 ? "url(./images/red-orange.png)" : "url(./images/red-blue.png)"
                }
                pointsObj.data.push({
                    y: nominal.oDh,
                    marker: {
                        symbol: imageUrl,
                        radius: 5,
                        lineWidth: 1,
                        lineColor: Highcharts.getOptions().colors[3],
                        fillColor: 'white'
                    }
                });
            } else {
                pointsObj.data.push("");
            }

            if (nominal.isSLS == "YES" && nominal.oDh != -999) {
                var slsValue = Number(nominal.oDh_Min);
                slsObj.data.push(slsValue);
                //slsObj.data.push(Number(nominal.oDh_Max))
            } else {
                slsObj.data.push("")
            }
            hiddenObj.data.push("");
        }
        highChartSeries.push(lineObj);
        highChartSeries.push(pointsObj);
        highChartSeries.push(slsObj);
        highChartSeries.push(hiddenObj);
        return highChartSeries;
    }
    $scope.greyNochesPosition = function (length, index) {
        if (length == 0) {
            return -0.04;
        } else if (length == 1) {
            if (index == 0) {
                return -0.09;
            }

            return -0.9;
        }
    }
    $scope.setSliderRange = function (chartData) {
        var jsonObject = chartData[0][$scope.outputVariable] || {}

        if (jsonObject.OutVar) {
            var length = Object.keys(jsonObject.OutVar).length;
            var keys = Object.keys(jsonObject.OutVar);
            //$scope.slideRange.min = keys[0];
            //$scope.slideRange.max = keys[length - 1];
            var min = keys[0];
            var max = keys[length - 1];;

            if (length % 2 == 0) {
                //length = (length / 2) - 1;
                length = (length / 2);
            } else {
                length = Math.floor(length / 2) + 1;
            }


            $scope.slideRange.keys = length;
            $scope.jsonKey = length;

            $timeout(function () {
                $scope.$broadcast('rzSliderForceRender');
            });


            $scope.slideRange.min = Number(min) - length;
            $scope.slideRange.max = Number(max) - length;

            //console.log($scope.slideRange);
            if (!$scope.$$phase) $scope.$apply()
                //console.log("jsonkey..starting.." + $scope.slideRange);
        }

    }
    $scope.diameterOrLenght = "diameter";
    $scope.handleDataRangeValueChange = function () {
        $scope.inputRangeValue = 0;
        for (var key in $scope.productjsonkeymap) {
            delete $scope.productjsonkeymap[key];
        }
        console.log("productjsonkeymapping in handle data range value.." + JSON.stringify($scope.productjsonkeymap));
        if ($scope.dataRangeValue != 'Select Attribute') {
            if ($scope.dataRangeValue == 'Flowrate') {
                $scope.outputVariable = "QASysSense";
            } else if ($scope.dataRangeValue == 'Number of Coalescer') {
                $scope.outputVariable = "NcSense";
            } else if ($scope.dataRangeValue == 'Max Pressure') {
                $scope.outputVariable = 'PmaxSense';
            } else if ($scope.dataRangeValue == 'Continuous Density') {
                $scope.outputVariable = 'rhoCSense';
            } else if ($scope.dataRangeValue == 'Discontinuous Density') {
                $scope.outputVariable = 'rhoDSense';
            } else if ($scope.dataRangeValue == 'Operating Pressure') {
                $scope.outputVariable = 'PopgSense';
            } else if ($scope.dataRangeValue == 'Operating Temperature') {
                $scope.outputVariable = 'TopSense';
            } else if ($scope.dataRangeValue == 'Viscosity') {
                $scope.outputVariable = 'MucSense';
            } else if ($scope.dataRangeValue == 'IFT') {
                $scope.outputVariable = 'IFTSense';
            } else if ($scope.dataRangeValue == 'Concentration') {
                $scope.outputVariable = 'MfdSense';
            } else if ($scope.dataRangeValue == 'Specific Gravity') {
                $scope.outputVariable = 'SGSense';
            } else if ($scope.dataRangeValue == 'Nozzle DP') {
                $scope.outputVariable = 'DnuSense';
            } else if ($scope.dataRangeValue == 'Max Clean DP') {
                $scope.outputVariable = 'dpsMaxSense';
            }
            $scope.showOther($scope.diameterOrLenght);
            $("#lastRightBottom").css("height", "366px");
        } else {

            $scope.showNominal($scope.diameterOrLenght);
            $("#lastRightBottom").css("height", "438px");
        }
        check999Case();
        $scope.setSliderRange($scope.highchartData);
        $scope.resetSlider();
        if ($scope.comparison) {
            $scope.populateComparisonValues();
        }
        //console.log("outputVariable.." + $scope.outputVariable);
    }
    $scope.populateComparisonValues = function () {
        for (var i = 0; i < $scope.productsToCompare.length; i++) {

            $scope.productsToCompare[i]["compareValues"] = $scope.productsToCompare[i]["compareValues"] || {};
            $scope.productsToCompare[i]["compareValues"][$scope.outputVariable] = {};
            var obj = $scope.productsToCompare[i][$scope.outputVariable].OutVar[$scope.jsonKey];
            for (var key in obj) {
                $scope.productsToCompare[i]["compareValues"][$scope.outputVariable][key] = obj[key];
            }
        }
    }
    $scope.showDiameter = function () {
        $scope.diameterOrLenght = "diameter";
        if ($scope.dataRangeValue != 'Select Attribute') {
            $scope.showOther($scope.diameterOrLenght);
        } else {
            $scope.showNominal($scope.diameterOrLenght);
        }
    }
    $scope.showLength = function () {
        $scope.diameterOrLenght = "length";
        if ($scope.dataRangeValue != 'Select Attribute') {
            $scope.showOther($scope.diameterOrLenght);
        } else {
            $scope.showNominal($scope.diameterOrLenght);
        }
    }
    $scope.showNominal = function (value) {
        var newSeries = [];
        var length;
        if ($scope.currentProducts && $scope.currentProducts.length > $scope.numberOfProductsToShow) {
            length = $scope.numberOfProductsToShow;
        } else {
            length = $scope.currentProducts ? $scope.currentProducts.length : 0;
        }
        var lineObj = {
            type: 'columnrange',
            name: 'Temperatures',
            datalabels: {
                enabled: false
            },
            data: []
        }
        var pointsObj = {
            type: 'scatter',

            dataLabels: {
                enabled: true,
                x: 33,
                y: 12,
                style: {
                    color: '#FFFFFF',
                    textShadow: 'none',
                    fontSize: "9px"
                }
            },
            lineWidth: 0,
            states: {
                hover: {
                    enabled: false
                }
            },
            marker: {
                symbol: "url(./images/red.png)",
                radius: 5,
                lineWidth: 1,
                lineColor: Highcharts.getOptions().colors[3],
                fillColor: 'white'
            },
            data: []
        }
        var slsObj = {
            type: 'scatter',

            dataLabels: {
                allowOverlap: false,
                enabled: true,
                x: 0,
                y: -20,
                borderRadius: 5,
                backgroundColor: '#0db9f0',
                borderWidth: 1,
                borderColor: '#0db9f0',
                style: {
                    color: '#FFFFFF',
                    textShadow: 'none',
                    fontSize: "9px"
                },
                formatter: function () {
                    return "SLS Tested"
                }
            },
            lineWidth: 0,
            states: {
                hover: {
                    enabled: false
                }
            },
            marker: {
                symbol: "url(./images/circle-blue.png)"
            },
            data: []
        }
        var hiddenObj = {
            type: 'scatter',

            dataLabels: {
                allowOverlap: false,
                enabled: false,
                x: 0,
                y: -20,
                borderRadius: 5,
                backgroundColor: '#0db9f0',
                borderWidth: 1,
                borderColor: '#0db9f0',
                style: {
                    color: '#FFFFFF',
                    textShadow: 'none',
                    fontSize: "9px"
                },
                formatter: function () {
                    return "SLS Tested"
                }
            },
            lineWidth: 0,
            states: {
                hover: {
                    enabled: false
                }
            },
            marker: {
                symbol: "url(./images/transparent.png)"
            },
            data: []
        }

        for (var i = 0; i < length; i++) {
            var nominal = $scope.currentProducts[i].Nominal;
            if (nominal.oDh) {
                nominal.oDh = Number(Math.round((nominal.oDh).toFixed(4)));
            }
            if (nominal.Lhs) {
                nominal.Lhs = Number(Math.round((nominal.Lhs).toFixed(4)));
            }
            var lineValue = value == "diameter" ? (nominal.oDh) : (nominal.Lhs);
            if (lineValue != -999) {
                lineObj.data.push({
                    x: i,
                    low: value == "diameter" ? (nominal.oDh_Min) : (nominal.Lhs_Min),
                    high: value == "diameter" ? (nominal.oDh_Max) : (nominal.Lhs_Max),
                    color: "#636363"
                })
            } else {
                lineObj.data.push("");
            }
            if (lineValue != -999) {
                var imageUrl;
                if ($scope.lgCase) {
                    imageUrl = "url(./images/red-orange.png)"
                } else {
                    imageUrl = $scope.currentProducts[i].config == 2 ? "url(./images/red-orange.png)" : "url(./images/red-blue.png)"
                }
                pointsObj.data.push({
                    y: value == "diameter" ? (nominal.oDh) : (nominal.Lhs),
                    marker: {
                        symbol: imageUrl,
                        radius: 5,
                        lineWidth: 1,
                        lineColor: Highcharts.getOptions().colors[3],
                        fillColor: 'white'
                    }
                });
            } else {
                pointsObj.data.push("");
            }
            if (nominal.isSLS == "YES" && lineValue != -999) {
                var slsValue = value == "diameter" ? Number(nominal.oDh_Min).toFixed(4) : Number(nominal.Lhs_Min).toFixed(4)
                slsObj.data.push(Number(slsValue));
                //slsObj.data.push(Number(nominal.oDh_Max))
            } else {
                slsObj.data.push("")
            }
            hiddenObj.data.push("");
        }
        newSeries.push(lineObj);
        newSeries.push(pointsObj);
        newSeries.push(slsObj);
        newSeries.push(hiddenObj);
        //console.log("series at nominall..." + JSON.stringify(newSeries));
        $scope.highchartsNG.series = newSeries;
    }
    $scope.showOther = function (value) {
        var newSeries = [];
        var length;
        if ($scope.currentProducts && $scope.currentProducts.length > $scope.numberOfProductsToShow) {
            length = $scope.numberOfProductsToShow;
        } else {
            length = $scope.currentProducts ? $scope.currentProducts.length : 0;
        }
        var lineObj = {
            type: 'columnrange',
            name: 'Temperatures',
            datalabels: {
                enabled: false
            },
            data: []
        }
        var redLineObj = {
            name: 'Temperatures',
            datalabels: {
                enabled: false
            },
            type: 'columnrange',
            data: []
        }
        var pointsObj = {
            type: 'scatter',

            dataLabels: {
                enabled: true,
                x: 33,
                y: 12,
                style: {
                    color: '#FFFFFF',
                    textShadow: 'none',
                    fontSize: "9px"
                }
            },
            lineWidth: 0,
            states: {
                hover: {
                    enabled: false
                }
            },
            marker: {
                symbol: "url(./images/red.png)",
                radius: 5,
                lineWidth: 1,
                lineColor: Highcharts.getOptions().colors[3],
                fillColor: 'white'
            },
            data: []
        }
        var fixedPointsObj = {
            type: 'scatter',

            dataLabels: {
                enabled: true,
                x: -33,
                y: 12,
                style: {
                    color: '#FFFFFF',
                    textShadow: 'none',
                    fontSize: "9px"
                }
            },
            lineWidth: 0,
            states: {
                hover: {
                    enabled: false
                }
            },
            marker: {
                symbol: "url(./images/grey.png)",
                radius: 5

            },
            data: []
        }
        var slsObj = {
            type: 'scatter',

            dataLabels: {
                allowOverlap: false,
                enabled: true,
                x: 0,
                y: -20,
                borderRadius: 5,
                backgroundColor: '#0db9f0',
                borderWidth: 1,
                borderColor: '#0db9f0',
                style: {
                    color: '#FFFFFF',
                    textShadow: 'none',
                    fontSize: "9px"
                },
                formatter: function () {
                    return "SLS Tested"
                }
            },
            lineWidth: 0,
            states: {
                hover: {
                    enabled: false
                }
            },
            marker: {
                symbol: "url(./images/circle-blue.png)"
            },
            data: []
        }
        var hiddenObj = {
            type: 'scatter',

            dataLabels: {
                allowOverlap: false,
                enabled: false,
                x: 0,
                y: -20,
                borderRadius: 5,
                backgroundColor: '#0db9f0',
                borderWidth: 1,
                borderColor: '#0db9f0',
                style: {
                    color: '#FFFFFF',
                    textShadow: 'none',
                    fontSize: "9px"
                },
                formatter: function () {
                    return "SLS Tested"
                }
            },
            lineWidth: 0,
            states: {
                hover: {
                    enabled: false
                }
            },
            marker: {
                symbol: "url(./images/transparent.png)"
            },
            data: []
        }
        for (var i = 0; i < length; i++) {
            var nominal = $scope.currentProducts[i].Nominal;
            var qaSysSense = $scope.currentProducts[i][$scope.outputVariable] || {};
            var qaSysSenseOutVar = undefined;
            if ($scope.productjsonkeymap[$scope.currentProducts[i].prodid]) {
                var obj = $scope.productjsonkeymap[$scope.currentProducts[i].prodid];
                qaSysSenseOutVar = qaSysSense.OutVar[obj.jsonKey];
            }


            if (nominal.oDh) {
                nominal.oDh = Number(Math.round((nominal.oDh).toFixed(4)));
            }
            if (nominal.Lhs) {
                nominal.Lhs = Number(Math.round((nominal.Lhs).toFixed(4)));
            }
            if (qaSysSense.oDh) {
                qaSysSense.oDh = Number(Math.round((qaSysSense.oDh).toFixed(4)));
            }
            if (qaSysSense.Lhs) {
                qaSysSense.Lhs = Number(Math.round((qaSysSense.Lhs).toFixed(4)));
            }
            var lineValue = value == "diameter" ? nominal.oDh : (nominal.Lhs);
            var redLineValue = value == "diameter" ? (qaSysSense.oDh) : (qaSysSense.Lhs);
            if (lineValue != -999) {
                lineObj.data.push({
                    x: i,
                    low: value == "diameter" ? nominal.oDh_Min : (nominal.Lhs_Min),
                    high: value == "diameter" ? (nominal.oDh_Max) : (nominal.Lhs_Max),
                    color: "#636363"
                })
            } else {
                lineObj.data.push("");
            }
            if (lineValue != -999) {
                var imageUrl;
                if ($scope.lgCase) {
                    imageUrl = "url(./images/grey-orange.png)"
                } else {
                    imageUrl = $scope.currentProducts[i].config == 2 ? "url(./images/grey-orange.png)" : "url(./images/grey-blue.png)"
                }
                fixedPointsObj.data.push({
                    y: value == "diameter" ? Number((nominal.oDh).toFixed(4)) : (nominal.Lhs ? Number((nominal.Lhs).toFixed(4)) : 0),
                    marker: {
                        symbol: imageUrl,
                        radius: 5
                    }
                });
            } else {
                fixedPointsObj.data.push("");
            }
            if (redLineValue != -999) {
                redLineObj.data.push({
                    x: i,
                    low: value == "diameter" ? (qaSysSense.oDh_Min) : (qaSysSense.Lhs_Min),
                    high: value == "diameter" ? (qaSysSense.oDh_Max) : (qaSysSense.Lhs_Max),
                    color: "#95282C"
                });
            } else {
                redLineObj.data.push("");
            }
            if (value == "diameter") {
                var pointsValue = qaSysSenseOutVar ? Number((qaSysSenseOutVar.oDh).toFixed(4)) : Number((qaSysSense.oDh).toFixed(4));
                if (pointsValue != -999) {
                    var imageUrl;
                    if ($scope.lgCase) {
                        imageUrl = "url(./images/red-orange.png)"
                    } else {
                        imageUrl = $scope.currentProducts[i].config == 2 ? "url(./images/red-orange.png)" : "url(./images/red-blue.png)"
                    }
                    pointsObj.data.push({
                        y: qaSysSenseOutVar ? Number((qaSysSenseOutVar.oDh).toFixed(4)) : Number((qaSysSense.oDh).toFixed(4)),
                        marker: {
                            symbol: imageUrl,
                            radius: 5,
                            lineWidth: 1,
                            lineColor: Highcharts.getOptions().colors[3],
                            fillColor: 'white'
                        }
                    });
                } else {
                    pointsObj.data.push("");
                }
            } else {
                var pointsValue = qaSysSenseOutVar ? Number((qaSysSenseOutVar.Lhs).toFixed(4)) : (qaSysSense.Lhs ? Number((qaSysSense.Lhs).toFixed(4)) : 0);
                if (pointsValue != -999) {
                    var imageUrl;
                    if ($scope.lgCase) {
                        imageUrl = "url(./images/red-blue.png)"
                    } else {
                        imageUrl = $scope.currentProducts[i].config == 2 ? "url(./images/red-orange.png)" : "url(./images/red-blue.png)"
                    }
                    pointsObj.data.push({
                        y: qaSysSenseOutVar ? Number((qaSysSenseOutVar.Lhs).toFixed(4)) : (qaSysSense.Lhs ? Number((qaSysSense.Lhs).toFixed(4)) : 0),
                        marker: {
                            symbol: imageUrl,
                            radius: 5,
                            lineWidth: 1,
                            lineColor: Highcharts.getOptions().colors[3],
                            fillColor: 'white'
                        }
                    });
                } else {
                    pointsObj.data.push("");
                }
            }
            if (nominal.isSLS == "YES" && redLineValue != -999) {
                var slsValue = value == "diameter" ? Number(qaSysSense.oDh_Min).toFixed(4) : Number(qaSysSense.Lhs_Min).toFixed(4)
                slsObj.data.push(Number(slsValue));
            } else {
                slsObj.data.push("")
            }
            hiddenObj.data.push("");
        }
        newSeries.push(lineObj);
        newSeries.push(redLineObj);
        newSeries.push(pointsObj);
        newSeries.push(fixedPointsObj);
        newSeries.push(slsObj);
        newSeries.push(hiddenObj);
        $scope.highchartsNG.series = newSeries;
    }
    $scope.filterProducts = function (showVertical, showHorizontal) {

        usSpinnerService.spin('spinner-1');
        $(".spinner").removeClass("ng-hide");


        setTimeout(function () {
            var filteredProducts = [];
            var newSeries = [];
            var allProducts = [];
            if ($scope.comparison) {
                allProducts = $scope.productsToCompare;
            } else {
                allProducts = $scope.outputServiceResponse;
            }
            for (var i = 0; i < allProducts.length; i++) {
                if ($scope.lgCase) {
                    if (showVertical && $scope.faddedProductFamilies.indexOf(allProducts[i].ProductName) == -1) {
                        filteredProducts.push(allProducts[i]);
                    }
                } else
                if (((allProducts[i].config == 2 && showVertical && $scope.llCase) || (allProducts[i].config == 1 && showHorizontal && $scope.llCase)) && $scope.faddedProductFamilies.indexOf(allProducts[i].ProductName) == -1) {
                    filteredProducts.push(allProducts[i]);
                }
            }

            $scope.skip = 0;
            $scope.outputServiceResponseClone = filteredProducts;
            $scope.currentProducts = angular.copy($scope.outputServiceResponseClone).splice($scope.skip, $scope.numberOfProductsToShow);
            if ($scope.currentProducts.length < $scope.numberOfProductsToShow) {
                $scope.limit = $scope.currentProducts.length;
            } else {
                $scope.limit = $scope.numberOfProductsToShow;
            }

            if ($scope.limit >= filteredProducts.length) {
                $scope.hasNext = false;
            } else {
                $scope.hasNext = true;
            }
            $scope.updateChartData();
            var remainingProductFamilies = [];
            for (var i = 0; i < filteredProducts.length; i++) {
                if (remainingProductFamilies.indexOf(filteredProducts[i].ProductName) == -1) {
                    remainingProductFamilies.push(filteredProducts[i].ProductName);
                }
            }
            $("#productFamilies button").each(function () {
                if (remainingProductFamilies.indexOf($(this).html()) == -1) {
                    $(this).addClass("myFade");
                }
            });
            $("#productFamilies button").each(function () {
                if (remainingProductFamilies.indexOf($(this).html()) !== -1) {
                    $(this).removeClass("myFade");
                }
            });
            if (!$scope.$$phase) $scope.$apply()
            usSpinnerService.stop('spinner-1');
            $(".spinner").addClass("ng-hide");

        }, 2000);

    }
    $scope.toggleFilter = function () {
        var showVertical;
        var showHorizontal;
        if ($(".verticalBtn").hasClass("myFade")) {
            showVertical = false;
        } else {
            showVertical = true;
        }
        if ($(".horizontalBtn").hasClass("myFade")) {
            showHorizontal = false;
        } else {
            showHorizontal = true;
        }
        $scope.filterProducts(showVertical, showHorizontal);
    }
    $scope.toggleProductFilter = function () {
        var filteredProducts = [];
        var newSeries = [];
        var allProducts = [];
        if ($scope.comparison) {
            allProducts = $scope.productsToCompare;
        } else {
            allProducts = $scope.outputServiceResponse;
        }
        for (var i = 0; i < allProducts.length; i++) {
            if ($scope.faddedProductFamilies.indexOf(allProducts[i].ProductName) == -1) {
                filteredProducts.push(allProducts[i]);
            }
        }
        var hasHorizontalProducts = false;
        var hasVerticalProducts = false;
        if ($scope.llCase) {
            for (var i = 0; i < filteredProducts.length; i++) {
                if (filteredProducts[i].config == 1) {
                    hasHorizontalProducts = true;
                } else if (filteredProducts[i].config == 2) {
                    hasVerticalProducts = true;
                }
            }
            if (hasHorizontalProducts) {
                $(".horizontalBtn").removeClass("myFade");
            } else {
                $(".horizontalBtn").addClass("myFade");
            }
            if (hasVerticalProducts) {
                $(".verticalBtn").removeClass("myFade");
            } else {
                $(".verticalBtn").addClass("myFade");
            }

            if (hasHorizontalProducts && hasVerticalProducts) {
                $scope.hideDiameter = false;
                $scope.hideLength = false;
            } else if (!hasHorizontalProducts && hasVerticalProducts) {
                $scope.hideDiameter = true;
                $scope.hideLength = false;
            } else if (!hasHorizontalProducts && !hasVerticalProducts) {
                $scope.hideDiameter = true;
                $scope.hideLength = true;
            }
        }
        if ($scope.lgCase) {
            if ($scope.faddedProductFamilies.length == $scope.productFamily.length) {
                $(".verticalBtn").addClass("myFade");
                $scope.hideDiameter = true;
            } else {
                $(".verticalBtn").removeClass("myFade");
                $scope.hideDiameter = false;
            }

        }
        $scope.skip = 0;
        $scope.outputServiceResponseClone = filteredProducts;
        $scope.currentProducts = angular.copy($scope.outputServiceResponseClone).splice($scope.skip, $scope.numberOfProductsToShow);
        if ($scope.currentProducts.length < $scope.numberOfProductsToShow) {
            $scope.limit = $scope.currentProducts.length;
        } else {
            $scope.limit = $scope.numberOfProductsToShow;
        }

        if ($scope.limit >= filteredProducts.length) {
            $scope.hasNext = false;
        } else {
            $scope.hasNext = true;
        }
        $scope.updateChartData();
        if (!$scope.$$phase) $scope.$apply()
    }
    $scope.faddedProductFamilies = [];
    $scope.toggleProduct = function (ele, index, product) {
        $(ele.currentTarget).toggleClass("myFade");
        if ($(ele.currentTarget).hasClass("myFade")) {
            $scope.faddedProductFamilies.push(product);
        } else {
            $scope.faddedProductFamilies.splice($scope.faddedProductFamilies.indexOf(product), 1);
        }
        $scope.toggleProductFilter();
        //console.log("$scope.faddedProductFamilies.." + $scope.faddedProductFamilies);
    }
    $scope.verticalFilter = function () {
        $(".verticalBtn").toggleClass("myFade");
        if ($scope.lgCase) {
            if ($(".verticalBtn").hasClass("myFade")) {
                $scope.hideDiameter = true;
            } else {
                $scope.hideDiameter = false;
            }
        }
        if ($scope.llCase) {
            if ($(".verticalBtn").hasClass("myFade") && $(".horizontalBtn").hasClass("myFade")) {
                $scope.hideDiameter = true;
            } else {
                $scope.hideDiameter = false;
            }
        }
        $scope.toggleFilter();
    }

    $scope.horizontalFilter = function () {
        $(".horizontalBtn").toggleClass("myFade");
        if ($(".horizontalBtn").hasClass("myFade")) {
            $scope.hideLength = true;
        } else {
            $scope.hideLength = false;
        }
        if ($(".verticalBtn").hasClass("myFade") && $(".horizontalBtn").hasClass("myFade")) {
            $scope.hideDiameter = true;
        } else {
            $scope.hideDiameter = false;
        }
        $scope.toggleFilter();

    }
    $scope.refreshPage = function () {
        $(".modal-backdrop.in").css("opacity", "0");
        $(".modal-backdrop.fade.in").css("display", "none");
        $("#newModal").modal('hide');
        $state.go('home');
        //return;
    }
    $scope.backToInputScreen = function () {
        Data.backButtonClicked = true;
        $state.go('home');
        return;
    }
    $scope.closeException = function () {
        $("#exceptionModal").modal('hide');
        $(".modal-backdrop.in").css("opacity", "0");
        $(".modal-backdrop.fade.in").hide();
        $(".modal-backdrop.fade.in").remove();
        $("body").removeClass("modal-open");
        $("body").css("padding-right", "0px");
        $state.go('home');
        return;
    }


    $scope.downloadAsPdf = function () {

        if ($scope.dataRangeValue == 'Select Attribute') {
            var outputData = $scope.selectedProductInfo['Nominal']['Output'];
        } else {
            var jsonKey = "";
            if ($scope.productjsonkeymap[$scope.selectedProductInfo.prodid]) {
                jsonKey = $scope.productjsonkeymap[$scope.selectedProductInfo.prodid].jsonKey;
            } else {
                jsonKey = $scope.jsonKey;
            }

            var outputData = $scope.selectedProductInfo[$scope.outputVariable].OutVar[jsonKey];
        }

        var outputArray = [];
        var SZOrWRVLabel = "";
        var SZOrWRVValue = "";

        var flowrateORnocolcrOPLabel = "";
        var flowrateORnocolcrOPValue = "";


        if ($scope.solveFor == 'Number of Coalescer') {
            flowrateORnocolcrOPLabel = "No. of Coalescers Needed";
            outputArray['num_of_coalescers'] = (outputData['Nc'] == '-999') ? 'NaN' : String($filter('setDecimal')(outputData['Nc'], 2));
            flowrateORnocolcrOPValue = outputArray['num_of_coalescers'];
        } else if ($scope.solveFor == 'Maximum Flowrate') {
            flowrateORnocolcrOPLabel = "Flowrate";
            flowrateORnocolcrOPValue = (outputData['Qact'] == '-999') ? 'NaN' : String($filter('setDecimal')(outputData['Qact'], 2));
            if ($scope.llCase) {
                flowrateORnocolcrOPValue = (flowrateORnocolcrOPValue != 'NaN') ? flowrateORnocolcrOPValue + " GPM" : flowrateORnocolcrOPValue;
            } else if ($scope.lgCase) {
                flowrateORnocolcrOPValue = (flowrateORnocolcrOPValue != 'NaN') ? flowrateORnocolcrOPValue + " AM^3/hr" : flowrateORnocolcrOPValue;
            }
        }

        if ($scope.graphInput.flowRateUnit == 'SCFM' || $scope.graphInput.flowRateUnit == 'ACFM') {
            var velocityUnit = "ft/s";
        } else {
            var velocityUnit = "m/s";
        }

        if ($scope.llCase) { // for llcase
            outputArray['nominal_housing_od'] = (outputData['oDh'] == '-999') ? 'NaN' : String($filter('setDecimal')(outputData['oDh'], 2));
            outputArray['nominal_housing_od'] = (outputArray['nominal_housing_od'] != 'NaN') ? outputArray['nominal_housing_od'] + " " + $scope.outputUnits.length : outputArray['nominal_housing_od'];

            outputArray['actual_housing_id'] = (outputData['dh'] == '-999') ? 'NaN' : String($filter('setDecimal')(outputData['dh'], 2));
            outputArray['actual_housing_id'] = (outputArray['actual_housing_id'] != 'NaN') ? outputArray['actual_housing_id'] + " " + $scope.outputUnits.length : outputArray['actual_housing_id'];

            outputArray['min_possible_housing_id'] = (outputData['dht'] == '-999') ? 'NaN' : String($filter('setDecimal')(outputData['dht'], 2));
            outputArray['min_possible_housing_id'] = (outputArray['min_possible_housing_id'] != 'NaN') ? outputArray['min_possible_housing_id'] + " " + $scope.outputUnits.length : outputArray['min_possible_housing_id'];


            outputArray['nominal_nozzle_od'] = (outputData['oDn'] == '-999') ? 'NaN' : String($filter('setDecimal')(outputData['oDn'], 2));
            outputArray['nominal_nozzle_od'] = (outputArray['nominal_nozzle_od'] != 'NaN') ? outputArray['nominal_nozzle_od'] + " " + $scope.outputUnits.length : outputArray['nominal_nozzle_od'];

            outputArray['nozzle_id'] = (outputData['dn'] == '-999') ? 'NaN' : String($filter('setDecimal')(outputData['dn'], 2));
            outputArray['nozzle_id'] = (outputArray['nozzle_id'] != 'NaN') ? outputArray['nozzle_id'] + " " + $scope.outputUnits.length : outputArray['nozzle_id'];

            outputArray['nozzle_dp'] = (outputData['n'] == '-999') ? 'NaN' : String($filter('setDecimal')(outputData['n'], 2));
            outputArray['nozzle_dp'] = (outputArray['nozzle_dp'] != 'NaN') ? outputArray['nozzle_dp'] + " " + $scope.outputUnits.pressure : outputArray['nozzle_dp'];

            outputArray['tube_sheet'] = (outputData['ts'] == '-999') ? 'NaN' : String($filter('setDecimal')(outputData['ts'], 2));
            outputArray['tube_sheet'] = (outputArray['tube_sheet'] != 'NaN') ? outputArray['tube_sheet'] + " " + $scope.outputUnits.pressure : outputArray['tube_sheet'];

            outputArray['core_dp'] = (outputData['core'] == '-999') ? 'NaN' : String($filter('setDecimal')(outputData['core'], 2));
            outputArray['core_dp'] = (outputArray['core_dp'] != 'NaN') ? outputArray['core_dp'] + " " + $scope.outputUnits.pressure : outputArray['core_dp'];

            outputArray['media_dp'] = (outputData['dm'] == '-999') ? 'NaN' : String($filter('setDecimal')(outputData['dm'], 2));
            outputArray['media_dp'] = (outputArray['media_dp'] != 'NaN') ? outputArray['media_dp'] + " " + $scope.outputUnits.pressure : outputArray['media_dp'];

            outputArray['total_dp'] = (outputData['tot'] == '-999') ? 'NaN' : String($filter('setDecimal')(outputData['tot'], 2));
            outputArray['total_dp'] = (outputArray['total_dp'] != 'NaN') ? outputArray['total_dp'] + " " + $scope.outputUnits.pressure : outputArray['total_dp'];


            outputArray['std_nozzle_size'] = (outputData['oDn'] == '-999') ? 'NaN' : String(Number(outputData['oDn']).toFixed(2)); // hide this
            outputArray['std_nozzle_size'] = (outputArray['std_nozzle_size'] != 'NaN') ? outputArray['std_nozzle_size'] + " " + $scope.outputUnits.length : outputArray['std_nozzle_size'];

            outputArray['tot_diff_pressure'] = (outputData['tot'] == '-999') ? 'NaN' : String($filter('setDecimal')(outputData['tot'], 2));
            outputArray['tot_diff_pressure'] = (outputArray['tot_diff_pressure'] != 'NaN') ? outputArray['tot_diff_pressure'] + " " + $scope.outputUnits.pressure : outputArray['tot_diff_pressure'];
            outputArray['coalesced_flow'] = (outputData['QD'] == '-999') ? 'NaN' : String($filter('setDecimal')(outputData['QD'], 2));
            outputArray['coalesced_flow'] = (outputArray['coalesced_flow'] != 'NaN') ? outputArray['coalesced_flow'] + " " + $scope.outputUnits.coalesced_flow : outputArray['coalesced_flow'];

            if ($scope.selectedProductInfo.config == '1') {
                outputArray['setting_zone'] = (outputData['Lhs'] == '-999') ? 'NaN' : String($filter('setDecimal')(outputData['Lhs'], 2));
                outputArray['setting_zone'] = (outputArray['setting_zone'] != 'NaN') ? outputArray['setting_zone'] + " " + $scope.outputUnits.length : outputArray['setting_zone'];
                SZOrWRVLabel = "Setting Zone";
                SZOrWRVValue = outputArray['setting_zone'];
            }

            /*if ($scope.selectedProductInfo.config == '2') {
    outputArray['water_rise_velocity'] = (outputData['VD'] == '-999') ? 'NaN' : String($filter('setDecimal')(outputData['VD'], 2));
    outputArray['water_rise_velocity'] = (outputArray['water_rise_velocity'] != 'NaN') ? outputArray['water_rise_velocity'] + (outputArray['water_rise_velocity'] > 1 ? ' inches' : ' inch') : outputArray['water_rise_velocity'];
    SZOrWRVLabel = "Water Rise Velocity";
    SZOrWRVValue = outputArray['water_rise_velocity'];
}*/
        } else if ($scope.lgCase) { // for lgcase

            outputArray['actual_housing_id'] = (outputData['dh'] == '-999') ? 'NaN' : String($filter('setDecimal')(outputData['dh'], 2));
            outputArray['actual_housing_id'] = (outputArray['actual_housing_id'] != 'NaN') ? outputArray['actual_housing_id'] + " " + $scope.outputUnits.length : outputArray['actual_housing_id'];

            outputArray['nominal_housing_od'] = (outputData['oDh'] == '-999') ? 'NaN' : String($filter('setDecimal')(outputData['oDh'], 2));
            outputArray['nominal_housing_od'] = (outputArray['nominal_housing_od'] != 'NaN') ? outputArray['nominal_housing_od'] + " " + $scope.outputUnits.length : outputArray['nominal_housing_od'];

            outputArray['minimum_possible_housing_id'] = (outputData['dht'] == '-999') ? 'NaN' : String($filter('setDecimal')(outputData['dht'], 2));
            outputArray['minimum_possible_housing_id'] = (outputArray['minimum_possible_housing_id'] != 'NaN') ? outputArray['minimum_possible_housing_id'] + " " + $scope.outputUnits.length : outputArray['minimum_possible_housing_id'];

            outputArray['nominal_nozzle_od'] = (outputData['oDn'] == '-999') ? 'NaN' : String($filter('setDecimal')(outputData['oDn'], 2));
            outputArray['nominal_nozzle_od'] = (outputArray['nominal_nozzle_od'] != 'NaN') ? outputArray['nominal_nozzle_od'] + " " + $scope.outputUnits.length : outputArray['nominal_nozzle_od'];

            outputArray['nozzle_id'] = (outputData['dn'] == '-999') ? 'NaN' : String($filter('setDecimal')(outputData['dn'], 2));
            outputArray['nozzle_id'] = (outputArray['nozzle_id'] != 'NaN') ? outputArray['nozzle_id'] + " " + $scope.outputUnits.length : outputArray['nozzle_id'];

            outputArray['saturated_media'] = (outputData['sm'] == '-999') ? 'NaN' : String($filter('setDecimal')(outputData['sm'], 2));
            outputArray['saturated_media'] = (outputArray['saturated_media'] != 'NaN') ? outputArray['saturated_media'] + " " + $scope.outputUnits.pressure : outputArray['saturated_media'];

            outputArray['nozzle_dp'] = (outputData['n'] == '-999') ? 'NaN' : String($filter('setDecimal')(outputData['n'], 2));
            outputArray['nozzle_dp'] = (outputArray['nozzle_dp'] != 'NaN') ? outputArray['nozzle_dp'] + " " + $scope.outputUnits.pressure : outputArray['nozzle_dp'];

            outputArray['tube_sheet'] = (outputData['ts'] == '-999') ? 'NaN' : String($filter('setDecimal')(outputData['ts'], 2));
            outputArray['tube_sheet'] = (outputArray['tube_sheet'] != 'NaN') ? outputArray['tube_sheet'] + " " + $scope.outputUnits.pressure : outputArray['tube_sheet'];

            outputArray['dry_media'] = (outputData['dm'] == '-999') ? 'NaN' : String($filter('setDecimal')(outputData['dm'], 2));
            outputArray['dry_media'] = (outputArray['dry_media'] != 'NaN') ? outputArray['dry_media'] + " " + $scope.outputUnits.pressure : outputArray['dry_media'];

            outputArray['liquid_flux'] = (outputData['lam_act'] == '-999') ? 'NaN' : String($filter('setDecimal')(outputData['lam_act'], 2));
            outputArray['liquid_flux'] = (outputArray['liquid_flux'] != 'NaN') ? outputArray['liquid_flux'] + " " + "cc/(min ft2)" : outputArray['liquid_flux'];

            outputArray['core_velocity'] = (outputData['vx_act'] == '-999') ? 'NaN' : String($filter('setDecimal')(outputData['vx_act'], 2));
            outputArray['core_velocity'] = (outputArray['core_velocity'] != 'NaN') ? outputArray['core_velocity'] + " " + $scope.outputUnits.velocity : outputArray['core_velocity'];

            outputArray['max_inlet_conc'] = (outputData['MFDmax'] == '-999') ? 'NaN' : String($filter('setDecimal')(outputData['MFDmax'], 2));
            outputArray['max_inlet_conc'] = (outputArray['max_inlet_conc'] != 'NaN') ? outputArray['max_inlet_conc'] + " " + $scope.graphInput.disLiquidData.concentration.unit : outputArray['max_inlet_conc'];

            outputArray['tot_clean_dry'] = (outputData['tcd'] == '-999') ? 'NaN' : String($filter('setDecimal')(outputData['tcd'], 2));
            outputArray['tot_clean_dry'] = (outputArray['tot_clean_dry'] != 'NaN') ? outputArray['tot_clean_dry'] + " " + $scope.outputUnits.pressure : outputArray['tot_clean_dry'];
            outputArray['tot_clean_sat_dry'] = (outputData['tcs'] == '-999') ? 'NaN' : String($filter('setDecimal')(outputData['tcs'], 2));
            outputArray['tot_clean_sat_dry'] = (outputArray['tot_clean_sat_dry'] != 'NaN') ? outputArray['tot_clean_sat_dry'] + " " + $scope.outputUnits.pressure : outputArray['tot_clean_sat_dry'];

            outputArray['core'] = (outputData['core'] == '-999') ? 'NaN' : String($filter('setDecimal')(outputData['core'], 2));
            outputArray['core'] = (outputArray['core'] != 'NaN') ? outputArray['core'] + " " + $scope.outputUnits.pressure : outputArray['core'];

            outputArray['max_annular_velocity'] = (outputData['vz_peak'] == '-999') ? 'NaN' : String($filter('setDecimal')(outputData['vz_peak'], 2));
            outputArray['max_annular_velocity'] = (outputArray['max_annular_velocity'] != 'NaN') ? outputArray['max_annular_velocity'] + " " + $scope.outputUnits.velocity : outputArray['max_annular_velocity'];

            outputArray['act_annular_velocity'] = (outputData['vz_act'] == '-999') ? 'NaN' : String($filter('setDecimal')(outputData['vz_act'], 2));
            outputArray['act_annular_velocity'] = (outputArray['act_annular_velocity'] != 'NaN') ? outputArray['act_annular_velocity'] + " " + $scope.outputUnits.velocity : outputArray['act_annular_velocity'];

            outputArray['max_media_velocity'] = (outputData['vtarg'] == '-999') ? 'NaN' : String($filter('setDecimal')(outputData['vtarg'], 2));
            outputArray['max_media_velocity'] = (outputArray['max_media_velocity'] != 'NaN') ? outputArray['max_media_velocity'] + " " + $scope.outputUnits.media_velocity : outputArray['max_media_velocity'];

            outputArray['act_media_velocity'] = (outputData['vm_act'] == '-999') ? 'NaN' : String($filter('setDecimal')(outputData['vm_act'], 2));
            outputArray['act_media_velocity'] = (outputArray['act_media_velocity'] != 'NaN') ? outputArray['act_media_velocity'] + " " + $scope.outputUnits.media_velocity : outputArray['act_media_velocity'];
        }

        var inputArray = [];
        var inputData = $scope.selectedProductInfo['Nominal']['Input'];
        var jsonKey = "";
        if ($scope.productjsonkeymap[$scope.selectedProductInfo.prodid]) {
            var jsonKey = $scope.productjsonkeymap[$scope.selectedProductInfo.prodid].jsonKey;
        } else {
            jsonKey = $scope.jsonKey;
        }

        if ($scope.dataRangeValue == 'Flowrate') {
            var newInputVal = $scope.selectedProductInfo[$scope.outputVariable].OutVar[jsonKey].siInputVar;
            inputArray['oc_flowrate'] = String($filter('setDecimal')(newInputVal, 2));
            inputArray['oc_flowrate'] = (inputArray['oc_flowrate'] != 'NaN') ? inputArray['oc_flowrate'] + " " + $scope.graphInput.flowRateUnit : inputArray['oc_flowrate'];
        } else {
            inputArray['oc_flowrate'] = String($filter('setDecimal')(inputData['QAsys'], 2));
            inputArray['oc_flowrate'] = (inputArray['oc_flowrate'] != 'NaN') ? inputArray['oc_flowrate'] + " " + $scope.graphInput.flowRateUnit : inputArray['oc_flowrate'];
        }

        if ($scope.dataRangeValue == 'Number of Coalescer') {
            var newInputVal = $scope.selectedProductInfo[$scope.outputVariable].OutVar[jsonKey].siInputVar;
            inputArray['oc_no_of_coalescers'] = String($filter('setDecimal')(newInputVal, 2));
        } else {
            inputArray['oc_no_of_coalescers'] = String($filter('setDecimal')(inputData['Nc'], 2));
        }

        var flowrateORnocolcrLabel = "";
        var flowrateORnocolcrValue = "";

        if ($scope.solveFor == 'Number of Coalescer') {
            flowrateORnocolcrLabel = "Flowrate";
            flowrateORnocolcrValue = inputArray['oc_flowrate'];
        } else if ($scope.solveFor == 'Maximum Flowrate') {
            flowrateORnocolcrLabel = "No.of Coalescer";
            flowrateORnocolcrValue = inputArray['oc_no_of_coalescers'];
        }


        if ($scope.dataRangeValue == 'Max Pressure') {
            var newInputVal = $scope.selectedProductInfo[$scope.outputVariable].OutVar[jsonKey].siInputVar;
            inputArray['oc_max_pressure'] = String($filter('setDecimal')(newInputVal, 2));
            inputArray['oc_max_pressure'] = (inputArray['oc_max_pressure'] != 'NaN') ? inputArray['oc_max_pressure'] + " " + $scope.graphInput.maxPressureUnits : inputArray['oc_max_pressure'];
        } else {
            inputArray['oc_max_pressure'] = String($filter('setDecimal')(inputData['Pmaxg'], 2));
            inputArray['oc_max_pressure'] = (inputArray['oc_max_pressure'] != 'NaN') ? inputArray['oc_max_pressure'] + " " + $scope.graphInput.maxPressureUnits : inputArray['oc_max_pressure'];
        }

        if ($scope.dataRangeValue == 'Operating Pressure') {
            var newInputVal = $scope.selectedProductInfo[$scope.outputVariable].OutVar[jsonKey].siInputVar;
            inputArray['oc_op_pressure'] = String($filter('setDecimal')(newInputVal, 2));
            inputArray['oc_op_pressure'] = (inputArray['oc_op_pressure'] != 'NaN') ? inputArray['oc_op_pressure'] + " " + $scope.graphInput.maxPressureUnits : inputArray['oc_op_pressure'];
        } else {
            inputArray['oc_op_pressure'] = String($filter('setDecimal')(inputData['Popg'], 2));
            inputArray['oc_op_pressure'] = (inputArray['oc_op_pressure'] != 'NaN') ? inputArray['oc_op_pressure'] + " " + $scope.graphInput.maxPressureUnits : inputArray['oc_op_pressure'];
        }

        if ($scope.dataRangeValue == 'Operating Temperature') {
            var newInputVal = $scope.selectedProductInfo[$scope.outputVariable].OutVar[jsonKey].siInputVar;
            inputArray['oc_op_temperature'] = String($filter('setDecimal')(newInputVal, 2));
            inputArray['oc_op_temperature'] = (inputArray['oc_op_temperature'] != 'NaN') ? inputArray['oc_op_temperature'] + " " + $scope.graphInput.temprature : inputArray['oc_op_temperature'];
        } else {
            inputArray['oc_op_temperature'] = String($filter('setDecimal')(inputData['Top'], 2));
            inputArray['oc_op_temperature'] = (inputArray['oc_op_temperature'] != 'NaN') ? inputArray['oc_op_temperature'] + " " + $scope.graphInput.temprature : inputArray['oc_op_temperature'];
        }

        if ($scope.dataRangeValue == 'Continuous Density') {
            var newInputVal = $scope.selectedProductInfo[$scope.outputVariable].OutVar[jsonKey].siInputVar;
            inputArray['cp_density'] = String($filter('setDecimal')(newInputVal, 2));
            inputArray['cp_density'] = (inputArray['cp_density'] != 'NaN') ? inputArray['cp_density'] + " " + $scope.graphInput.liquidData.density.unit : inputArray['cp_density'];
        } else {
            inputArray['cp_density'] = String($filter('setDecimal')(inputData['rhoC'], 2));
            inputArray['cp_density'] = (inputArray['cp_density'] != 'NaN') ? inputArray['cp_density'] + " " + $scope.graphInput.liquidData.density.unit : inputArray['cp_density'];
        }

        if ($scope.dataRangeValue == 'Viscosity') {
            var newInputVal = $scope.selectedProductInfo[$scope.outputVariable].OutVar[jsonKey].siInputVar;
            inputArray['cp_viscosity'] = String($filter('setDecimal')(newInputVal, 2));
            inputArray['cp_viscosity'] = (inputArray['cp_viscosity'] != 'NaN') ? inputArray['cp_viscosity'] + " " + "CP" : inputArray['cp_viscosity'];
        } else {
            inputArray['cp_viscosity'] = String($filter('setDecimal')(inputData['muC'], 2));
            inputArray['cp_viscosity'] = (inputArray['cp_viscosity'] != 'NaN') ? inputArray['cp_viscosity'] + " " + "CP" : inputArray['cp_viscosity'];
        }

        if ($scope.dataRangeValue == 'Discontinuous Density') {
            var newInputVal = $scope.selectedProductInfo[$scope.outputVariable].OutVar[jsonKey].siInputVar;
            inputArray['dp_density'] = String($filter('setDecimal')(newInputVal, 2));
            inputArray['dp_density'] = (inputArray['dp_density'] != 'NaN') ? inputArray['dp_density'] + " " + $scope.graphInput.liquidData.density.unit : inputArray['dp_density'];
        } else {
            inputArray['dp_density'] = String($filter('setDecimal')(inputData['rhoD'], 2));
            inputArray['dp_density'] = (inputArray['dp_density'] != 'NaN') ? inputArray['dp_density'] + " " + $scope.graphInput.liquidData.density.unit : inputArray['dp_density'];
        }

        if ($scope.dataRangeValue == 'IFT') {
            var newInputVal = $scope.selectedProductInfo[$scope.outputVariable].OutVar[jsonKey].siInputVar;
            inputArray['dp_tension'] = String($filter('setDecimal')(newInputVal, 2));
            inputArray['dp_tension'] = (inputArray['dp_tension'] != 'NaN') ? inputArray['dp_tension'] + " " + "dyn/cm" : inputArray['dp_tension'];
        } else {
            inputArray['dp_tension'] = String($filter('setDecimal')(inputData['IFT'], 2));
            inputArray['dp_tension'] = (inputArray['dp_tension'] != 'NaN') ? inputArray['dp_tension'] + " " + "dyn/cm" : inputArray['dp_tension'];
        }


        if ($scope.dataRangeValue == 'Max Clean DP') {
            var newInputVal = $scope.selectedProductInfo[$scope.outputVariable].OutVar[jsonKey].siInputVar;
            inputArray['max_clean_dry_dp'] = String($filter('setDecimal')(newInputVal, 2));
            inputArray['max_clean_dry_dp'] = (inputArray['max_clean_dry_dp'] != 'NaN') ? inputArray['max_clean_dry_dp'] + " " + $scope.graphInput.maxPressureUnits : inputArray['max_clean_dry_dp'];
        } else {
            inputArray['max_clean_dry_dp'] = String($filter('setDecimal')(inputData['dptmax'], 2));
            inputArray['max_clean_dry_dp'] = (inputArray['max_clean_dry_dp'] != 'NaN') ? inputArray['max_clean_dry_dp'] + " " + $scope.graphInput.maxCleanDPUnit : inputArray['max_clean_dry_dp'];
        }
        if ($scope.dataRangeValue == 'Nozzle DP') {
            var newInputVal = $scope.selectedProductInfo[$scope.outputVariable].OutVar[jsonKey].siInputVar;
            inputArray['nozzle_size'] = String($filter('setDecimal')(newInputVal, 2));
            inputArray['nozzle_size'] = (inputArray['nozzle_size'] != 'NaN') ? inputArray['nozzle_size'] + " " + $scope.graphInput.nozzleSizeUnit : inputArray['nozzle_size'];
        } else {
            inputArray['nozzle_size'] = String($filter('setDecimal')(inputData['dnu'], 2));
            inputArray['nozzle_size'] = (inputArray['nozzle_size'] != 'NaN') ? inputArray['nozzle_size'] + " " + $scope.graphInput.nozzleSizeUnit : inputArray['nozzle_size'];
        }

        inputArray['max_clean_sat_dp'] = String($filter('setDecimal')(inputData['dpsmax'], 2));
        inputArray['max_clean_sat_dp'] = (inputArray['max_clean_sat_dp'] != 'NaN') ? inputArray['max_clean_sat_dp'] + " " + $scope.graphInput.maxCleanDPUnit : inputArray['max_clean_sat_dp'];


        inputArray['cp_name'] = Data.data.liquidData.name;
        inputArray['dp_name'] = Data.data.disLiquidData.name;


        inputArray['dp_concentration'] = String($filter('setDecimal')(inputData['MFD'], 2));
        inputArray['dp_concentration'] = (inputArray['dp_concentration'] != 'NaN') ? inputArray['dp_concentration'] + " " + $scope.graphInput.disLiquidData.concentration.unit : inputArray['dp_concentration'];

        var Preseparation = "";
        var ScaleUpHeading = "";
        var SLSProduct = "";
        var SLSTestedFlowrate = "";
        inputArray['slsproduct'] = '';
        inputArray['slstestflowrate'] = '';
        if ($scope.llCase) {
            if (Data.data.slsCheck) {
                ScaleUpHeading = "Scale Up from SLS Test Data";
                SLSProduct = "Product";
                SLSTestedFlowrate = "Tested Flowrate";
                inputArray['slsproduct'] = Data.data.slsProduct;
                inputArray['slstestflowrate'] = Data.data.testedFlowrate + ' ' + Data.data.slsTestUnit;
            }
            inputArray['max_clean_dry_dp'] = " ";
            inputArray['max_clean_sat_dp'] = " ";
            inputArray['sg'] = '';
            inputArray['projected'] = '';
            var maxCleanDryDP = "";
            var maxCleanSaturatedDP = "";
            var sgravity = '';
            var row1 = [
                {
                    text: flowrateORnocolcrOPLabel,
                    style: 'fillCellBGLightGreen'
                            }, {
                    text: flowrateORnocolcrOPValue,
                    style: 'fillCellBGLightGreen'
                            }, {
                    text: 'Nozzle DP',
                    style: 'fillCellBGLightBlue'
                            }, {
                    text: outputArray['nozzle_dp'],
                    style: 'fillCellBGLightBlue'
                            }
                        ];
            var row2 = [
                {
                    text: 'Nominal Housing OD',
                    style: 'fillCellBGLightGreen'
                            }, {
                    text: outputArray['nominal_housing_od'],
                    style: 'fillCellBGLightGreen'
                            }, {
                    text: 'Tube sheet DP',
                    style: 'fillCellBGLightBlue'
                            }, {
                    text: outputArray['tube_sheet'],
                    style: 'fillCellBGLightBlue'
                            }
                        ];
            var row3 = [{
                    text: 'Actual Housing ID',
                    style: 'fillCellBGLightGreen'
                            }, {
                    text: outputArray['actual_housing_id'],
                    style: 'fillCellBGLightGreen'
                            }, {
                    text: 'Core DP',
                    style: 'fillCellBGLightBlue'
                            }, {
                    text: outputArray['core_dp'],
                    style: 'fillCellBGLightBlue'
                            }
                        ];

            var row4 = [
                {
                    text: 'Minimum Possible Housing ID',
                    style: 'fillCellBGLightGreen'
                            }, {
                    text: outputArray['min_possible_housing_id'],
                    style: 'fillCellBGLightGreen'
                            }, {
                    text: 'Media DP',
                    style: 'fillCellBGLightBlue'
                            }, {
                    text: outputArray['media_dp'],
                    style: 'fillCellBGLightBlue'
                            }
                        ];
            var row5 = [
                {
                    text: 'Nominal Nozzle Diameter',
                    style: 'fillCellBGLightGreen'
                            }, {
                    text: outputArray['nominal_nozzle_od'],
                    style: 'fillCellBGLightGreen'
                            }, {
                    text: 'Total DP',
                    style: 'fillCellBGLightBlue'
                            }, {
                    text: outputArray['total_dp'],
                    style: 'fillCellBGLightBlue'
                            }
                        ];
            var row6 = [
                {
                    text: 'Nozzle ID',
                    style: 'fillCellBGLightGreen'
                            }, {
                    text: outputArray['nozzle_id'],
                    style: 'fillCellBGLightGreen'
                            }, {
                    text: SZOrWRVLabel,
                    style: 'fillCellBGLightBlue'
                            }, {
                    text: SZOrWRVValue,
                    style: 'fillCellBGLightBlue'
                            }
                        ];
            var row7 = [{
                    text: ' ',
                    style: 'fillCellBGLightGreen'
                            }, {
                    text: ' ',
                    style: 'fillCellBGLightGreen'
                            },
                {
                    text: 'Coalesced Flow',
                    style: 'fillCellBGLightBlue'
                            }, {
                    text: outputArray['coalesced_flow'],
                    style: 'fillCellBGLightBlue'
                            }
                        ];
            var row8 = [
                {
                    text: ' ',
                    style: 'fillCellBGLightGreen'
                            }, {
                    text: ' ',
                    style: 'fillCellBGLightGreen'
                            }, {
                    text: ' ',
                    style: 'fillCellBGLightBlue'
                            }, {
                    text: ' ',
                    style: 'fillCellBGLightBlue'
                            }
                        ];
            var row9 = [
                {
                    text: ' ',
                    style: 'fillCellBGLightGreen'
                            }, {
                    text: ' ',
                    style: 'fillCellBGLightGreen'
                            }, {
                    text: ' ',
                    style: 'fillCellBGLightBlue'
                            }, {
                    text: ' ',
                    style: 'fillCellBGLightBlue'
                            }
                        ];
            var row10 = [
                {
                    text: ' ',
                    style: 'fillCellBGLightGreen'
                            }, {
                    text: ' ',
                    style: 'fillCellBGLightGreen'
                            }, {
                    text: ' ',
                    style: 'fillCellBGLightBlue'
                            }, {
                    text: ' ',
                    style: 'fillCellBGLightBlue'
                            }
                        ];

        } else if ($scope.lgCase) { // for llcase
            var maxCleanDryDP = "Maximum Clean Dry DP";
            var maxCleanSaturatedDP = "Maximum Clean Saturated DP";
            var sgravity = "Specific Gravity"
            if ($scope.graphInput.presapration) {
                Preseparation = "Preseparation";
                inputArray['projected'] = String($filter('setDecimal')($scope.graphInput.projected, 2))
            } else {
                inputArray['projected'] = "";
            }

            inputArray['sg'] = String($filter('setDecimal')($scope.graphInput.liquidData.gravity, 2));
            var row1 = [
                {
                    text: flowrateORnocolcrOPLabel,
                    style: 'fillCellBGLightGreen'
                            }, {
                    text: flowrateORnocolcrOPValue,
                    style: 'fillCellBGLightGreen'
                            }, {
                    text: 'Core DP',
                    style: 'fillCellBGLightBlue'
                            }, {
                    text: outputArray['core'],
                    style: 'fillCellBGLightBlue'
                            }
                        ];
            var row2 = [
                {
                    text: 'Nominal Housing OD',
                    style: 'fillCellBGLightGreen'
                            }, {
                    text: outputArray['nominal_housing_od'],
                    style: 'fillCellBGLightGreen'
                            }, {
                    text: 'Media Dry DP',
                    style: 'fillCellBGLightBlue'
                            }, {
                    text: outputArray['dry_media'],
                    style: 'fillCellBGLightBlue'
                            }
                        ];
            var row3 = [{
                    text: 'Actual Housing ID',
                    style: 'fillCellBGLightGreen'
                            }, {
                    text: outputArray['actual_housing_id'],
                    style: 'fillCellBGLightGreen'
                            },
                {
                    text: 'Media Sat. DP',
                    style: 'fillCellBGLightBlue'
                            }, {
                    text: outputArray['saturated_media'],
                    style: 'fillCellBGLightBlue'
                            }
                        ];
            var row4 = [{
                    text: 'Minimum Possible Housing ID',
                    style: 'fillCellBGLightGreen'
                            }, {
                    text: outputArray['minimum_possible_housing_id'],
                    style: 'fillCellBGLightGreen'
                            }, {
                    text: 'Total Clean Dry DP',
                    style: 'fillCellBGLightBlue'
                            }, {
                    text: outputArray['tot_clean_dry'],
                    style: 'fillCellBGLightBlue'
                            }
                        ];
            var row5 = [
                {
                    text: 'Nominal Nozzle Diameter',
                    style: 'fillCellBGLightGreen'
                            }, {
                    text: outputArray['nominal_nozzle_od'],
                    style: 'fillCellBGLightGreen'
                            }, {
                    text: 'Total Clean Sat. DP',
                    style: 'fillCellBGLightBlue'
                            }, {
                    text: outputArray['tot_clean_sat_dry'],
                    style: 'fillCellBGLightBlue'
                            }
                        ]
            var row6 = [
                {
                    text: 'Nozzle ID',
                    style: 'fillCellBGLightGreen'
                            }, {
                    text: outputArray['nozzle_id'],
                    style: 'fillCellBGLightGreen'
                            }, {
                    text: 'Core Velocity',
                    style: 'fillCellBGLightBlue'
                            }, {
                    text: outputArray['core_velocity'],
                    style: 'fillCellBGLightBlue'
                            }
            ]
            var row7 = [
                {
                    text: 'Nozzle DP',
                    style: 'fillCellBGLightGreen'
                            }, {
                    text: outputArray['nozzle_dp'],
                    style: 'fillCellBGLightGreen'
                            }, {
                    text: 'Maximum Annular Velocity',
                    style: 'fillCellBGLightBlue'
                            }, {
                    text: outputArray['max_annular_velocity'],
                    style: 'fillCellBGLightBlue'
                            }
                        ];
            var row8 = [
                {
                    text: 'Tube sheet DP',
                    style: 'fillCellBGLightGreen'
                            }, {
                    text: outputArray['tube_sheet'],
                    style: 'fillCellBGLightGreen'
                            }, {
                    text: 'Actual Annular Velocity',
                    style: 'fillCellBGLightBlue'
                            }, {
                    text: outputArray['act_annular_velocity'],
                    style: 'fillCellBGLightBlue'
                            }
                        ];

            var row9 = [
                {
                    text: 'Actual Liquid Flux',
                    style: 'fillCellBGLightGreen'
                            }, {
                    text: outputArray['liquid_flux'],
                    style: 'fillCellBGLightGreen'
                            }, {
                    text: 'Maximum Media Velocity',
                    style: 'fillCellBGLightBlue'
                            }, {
                    text: outputArray['max_media_velocity'],
                    style: 'fillCellBGLightBlue'
                            }
                        ];

            var row10 = [
                {
                    text: 'Max Inlet Aerosol Mass Concentration',
                    style: 'fillCellBGLightGreen'
                            }, {
                    text: outputArray['max_inlet_conc'],
                    style: 'fillCellBGLightGreen'
                            }, {
                    text: 'Actual Media Velocity',
                    style: 'fillCellBGLightBlue'
                            }, {
                    text: outputArray['act_media_velocity'],
                    style: 'fillCellBGLightBlue'
                            }
                        ];
        }

        var configuration = "";
        if ($scope.llCase) {
            var config = $scope.selectedProductInfo.config;
            if (config == 2) {
                configuration = "Configuration Type : Vertical";
            } else {
                configuration = "Configuration Type : Horizontal";
            }
            /*if ($(".horizontalBtn").hasClass("myFade") && !$(".verticalBtn").hasClass("myFade")) {
    configuration = "Configuration Type : Vertical";
} else if (!$(".horizontalBtn").hasClass("myFade") && $(".verticalBtn").hasClass("myFade")) {
    configuration = "Configuration Type : Horizontal";
}*/
        }

        var dd = {
            content: [
                {
                    image: logoImg,
                    width: 200
                            }, '\n',
                {
                    text: 'Customer Name : ' + $scope.customerName,
                    fontSize: 14,
                    bold: true,
                    margin: [0, 0, 0, 8]
                                },
                {
                    text: 'Customer Address : ' + $scope.customerAddress,
                    fontSize: 14,
                    bold: true,
                    margin: [0, 0, 0, 8]
                                }, {
                    text: (Data.data.slsCheck ? 'Product Name : ' + $scope.selectedProductInfo.ProductName + ' SLS Tested' : 'Product Name : ' + $scope.selectedProductInfo.ProductName),
                    fontSize: 14,
                    bold: true,
                    margin: [0, 0, 0, 8]
                                },
                {
                    text: 'CPN : ' + $scope.selectedProductInfo.CPN,
                    fontSize: 14,
                    bold: true,
                    margin: [0, 0, 0, 8]
                                },
                {
                    text: configuration,
                    fontSize: 14,
                    bold: true,
                    margin: [0, 0, 0, 8]
                                },


                {
                    table: {
                        headerRows: 2,
                        widths: ['*', 100, '*', 100],
                        body: [
                                        [{
                                text: '',
                                style: 'tableHeaderNoBorder'
                                            }, {
                                text: '',
                                style: 'tableHeaderNoBorder'
                                            }, {
                                text: '',
                                style: 'tableHeaderNoBorder'
                                            }, {
                                text: '',
                                style: 'tableHeaderNoBorder'
                                        }],
                                        [{
                                text: 'Information Label',
                                colSpan: 4,
                                alignment: 'left',
                                bold: true,
                                style: 'fillTableHeaderBG'
                                        }], row1, row2, row3, row4, row5, row6, row7, row8, row9, row10,
                                            [{
                                text: ' ',
                                colSpan: 4,
                                style: ''
                                            }],
                                        [{
                                text: 'Input Values For Solution',
                                colSpan: 4,
                                alignment: 'left',
                                bold: true,
                                style: 'fillTableHeaderBG'
                                            }],
                                        [
                                {
                                    colSpan: 4,
                                    margin: [-5, -3, -5, -3],
                                    table: {
                                        widths: ['*', '*', '*', '*', '*', '*'],
                                        headerRows: 1,
                                        body: [
                                                            [
                                                {
                                                    text: 'System Conditions',
                                                    style: 'fillCellBGLightGreen',
                                                    colSpan: 2,
                                                    alignment: 'center'
                                                                },
                                                {
                                                    text: '',
                                                    style: 'fillCellBG'
                                                                },
                                                {
                                                    text: 'Continuous Phase',
                                                    style: 'fillCellBGLightBlue',
                                                    colSpan: 2,
                                                    alignment: 'center'
                                                                },
                                                {
                                                    text: '',
                                                    style: 'fillCellBG'
                                                                },
                                                {
                                                    text: 'Discontinuous Phase',
                                                    style: 'fillCellBG',
                                                    colSpan: 2,
                                                    alignment: 'center'
                                                                },
                                                {
                                                    text: '',
                                                    style: 'fillCellBG'
                                                                }
                                                            ],
                                                            [
                                                {
                                                    text: flowrateORnocolcrLabel,
                                                    style: 'fillCellBGLightGreen'
                                                                },
                                                {
                                                    text: flowrateORnocolcrValue,
                                                    style: 'fillCellBGLightGreen'
                                                                },
                                                {
                                                    text: 'Name',
                                                    style: 'fillCellBGLightBlue'
                                                                },
                                                {
                                                    text: inputArray['cp_name'],
                                                    style: 'fillCellBGLightBlue'
                                                                },
                                                {
                                                    text: 'Name',
                                                    style: 'fillCellBG',
                                                                },
                                                {
                                                    text: inputArray['dp_name'],
                                                    style: 'fillCellBG',
                                                                }
                                                            ],
                                                            [
                                                {
                                                    text: 'Maximum Pressure',
                                                    style: 'fillCellBGLightGreen'
                                                                },
                                                {
                                                    text: inputArray['oc_max_pressure'],
                                                    style: 'fillCellBGLightGreen'
                                                                },
                                                {
                                                    text: 'Density',
                                                    style: 'fillCellBGLightBlue'
                                                                },
                                                {
                                                    text: inputArray['cp_density'],
                                                    style: 'fillCellBGLightBlue'
                                                                },
                                                {
                                                    text: 'Density',
                                                    style: 'fillCellBG',
                                                                },
                                                {
                                                    text: inputArray['dp_density'],
                                                    style: 'fillCellBG',
                                                                }
                                                            ],
                                                            [
                                                {
                                                    text: 'Operating Pressure',
                                                    style: 'fillCellBGLightGreen'
                                                                },
                                                {
                                                    text: inputArray['oc_op_pressure'],
                                                    style: 'fillCellBGLightGreen'
                                                                },
                                                {
                                                    text: 'Viscosity',
                                                    style: 'fillCellBGLightBlue'
                                                                },
                                                {
                                                    text: inputArray['cp_viscosity'],
                                                    style: 'fillCellBGLightBlue'
                                                                },
                                                {
                                                    text: 'IFT(Interfacial Tension)',
                                                    style: 'fillCellBG',
                                                                },
                                                {
                                                    text: inputArray['dp_tension'],
                                                    style: 'fillCellBG',
                                                                }
                                                            ],
                                                            [
                                                {
                                                    text: 'Operating Temperature',
                                                    style: 'fillCellBGLightGreen'
                                                                },
                                                {
                                                    text: inputArray['oc_op_temperature'],
                                                    style: 'fillCellBGLightGreen'
                                                                },
                                                {
                                                    text: sgravity,
                                                    style: 'fillCellBGLightBlue'
                                                                },
                                                {
                                                    text: inputArray['sg'],
                                                    style: 'fillCellBGLightBlue'
                                                                },
                                                {
                                                    text: 'Concentration',
                                                    style: 'fillCellBG',
                                                                },
                                                {
                                                    text: inputArray['dp_concentration'],
                                                    style: 'fillCellBG',
                                                                }
                                                            ],
                                                            [
                                                {
                                                    text: "Nominal Nozzle Diameter",
                                                    style: 'fillCellBGLightGreen'
                                                                },
                                                {
                                                    text: inputArray['nozzle_size'],
                                                    style: 'fillCellBGLightGreen'
                                                                },
                                                {
                                                    text: '',
                                                    style: 'fillCellBGLightBlue'
                                                                },
                                                {
                                                    text: '',
                                                    style: 'fillCellBGLightBlue'
                                                                },
                                                {
                                                    text: Preseparation,
                                                    style: 'fillCellBG'
                                                                },
                                                {
                                                    text: inputArray['projected'],
                                                    style: 'fillCellBG'
                                                                }
                                                            ],
                                                            [
                                                {
                                                    text: maxCleanDryDP,
                                                    style: 'fillCellBGLightGreen'
                                                                },
                                                {
                                                    text: inputArray['max_clean_dry_dp'],
                                                    style: 'fillCellBGLightGreen'
                                                                },
                                                {
                                                    text: '',
                                                    style: 'fillCellBGLightBlue'
                                                                },
                                                {
                                                    text: '',
                                                    style: 'fillCellBGLightBlue'
                                                                },
                                                {
                                                    text: ScaleUpHeading,
                                                    style: 'fillCellBG',
                                                    colSpan: 2,
                                                    alignment: 'center'
                                                                },
                                                {
                                                    text: '',
                                                    style: 'fillCellBG',
                                                                }
                                                            ],
                                                            [
                                                {
                                                    text: maxCleanSaturatedDP,
                                                    style: 'fillCellBGLightGreen'
                                                                },
                                                {
                                                    text: inputArray['max_clean_sat_dp'],
                                                    style: 'fillCellBGLightGreen'
                                                                },
                                                {
                                                    text: '',
                                                    style: 'fillCellBGLightBlue'
                                                                },
                                                {
                                                    text: '',
                                                    style: 'fillCellBGLightBlue'
                                                                },
                                                {
                                                    text: SLSProduct,
                                                    style: 'fillCellBG',
                                                                },
                                                {
                                                    text: inputArray['slsproduct'],
                                                    style: 'fillCellBG',
                                                                }
                                                            ],
                                            [
                                                {
                                                    text: '',
                                                    style: 'fillCellBGLightGreen'
                                                                },
                                                {
                                                    text: '',
                                                    style: 'fillCellBGLightGreen'
                                                                },
                                                {
                                                    text: '',
                                                    style: 'fillCellBGLightBlue'
                                                                },
                                                {
                                                    text: '',
                                                    style: 'fillCellBGLightBlue'
                                                                },
                                                {
                                                    text: SLSTestedFlowrate,
                                                    style: 'fillCellBG',
                                                                },
                                                {
                                                    text: inputArray['slstestflowrate'],
                                                    style: 'fillCellBG',
                                                                }
                                                            ]
                                                        ]
                                    },
                                    layout: {
                                        hLineWidth: function (i, node) {
                                            return (i === 0 || i === node.table.body.length) ? 0 : 1;
                                        },
                                        vLineWidth: function (i, node) {
                                            return (i === 0 || i === node.table.widths.length) ? 0 : 0;
                                        },
                                        hLineColor: function (i, node) {
                                            return (i === 0 || i === node.table.body.length) ? 'black' : 'gray';
                                        },
                                        vLineColor: function (i, node) {
                                            return (i === 0 || i === node.table.widths.length) ? 'black' : 'gray';
                                        }
                                    }
                                          }
                                        ]
                                      ]
                    },
                    layout: {
                        hLineWidth: function (i, node) {
                            return (i === 0 || i === node.table.body.length) ? 0 : 1;
                        },
                        vLineWidth: function (i, node) {
                            return (i === 0 || i === node.table.widths.length) ? 0 : 0;
                        },
                        hLineColor: function (i, node) {
                            return (i === 0 || i === node.table.body.length) ? 'black' : 'gray';
                        },
                        vLineColor: function (i, node) {
                            return (i === 0 || i === node.table.widths.length) ? 'black' : 'gray';
                        }
                    }
                                }

	],
            styles: {
                tableHeaderNoBorder: {
                    border: [false, false, false, false]
                },
                fillCellBG: {
                    fillColor: 'yellow'
                },
                fillCellBGLightGreen: {
                    fillColor: '#aaffaa'
                },
                fillCellBGLightBlue: {
                    fillColor: '#aaaaff'
                },
                fillTableHeaderBG: {
                    fillColor: 'gray'
                }
            },
            footer: {
                columns: [
                    {
                        text: moment().format('MMMM Do YYYY, h:mm:ss a'),
                        alignment: 'right',
                        margin: [20, 5, 5, 5]
                    }
                ]
            }
        }

        var ua = window.navigator.userAgent;
        var msie = ua.indexOf("MSIE ");

        //console.log("msie > " + msie);

        // download the PDF
        if (msie > 0 || window.navigator.appName == "Netscape") {
            var filename = $scope.selectedProductInfo.ProductName + '_' + $scope.selectedProductInfo.CPN + '.pdf';
            pdfMake.createPdf(dd).download(filename);
        } else {
            pdfMake.createPdf(dd).open();
        }
        $("#customerInformation").modal("hide");
    }
    $scope.downloadCompareAsPdf = function () {
        var productsArr = $scope.productsToCompare;
        var productArrLen = $scope.productsToCompare.length;

        var headerColsArr = [];
        for (var i = 0; i < productArrLen; i++) {
            var headerCol = {};
            if(Data.data.slsCheck){
                headerCol.text = "Product Name :  \n" + productsArr[i].ProductName + " SLS Tested";
            }else
            {
                headerCol.text = "Product Name :  \n" + productsArr[i].ProductName;
            }
            headerCol.fontSize = 14;
            headerCol.bold = true;
            headerCol.margin = [0, 0, 0, 8];
            if (productArrLen >= 3) {
                headerCol.width = '100%';
            }

            var subHeaderCol = {};
            subHeaderCol.text = "CPN : " + productsArr[i].CPN;
            subHeaderCol.fontSize = 14;
            subHeaderCol.bold = true;
            subHeaderCol.margin = [0, 0, 0, 8];

            var config = productsArr[i].config == 1 ? "Horizontal" : "Vertical";
            var subHeaderConfigCol = {};
            subHeaderConfigCol.text = "Configuration : " + config;
            subHeaderConfigCol.fontSize = 14;
            subHeaderConfigCol.bold = true;
            subHeaderConfigCol.margin = [0, 0, 0, 8];


            var dataArr = {};
            dataArr.table = {};
            dataArr.table.headerRows = 1;
            dataArr.table.widths = ['*', 50];

            if ($scope.llCase) {
                var inputValStartRow = 12;
            } else if ($scope.lgCase) {
                var inputValStartRow = 19;
            }

            dataArr.layout = {
                hLineWidth: function (i, node) {
                    return (i === 0 || i === 1 || i === inputValStartRow || i === node.table.body.length) ? 0 : 1;
                },
                vLineWidth: function (i, node) {
                    return (i === 0 || i === node.table.widths.length) ? 0 : 0;
                },
                hLineColor: function (i, node) {
                    return (i === 0 || i === node.table.body.length) ? 'black' : 'gray';
                },
                vLineColor: function (i, node) {
                    return (i === 0 || i === node.table.widths.length) ? 'black' : 'gray';
                }
            };
            dataArr.table.body = [];

            var tableBlankRow = [
                {
                    text: '',
                    style: 'tableHeaderNoBorder'
                            },
                {
                    text: '',
                    style: 'tableHeaderNoBorder'
                            }
                        ];

            var tableHeader = [{
                text: 'Information Label',
                colSpan: 2,
                alignment: 'left',
                bold: true
                        }];

            var cellBGColor = '';

            if (i + 1 == 2) {
                cellBGColor = 'fillCellBGLightBlue';
            } else if (i + 1 == 3) {
                cellBGColor = 'fillCellBG';
            } else {
                cellBGColor = 'fillCellBGLightGreen';
            }
            ///////////////////////////////////////////////////////////////////

            var inputArray = [];
            var inputData = $scope.selectedProductInfo['Nominal']['Input'];
            var jsonKey = "";
            if ($scope.productjsonkeymap[$scope.selectedProductInfo.prodid]) {
                var jsonKey = $scope.productjsonkeymap[$scope.selectedProductInfo.prodid].jsonKey;
            } else {
                jsonKey = $scope.jsonKey;
            }

            if ($scope.graphInput.flowRateUnit == 'SCFM' || $scope.graphInput.flowRateUnit == 'ACFM') {
                var velocityUnit = "ft/s";
            } else {
                var velocityUnit = "m/s";
            }

            if ($scope.dataRangeValue == 'Flowrate') {
                var newInputVal = $scope.selectedProductInfo[$scope.outputVariable].OutVar[jsonKey].siInputVar;
                inputArray['oc_flowrate'] = String($filter('setDecimal')(newInputVal, 2));
            } else {
                inputArray['oc_flowrate'] = String($filter('setDecimal')(inputData['QAsys'], 2));
            }

            if ($scope.dataRangeValue == 'Number of Coalescer') {
                var newInputVal = $scope.selectedProductInfo[$scope.outputVariable].OutVar[jsonKey].siInputVar;
                inputArray['oc_no_of_coalescers'] = String($filter('setDecimal')(newInputVal, 2));
            } else {
                inputArray['oc_no_of_coalescers'] = String($filter('setDecimal')(inputData['Nc'], 2));
            }

            var flowrateORnocolcrLabel = "";
            var flowrateORnocolcrValue = "";

            if ($scope.solveFor == 'Number of Coalescer') {
                flowrateORnocolcrLabel = "Flowrate";
                flowrateORnocolcrValue = inputArray['oc_flowrate'];
                if ($scope.llCase) {
                    flowrateORnocolcrValue = (flowrateORnocolcrValue != 'NaN') ? flowrateORnocolcrValue + " " + $scope.graphInput.flowRateUnit : flowrateORnocolcrValue;
                } else if ($scope.lgCase) {
                    flowrateORnocolcrValue = (flowrateORnocolcrValue != 'NaN') ? flowrateORnocolcrValue + " " + $scope.graphInput.flowRateUnit : flowrateORnocolcrValue;
                }
            } else if ($scope.solveFor == 'Maximum Flowrate') {
                flowrateORnocolcrLabel = "No. of Coalescers Needed";
                flowrateORnocolcrValue = inputArray['oc_no_of_coalescers'];
            }

            if ($scope.dataRangeValue == 'Max Pressure') {
                var newInputVal = $scope.selectedProductInfo[$scope.outputVariable].OutVar[jsonKey].siInputVar;
                inputArray['oc_max_pressure'] = String($filter('setDecimal')(newInputVal, 2));
                inputArray['oc_max_pressure'] = (inputArray['oc_max_pressure'] != 'NaN') ? inputArray['oc_max_pressure'] + " " + $scope.graphInput.maxPressureUnits : inputArray['oc_max_pressure'];
            } else {
                inputArray['oc_max_pressure'] = String($filter('setDecimal')(inputData['Pmaxg'], 2));
                inputArray['oc_max_pressure'] = (inputArray['oc_max_pressure'] != 'NaN') ? inputArray['oc_max_pressure'] + " " + $scope.graphInput.maxPressureUnits : inputArray['oc_max_pressure'];
            }

            if ($scope.dataRangeValue == 'Operating Pressure') {
                var newInputVal = $scope.selectedProductInfo[$scope.outputVariable].OutVar[jsonKey].siInputVar;
                inputArray['oc_op_pressure'] = String($filter('setDecimal')(newInputVal, 2));
                inputArray['oc_op_pressure'] = (inputArray['oc_op_pressure'] != 'NaN') ? inputArray['oc_op_pressure'] + " " + $scope.graphInput.maxPressureUnits : inputArray['oc_op_pressure'];
            } else {
                inputArray['oc_op_pressure'] = String($filter('setDecimal')(inputData['Popg'], 2));
                inputArray['oc_op_pressure'] = (inputArray['oc_op_pressure'] != 'NaN') ? inputArray['oc_op_pressure'] + " " + $scope.graphInput.maxPressureUnits : inputArray['oc_op_pressure'];

            }

            if ($scope.dataRangeValue == 'Operating Temperature') {
                var newInputVal = $scope.selectedProductInfo[$scope.outputVariable].OutVar[jsonKey].siInputVar;
                inputArray['oc_op_temperature'] = String($filter('setDecimal')(newInputVal, 2));
                inputArray['oc_op_temperature'] = (inputArray['oc_op_temperature'] != 'NaN') ? inputArray['oc_op_temperature'] + " " + $scope.graphInput.temprature : inputArray['oc_op_temperature'];
            } else {
                inputArray['oc_op_temperature'] = String($filter('setDecimal')(inputData['Top'], 2));
                inputArray['oc_op_temperature'] = (inputArray['oc_op_temperature'] != 'NaN') ? inputArray['oc_op_temperature'] + " " + $scope.graphInput.temprature : inputArray['oc_op_temperature'];
            }

            if ($scope.dataRangeValue == 'Continuous Density') {
                var newInputVal = $scope.selectedProductInfo[$scope.outputVariable].OutVar[jsonKey].siInputVar;
                inputArray['cp_density'] = String($filter('setDecimal')(newInputVal, 2));
                inputArray['cp_density'] = (inputArray['cp_density'] != 'NaN') ? inputArray['cp_density'] + " " + $scope.graphInput.liquidData.density.unit : inputArray['cp_density'];
            } else {
                inputArray['cp_density'] = String($filter('setDecimal')(inputData['rhoC'], 2));
                inputArray['cp_density'] = (inputArray['cp_density'] != 'NaN') ? inputArray['cp_density'] + " " + $scope.graphInput.liquidData.density.unit : inputArray['cp_density'];
            }

            if ($scope.dataRangeValue == 'Viscosity') {
                var newInputVal = $scope.selectedProductInfo[$scope.outputVariable].OutVar[jsonKey].siInputVar;
                inputArray['cp_viscosity'] = String($filter('setDecimal')(newInputVal, 2));
                inputArray['cp_viscosity'] = (inputArray['cp_viscosity'] != 'NaN') ? inputArray['cp_viscosity'] + " " + "CP" : inputArray['cp_viscosity'];
            } else {
                inputArray['cp_viscosity'] = String($filter('setDecimal')(inputData['muC'], 2));
                inputArray['cp_viscosity'] = (inputArray['cp_viscosity'] != 'NaN') ? inputArray['cp_viscosity'] + " " + "CP" : inputArray['cp_viscosity'];
            }

            if ($scope.dataRangeValue == 'Discontinuous Density') {
                var newInputVal = $scope.selectedProductInfo[$scope.outputVariable].OutVar[jsonKey].siInputVar;
                inputArray['dp_density'] = String($filter('setDecimal')(newInputVal, 2));
                inputArray['dp_density'] = (inputArray['dp_density'] != 'NaN') ? inputArray['dp_density'] + " " + $scope.graphInput.disLiquidData.density.unit : inputArray['dp_density'];
            } else {
                inputArray['dp_density'] = String($filter('setDecimal')(inputData['rhoD'], 2));
                inputArray['dp_density'] = (inputArray['dp_density'] != 'NaN') ? inputArray['dp_density'] + " " + $scope.graphInput.disLiquidData.density.unit : inputArray['dp_density'];
            }

            if ($scope.dataRangeValue == 'IFT') {
                var newInputVal = $scope.selectedProductInfo[$scope.outputVariable].OutVar[jsonKey].siInputVar;
                inputArray['dp_tension'] = String($filter('setDecimal')(newInputVal, 2));
                inputArray['dp_tension'] = (inputArray['dp_tension'] != 'NaN') ? inputArray['dp_tension'] + " " + "dyn/cm" : inputArray['dp_tension'];
            } else {
                inputArray['dp_tension'] = String($filter('setDecimal')(inputData['IFT'], 2));
                inputArray['dp_tension'] = (inputArray['dp_tension'] != 'NaN') ? inputArray['dp_tension'] + " " + "dyn/cm" : inputArray['dp_tension'];
            }

            if ($scope.dataRangeValue == 'Max Clean DP') {
                var newInputVal = $scope.selectedProductInfo[$scope.outputVariable].OutVar[jsonKey].siInputVar;
                inputArray['max_clean_dry_dp'] = String($filter('setDecimal')(newInputVal, 2));
                inputArray['max_clean_dry_dp'] = (inputArray['max_clean_dry_dp'] != 'NaN') ? inputArray['max_clean_dry_dp'] + " " + $scope.graphInput.maxPressureUnits : inputArray['max_clean_dry_dp'];
            } else {
                inputArray['max_clean_dry_dp'] = String($filter('setDecimal')(inputData['dptmax'], 2));
                inputArray['max_clean_dry_dp'] = (inputArray['max_clean_dry_dp'] != 'NaN') ? inputArray['max_clean_dry_dp'] + " " + $scope.graphInput.maxCleanDPUnit : inputArray['max_clean_dry_dp'];
            }
            if ($scope.dataRangeValue == 'Nozzle DP') {
                var newInputVal = $scope.selectedProductInfo[$scope.outputVariable].OutVar[jsonKey].siInputVar;
                inputArray['nozzle_size'] = String($filter('setDecimal')(newInputVal, 2));
                inputArray['nozzle_size'] = (inputArray['nozzle_size'] != 'NaN') ? inputArray['nozzle_size'] + " " + $scope.graphInput.nozzleSizeUnit : inputArray['nozzle_size'];
            } else {
                inputArray['nozzle_size'] = String($filter('setDecimal')(inputData['dnu'], 2));
                inputArray['nozzle_size'] = (inputArray['nozzle_size'] != 'NaN') ? inputArray['nozzle_size'] + " " + $scope.graphInput.nozzleSizeUnit : inputArray['nozzle_size'];
            }

            inputArray['max_clean_sat_dp'] = String($filter('setDecimal')(inputData['dpsmax'], 2));
            inputArray['max_clean_sat_dp'] = (inputArray['max_clean_sat_dp'] != 'NaN') ? inputArray['max_clean_sat_dp'] + " " + $scope.graphInput.maxCleanDPUnit : inputArray['max_clean_sat_dp'];


            inputArray['cp_name'] = Data.data.liquidData.name;
            inputArray['dp_name'] = Data.data.disLiquidData.name;
            inputArray['dp_concentration'] = String($filter('setDecimal')(inputData['MFD'], 2));
            inputArray['dp_concentration'] = (inputArray['dp_concentration'] != 'NaN') ? inputArray['dp_concentration'] + " " + $scope.graphInput.disLiquidData.concentration.unit : inputArray['dp_concentration'];

            ///////////////////////////////////////////////////////////////////
            if ($scope.dataRangeValue == 'Select Attribute') {
                var outputData = productsArr[i].Nominal.Output;
            } else {
                var outputData = productsArr[i][$scope.outputVariable].OutVar[$scope.jsonKey];
            }

            var outputArray = [];
            var SZOrWRVLabel = "";
            var SZOrWRVValue = "";

            var flowrateORnocolcrOPLabel = "";
            var flowrateORnocolcrOPValue = "";


            if ($scope.solveFor == 'Number of Coalescer') {
                flowrateORnocolcrOPLabel = "No. of Coalescers Needed";
                outputArray['num_of_coalescers'] = (outputData['Nc'] == '-999') ? 'NaN' : String($filter('setDecimal')(outputData['Nc'], 2));
                flowrateORnocolcrOPValue = outputArray['num_of_coalescers'];
            } else if ($scope.solveFor == 'Maximum Flowrate') {
                flowrateORnocolcrOPLabel = "Flowrate";
                flowrateORnocolcrOPValue = (outputData['Qact'] == '-999') ? 'NaN' : String($filter('setDecimal')(outputData['Qact'], 2));
                if ($scope.llCase) {
                    flowrateORnocolcrOPValue = (flowrateORnocolcrOPValue != 'NaN') ? flowrateORnocolcrOPValue + " GPM" : flowrateORnocolcrOPValue;
                } else if ($scope.lgCase) {
                    flowrateORnocolcrOPValue = (flowrateORnocolcrOPValue != 'NaN') ? flowrateORnocolcrOPValue + " AM^3/hr" : flowrateORnocolcrOPValue;
                }
            }
            var Preseparation = "";
            var sgravity = "";
            var ScaleUpHeading = "";
            var SLSProduct = "";
            var SLSTestedFlowrate = "";
            inputArray['slsproduct'] = '';
            inputArray['slstestflowrate'] = '';
            if ($scope.llCase) {
                if (Data.data.slsCheck) {
                    ScaleUpHeading = "Scale Up from SLS Test Data";
                    SLSProduct = "Product";
                    SLSTestedFlowrate = "Tested Flowrate";
                    inputArray['slsproduct'] = Data.data.slsProduct;
                    inputArray['slstestflowrate'] = Data.data.testedFlowrate + ' ' + Data.data.slsTestUnit;
                }
                inputArray['sg'] = "";
                inputArray['projected'] = "";
                outputArray['actual_housing_id'] = (outputData['dh'] == '-999') ? 'NaN' : String($filter('setDecimal')(outputData['dh'], 2));
                outputArray['actual_housing_id'] = (outputArray['actual_housing_id'] != 'NaN') ? outputArray['actual_housing_id'] + " " + $scope.outputUnits.length : outputArray['actual_housing_id'];

                outputArray['nominal_housing_od'] = (outputData['oDh'] == '-999') ? 'NaN' : String($filter('setDecimal')(outputData['oDh'], 2));
                outputArray['nominal_housing_od'] = (outputArray['nominal_housing_od'] != 'NaN') ? outputArray['nominal_housing_od'] + " " + $scope.outputUnits.length : outputArray['nominal_housing_od'];

                outputArray['minimum_possible_housing_id'] = (outputData['dht'] == '-999') ? 'NaN' : String($filter('setDecimal')(outputData['dht'], 2));
                outputArray['minimum_possible_housing_id'] = (outputArray['minimum_possible_housing_id'] != 'NaN') ? outputArray['minimum_possible_housing_id'] + " " + $scope.outputUnits.length : outputArray['minimum_possible_housing_id'];

                outputArray['nominal_nozzle_od'] = (outputData['oDn'] == '-999') ? 'NaN' : String($filter('setDecimal')(outputData['oDn'], 2));
                outputArray['nominal_nozzle_od'] = (outputArray['nominal_nozzle_od'] != 'NaN') ? outputArray['nominal_nozzle_od'] + " " + $scope.outputUnits.length : outputArray['nominal_nozzle_od'];


                outputArray['nozzle_id'] = (outputData['oDn'] == '-999') ? 'NaN' : String($filter('setDecimal')(outputData['oDn'], 2));
                outputArray['nozzle_id'] = (outputArray['nozzle_id'] != 'NaN') ? outputArray['nozzle_id'] + " " + $scope.outputUnits.length : outputArray['nozzle_id'];

                outputArray['nozzle_dp'] = (outputData['n'] == '-999') ? 'NaN' : String($filter('setDecimal')(outputData['n'], 2));
                outputArray['nozzle_dp'] = (outputArray['nozzle_dp'] != 'NaN') ? outputArray['nozzle_dp'] + " " + $scope.outputUnits.pressure : outputArray['nozzle_dp'];

                outputArray['tube_sheet'] = (outputData['ts'] == '-999') ? 'NaN' : String($filter('setDecimal')(outputData['ts'], 2));
                outputArray['tube_sheet'] = (outputArray['tube_sheet'] != 'NaN') ? outputArray['tube_sheet'] + " " + $scope.outputUnits.pressure : outputArray['tube_sheet'];

                outputArray['core_dp'] = (outputData['core'] == '-999') ? 'NaN' : String($filter('setDecimal')(outputData['core'], 2));
                outputArray['core_dp'] = (outputArray['core_dp'] != 'NaN') ? outputArray['core_dp'] + " " + $scope.outputUnits.pressure : outputArray['core_dp'];

                outputArray['media_dp'] = (outputData['dm'] == '-999') ? 'NaN' : String($filter('setDecimal')(outputData['dm'], 2));
                outputArray['media_dp'] = (outputArray['media_dp'] != 'NaN') ? outputArray['media_dp'] + " " + $scope.outputUnits.pressure : outputArray['media_dp'];

                outputArray['max_flowrate'] = (outputData['Qact'] == '-999') ? 'NaN' : String($filter('setDecimal')(outputData['Qact'], 2));
                if ($scope.llCase) {
                    outputArray['max_flowrate'] = (outputArray['max_flowrate'] != 'NaN') ? outputArray['max_flowrate'] + " " + $scope.outputUnits.coalesced_flow : outputArray['max_flowrate'];
                } else if ($scope.lgCase) {
                    outputArray['max_flowrate'] = (outputArray['max_flowrate'] != 'NaN') ? outputArray['max_flowrate'] + " " + $scope.outputUnits.coalesced_flow : outputArray['max_flowrate'];
                }


                if ($scope.selectedProductInfo.config == '1') {
                    outputArray['setting_zone'] = (outputData['Lhs'] == '-999') ? 'NaN' : String($filter('setDecimal')(outputData['Lhs'], 2));
                    outputArray['setting_zone'] = (outputArray['setting_zone'] != 'NaN') ? outputArray['setting_zone'] + " " + $scope.outputUnits.length : outputArray['setting_zone'];

                    SZOrWRVLabel = "Setting Zone";
                    SZOrWRVValue = outputArray['setting_zone'];
                }

                /*if ($scope.selectedProductInfo.config == '2') {
    outputArray['water_rise_velocity'] = (outputData['VD'] == '-999') ? 'NaN' : String($filter('setDecimal')(outputData['VD'], 2));
    outputArray['water_rise_velocity'] = (outputArray['water_rise_velocity'] != 'NaN') ? outputArray['water_rise_velocity'] + (outputArray['water_rise_velocity'] > 1 ? ' inches' : ' inch') : outputArray['water_rise_velocity'];

    SZOrWRVLabel = "Water Rise Velocity";
    SZOrWRVValue = outputArray['water_rise_velocity'];
}*/

                outputArray['total_dp'] = (outputData['tot'] == '-999') ? 'NaN' : String($filter('setDecimal')(outputData['tot'], 2));
                outputArray['total_dp'] = (outputArray['total_dp'] != 'NaN') ? outputArray['total_dp'] + " " + $scope.outputUnits.pressure : outputArray['total_dp'];

                outputArray['coalesced_flow'] = (outputData['QD'] == '-999') ? 'NaN' : String($filter('setDecimal')(outputData['QD'], 2));
                outputArray['coalesced_flow'] = (outputArray['coalesced_flow'] != 'NaN') ? outputArray['coalesced_flow'] + " " + $scope.outputUnits.coalesced_flow : outputArray['coalesced_flow'];

                outputArray['flowrate'] = (outputData['siQAsys'] == '-999') ? 'NaN' : String($filter('setDecimal')(outputData['siQAsys'], 2));
                /*if ($scope.llCase) {
                    outputArray['flowrate'] = (outputArray['flowrate'] != 'NaN') ? outputArray['flowrate'] + " GPM" : outputArray['flowrate'];
                } else if ($scope.lgCase) {
                    outputArray['flowrate'] = (outputArray['flowrate'] != 'NaN') ? outputArray['flowrate'] + " AM^3/hr" : outputArray['flowrate'];
                }*/

                var dataRows = [tableBlankRow, tableHeader,
                                [{
                        text: flowrateORnocolcrOPLabel,
                        style: cellBGColor
                                }, {
                        text: flowrateORnocolcrOPValue,
                        style: cellBGColor
                                }],
                                [{
                        text: 'Nominal Housing OD',
                        style: cellBGColor
                                }, {
                        text: outputArray['nominal_housing_od'],
                        style: cellBGColor
                                }], [{
                        text: 'Actual Housing ID',
                        style: cellBGColor
                                }, {
                        text: outputArray['actual_housing_id'],
                        style: cellBGColor
                                }], [{
                        text: 'Minimum Possible Housing ID',
                        style: cellBGColor
                                }, {
                        text: outputArray['minimum_possible_housing_id'],
                        style: cellBGColor
                                }], [{
                        text: 'Nominal Nozzle Diameter',
                        style: cellBGColor
                                }, {
                        text: outputArray['nominal_nozzle_od'],
                        style: cellBGColor
                                }],
                                [{
                        text: 'Nozzle ID',
                        style: cellBGColor
                                }, {
                        text: outputArray['nozzle_id'],
                        style: cellBGColor
                                }],
                                [{
                        text: 'Nozzle DP',
                        style: cellBGColor
                                }, {
                        text: outputArray['nozzle_dp'],
                        style: cellBGColor
                                }],
                                [{
                        text: 'Tube sheet DP',
                        style: cellBGColor
                                }, {
                        text: outputArray['tube_sheet'],
                        style: cellBGColor
                                }],
                                [{
                        text: 'Core DP',
                        style: cellBGColor
                                }, {
                        text: outputArray['core_dp'],
                        style: cellBGColor
                                }],
                                [{
                        text: 'Media DP',
                        style: cellBGColor
                                }, {
                        text: outputArray['media_dp'],
                        style: cellBGColor
                                }],
                                [{
                        text: SZOrWRVLabel,
                        style: cellBGColor
                                }, {
                        text: SZOrWRVValue,
                        style: cellBGColor
                                }],
                                [{
                        text: 'Total DP',
                        style: cellBGColor
                                }, {
                        text: outputArray['total_dp'],
                        style: cellBGColor
                                }],
                                [{
                        text: 'Coalesced Flow',
                        style: cellBGColor
                                }, {
                        text: outputArray['coalesced_flow'],
                        style: cellBGColor
                                }],
                                [{
                        text: ' ',
                        colSpan: 2
                                }],
                                [{
                        text: 'Input Values For Solution',
                        colSpan: 2,
                        alignment: 'left',
                        bold: true
                                }],
                                [{
                        text: 'System Conditions',
                        colSpan: 2,
                        alignment: 'left',
                        bold: true
                                }],
                                [{
                        text: flowrateORnocolcrLabel,
                        style: cellBGColor
                                }, {
                        text: flowrateORnocolcrValue,
                        style: cellBGColor
                                }],
                                [{
                        text: 'Maximum Pressure',
                        style: cellBGColor
                                }, {
                        text: inputArray['oc_max_pressure'],
                        style: cellBGColor
                                }],
                                [{
                        text: 'Operating Pressure',
                        style: cellBGColor
                                }, {
                        text: inputArray['oc_op_pressure'],
                        style: cellBGColor
                                }],
                                [{
                        text: 'Operating Temperature',
                        style: cellBGColor
                                }, {
                        text: inputArray['oc_op_temperature'],
                        style: cellBGColor
                                }],
                                [{
                        text: 'Nominal Nozzle Diameter',
                        style: cellBGColor
                                }, {
                        text: inputArray['nozzle_size'],
                        style: cellBGColor
                                }],
                                [{
                        text: 'Continuous Phase',
                        colSpan: 2,
                        alignment: 'left',
                        bold: true
                                }],
                                [{
                        text: 'Name',
                        style: cellBGColor
                                }, {
                        text: inputArray['cp_name'],
                        style: cellBGColor
                                }],
                                [{
                        text: 'Density',
                        style: cellBGColor
                                }, {
                        text: inputArray['cp_density'],
                        style: cellBGColor
                                }],
                                [{
                        text: 'Viscosity',
                        style: cellBGColor
                                }, {
                        text: inputArray['cp_viscosity'],
                        style: cellBGColor
                                }],
                                [{
                        text: 'Discontinuous Phase',
                        colSpan: 2,
                        alignment: 'left',
                        bold: true
                                }],
                                [{
                        text: 'Name',
                        style: cellBGColor
                                }, {
                        text: inputArray['dp_name'],
                        style: cellBGColor
                                }],
                                [{
                        text: 'Density',
                        style: cellBGColor
                                }, {
                        text: inputArray['dp_density'],
                        style: cellBGColor
                                }],
                                [{
                        text: 'IFT (Interfacial Tension)',
                        style: cellBGColor
                                }, {
                        text: inputArray['dp_tension'],
                        style: cellBGColor
                                }],
                                [{
                        text: 'Concentration',
                        style: cellBGColor
                                }, {
                        text: inputArray['dp_concentration'],
                        style: cellBGColor
                                }], [{
                        text: ScaleUpHeading,
                        style: cellBGColor,
                        colSpan: 2,
                        alignment: "center"
                                }, {
                        text: '',
                        style: cellBGColor
                                }], [{
                        text: SLSProduct,
                        style: cellBGColor
                                }, {
                        text: inputArray['slsproduct'],
                        style: cellBGColor
                                }], [{
                        text: SLSTestedFlowrate,
                        style: cellBGColor
                                }, {
                        text: inputArray['slstestflowrate'],
                        style: cellBGColor
                                }],
                            ];

            } else if ($scope.lgCase) {
                var sgravity = "Specific Gravity"
                if ($scope.graphInput.presapration) {
                    Preseparation = "Preseparation";
                    inputArray['projected'] = String($filter('setDecimal')($scope.graphInput.projected, 2))
                } else {
                    inputArray['projected'] = "";
                }
                inputArray['sg'] = String($filter('setDecimal')($scope.graphInput.liquidData.gravity, 2));

                outputArray['actual_housing_id'] = (outputData['dh'] == '-999') ? 'NaN' : String($filter('setDecimal')(outputData['dh'], 2));
                outputArray['actual_housing_id'] = (outputArray['actual_housing_id'] != 'NaN') ? outputArray['actual_housing_id'] + " " + $scope.outputUnits.length : outputArray['actual_housing_id'];

                outputArray['nominal_housing_od'] = (outputData['oDh'] == '-999') ? 'NaN' : String($filter('setDecimal')(outputData['oDh'], 2));
                outputArray['nominal_housing_od'] = (outputArray['nominal_housing_od'] != 'NaN') ? outputArray['nominal_housing_od'] + " " + $scope.outputUnits.length : outputArray['nominal_housing_od'];

                outputArray['minimum_possible_housing_id'] = (outputData['dht'] == '-999') ? 'NaN' : String($filter('setDecimal')(outputData['dht'], 2));
                outputArray['minimum_possible_housing_id'] = (outputArray['minimum_possible_housing_id'] != 'NaN') ? outputArray['minimum_possible_housing_id'] + " " + $scope.outputUnits.length : outputArray['minimum_possible_housing_id'];

                outputArray['nominal_nozzle_od'] = (outputData['oDn'] == '-999') ? 'NaN' : String($filter('setDecimal')(outputData['oDn'], 2));
                outputArray['nominal_nozzle_od'] = (outputArray['nominal_nozzle_od'] != 'NaN') ? outputArray['nominal_nozzle_od'] + " " + $scope.outputUnits.length : outputArray['nominal_nozzle_od'];




                outputArray['nozzle_id'] = (outputData['oDn'] == '-999') ? 'NaN' : String($filter('setDecimal')(outputData['oDn'], 2));
                outputArray['nozzle_id'] = (outputArray['nozzle_id'] != 'NaN') ? outputArray['nozzle_id'] + " " + $scope.outputUnits.length : outputArray['nozzle_id'];

                outputArray['saturated_media'] = (outputData['sm'] == '-999') ? 'NaN' : String($filter('setDecimal')(outputData['sm'], 2));
                outputArray['saturated_media'] = (outputArray['saturated_media'] != 'NaN') ? outputArray['saturated_media'] + " " + $scope.outputUnits.pressure : outputArray['saturated_media'];

                outputArray['nozzle_dp'] = (outputData['n'] == '-999') ? 'NaN' : String($filter('setDecimal')(outputData['n'], 2));
                outputArray['nozzle_dp'] = (outputArray['nozzle_dp'] != 'NaN') ? outputArray['nozzle_dp'] + " " + $scope.outputUnits.pressure : outputArray['nozzle_dp'];

                outputArray['tube_sheet'] = (outputData['ts'] == '-999') ? 'NaN' : String($filter('setDecimal')(outputData['ts'], 2));
                outputArray['tube_sheet'] = (outputArray['tube_sheet'] != 'NaN') ? outputArray['tube_sheet'] + " " + $scope.outputUnits.pressure : outputArray['tube_sheet'];

                outputArray['dry_media'] = (outputData['dm'] == '-999') ? 'NaN' : String($filter('setDecimal')(outputData['dm'], 2));
                outputArray['dry_media'] = (outputArray['dry_media'] != 'NaN') ? outputArray['dry_media'] + " " + $scope.outputUnits.pressure : outputArray['dry_media'];

                outputArray['liquid_flux'] = (outputData['lam_act'] == '-999') ? 'NaN' : String($filter('setDecimal')(outputData['lam_act'], 2));
                outputArray['liquid_flux'] = (outputArray['liquid_flux'] != 'NaN') ? outputArray['liquid_flux'] + " " + "cc/(min ft^2)" : outputArray['liquid_flux'];

                outputArray['core_velocity'] = (outputData['vx_act'] == '-999') ? 'NaN' : String($filter('setDecimal')(outputData['vx_act'], 2));
                outputArray['core_velocity'] = (outputArray['core_velocity'] != 'NaN') ? outputArray['core_velocity'] + " " + $scope.outputUnits.velocity : outputArray['core_velocity'];

                outputArray['max_inlet_conc'] = (outputData['MFDmax'] == '-999') ? 'NaN' : String($filter('setDecimal')(outputData['MFDmax'], 2));
                outputArray['max_inlet_conc'] = (outputArray['max_inlet_conc'] != 'NaN') ? outputArray['max_inlet_conc'] + " " + $scope.graphInput.disLiquidData.concentration.unit : outputArray['max_inlet_conc'];

                outputArray['total_clean_dry'] = (outputData['tcd'] == '-999') ? 'NaN' : String($filter('setDecimal')(outputData['tcd'], 2));
                outputArray['total_clean_dry'] = (outputArray['total_clean_dry'] != 'NaN') ? outputArray['total_clean_dry'] + " " + $scope.outputUnits.pressure : outputArray['total_clean_dry'];

                outputArray['total_clean_sat_dry'] = (outputData['tcs'] == '-999') ? 'NaN' : String($filter('setDecimal')(outputData['tcs'], 2));
                outputArray['total_clean_sat_dry'] = (outputArray['total_clean_sat_dry'] != 'NaN') ? outputArray['total_clean_sat_dry'] + " " + $scope.outputUnits.pressure : outputArray['total_clean_sat_dry'];

                outputArray['core'] = (outputData['core'] == '-999') ? 'NaN' : String($filter('setDecimal')(outputData['core'], 2));
                outputArray['core'] = (outputArray['core'] != 'NaN') ? outputArray['core'] + " " + $scope.outputUnits.pressure : outputArray['core'];

                outputArray['max_annular_velocity'] = (outputData['vz_peak'] == '-999') ? 'NaN' : String($filter('setDecimal')(outputData['vz_peak'], 2));
                outputArray['max_annular_velocity'] = (outputArray['max_annular_velocity'] != 'NaN') ? outputArray['max_annular_velocity'] + " " + $scope.outputUnits.velocity : outputArray['max_annular_velocity'];

                outputArray['act_annular_velocity'] = (outputData['vz_act'] == '-999') ? 'NaN' : String($filter('setDecimal')(outputData['vz_act'], 2));
                outputArray['act_annular_velocity'] = (outputArray['act_annular_velocity'] != 'NaN') ? outputArray['act_annular_velocity'] + " " + $scope.outputUnits.velocity : outputArray['act_annular_velocity'];

                outputArray['max_media_velocity'] = (outputData['vtarg'] == '-999') ? 'NaN' : String($filter('setDecimal')(outputData['vtarg'], 2));
                outputArray['max_media_velocity'] = (outputArray['max_media_velocity'] != 'NaN') ? outputArray['max_media_velocity'] + " " + $scope.outputUnits.media_velocity : outputArray['max_media_velocity'];

                outputArray['act_media_velocity'] = (outputData['vm_act'] == '-999') ? 'NaN' : String($filter('setDecimal')(outputData['vm_act'], 2));
                outputArray['act_media_velocity'] = (outputArray['act_media_velocity'] != 'NaN') ? outputArray['act_media_velocity'] + " " + $scope.outputUnits.media_velocity : outputArray['act_media_velocity'];

                var dataRows = [tableBlankRow, tableHeader,
                                [{
                        text: flowrateORnocolcrOPLabel,
                        style: cellBGColor
                                }, {
                        text: flowrateORnocolcrOPValue,
                        style: cellBGColor
                                }],
                                [{
                        text: 'Nominal Housing OD',
                        style: cellBGColor
                                }, {
                        text: outputArray['nominal_housing_od'],
                        style: cellBGColor
                                }],
                                [{
                        text: 'Actual Housing ID',
                        style: cellBGColor
                                }, {
                        text: outputArray['actual_housing_id'],
                        style: cellBGColor
                                }],
                                [{
                        text: 'Minimum Possible Housing ID',
                        style: cellBGColor
                                }, {
                        text: outputArray['minimum_possible_housing_id'],
                        style: cellBGColor
                                }],
                                [{
                        text: 'Nominal Nozzle Diameter',
                        style: cellBGColor
                                }, {
                        text: outputArray['nominal_nozzle_od'],
                        style: cellBGColor
                                }],
                                [{
                        text: 'Nozzle ID',
                        style: cellBGColor
                                }, {
                        text: outputArray['nozzle_id'],
                        style: cellBGColor
                                }],
                                [{
                        text: 'Media Sat. DP',
                        style: cellBGColor
                                }, {
                        text: outputArray['saturated_media'],
                        style: cellBGColor
                                }],
                                [{
                        text: 'Nozzle DP',
                        style: cellBGColor
                                }, {
                        text: outputArray['nozzle_dp'],
                        style: cellBGColor
                                }],
                                [{
                        text: 'Tube sheet',
                        style: cellBGColor
                                }, {
                        text: outputArray['tube_sheet'],
                        style: cellBGColor
                                }],
                                [{
                        text: 'Media Dry DP',
                        style: cellBGColor
                                }, {
                        text: outputArray['dry_media'],
                        style: cellBGColor
                                }],
                                [{
                        text: 'Actual Liquid Flux',
                        style: cellBGColor
                                }, {
                        text: outputArray['liquid_flux'],
                        style: cellBGColor
                                }],
                                [{
                        text: 'Core Velocity',
                        style: cellBGColor
                                }, {
                        text: outputArray['core_velocity'],
                        style: cellBGColor
                                }],
                                [{
                        text: 'Max Inlet Aerosol Mass Concentration',
                        style: cellBGColor
                                }, {
                        text: outputArray['max_inlet_conc'],
                        style: cellBGColor
                                }],
                                [{
                        text: 'Total Clean Dry DP',
                        style: cellBGColor
                                }, {
                        text: outputArray['total_clean_dry'],
                        style: cellBGColor
                                }],
                                [{
                        text: 'Total Clean Sat. DP',
                        style: cellBGColor
                                }, {
                        text: outputArray['total_clean_sat_dry'],
                        style: cellBGColor
                                }],
                                [{
                        text: 'Core DP',
                        style: cellBGColor
                                }, {
                        text: outputArray['core'],
                        style: cellBGColor
                                }],
                                [{
                        text: 'Maximum Annular Velocity',
                        style: cellBGColor
                                }, {
                        text: outputArray['max_annular_velocity'],
                        style: cellBGColor
                                }],
                                [{
                        text: 'Actual Annular Velocity',
                        style: cellBGColor
                                }, {
                        text: outputArray['act_annular_velocity'],
                        style: cellBGColor
                                }],
                                [{
                        text: 'Maximum Media Velocity',
                        style: cellBGColor
                                }, {
                        text: outputArray['max_media_velocity'],
                        style: cellBGColor
                                }],
                                [{
                        text: 'Actual Media Velocity',
                        style: cellBGColor
                                }, {
                        text: outputArray['act_media_velocity'],
                        style: cellBGColor
                                }],
                                [{
                        text: ' ',
                        colSpan: 2
                                }],
                                [{
                        text: 'Input Values For Solution',
                        colSpan: 2,
                        alignment: 'left',
                        bold: true
                                }],
                                [{
                        text: 'System Conditions',
                        colSpan: 2,
                        alignment: 'left',
                        bold: true
                                }],
                                [{
                        text: flowrateORnocolcrLabel,
                        style: cellBGColor
                                }, {
                        text: flowrateORnocolcrValue,
                        style: cellBGColor
                                }],
                                [{
                        text: 'Maximum Pressure',
                        style: cellBGColor
                                }, {
                        text: inputArray['oc_max_pressure'],
                        style: cellBGColor
                                }],
                                [{
                        text: 'Operating Pressure',
                        style: cellBGColor
                                }, {
                        text: inputArray['oc_op_pressure'],
                        style: cellBGColor
                                }],
                                [{
                        text: 'Operating Temperature',
                        style: cellBGColor
                                }, {
                        text: inputArray['oc_op_temperature'],
                        style: cellBGColor
                                }],
                                [{
                        text: 'Nominal Nozzle Diameter',
                        style: cellBGColor
                                }, {
                        text: inputArray['nozzle_size'],
                        style: cellBGColor
                                }],
                                [{
                        text: 'Max Clean Dry DP',
                        style: cellBGColor
                                }, {
                        text: inputArray['max_clean_dry_dp'],
                        style: cellBGColor
                                }],
                                [{
                        text: 'Max Clean Saturated DP',
                        style: cellBGColor
                                }, {
                        text: inputArray['max_clean_sat_dp'],
                        style: cellBGColor
                                }],
                                [{
                        text: 'Continuous Phase',
                        colSpan: 2,
                        alignment: 'left',
                        bold: true
                                }],
                                [{
                        text: 'Name',
                        style: cellBGColor
                                }, {
                        text: inputArray['cp_name'],
                        style: cellBGColor
                                }],
                                [{
                        text: 'Density',
                        style: cellBGColor
                                }, {
                        text: inputArray['cp_density'],
                        style: cellBGColor
                                }],
                                [{
                        text: 'Viscosity',
                        style: cellBGColor
                                }, {
                        text: inputArray['cp_viscosity'],
                        style: cellBGColor
                                }],
                                [{
                        text: sgravity,
                        style: cellBGColor
                                }, {
                        text: inputArray['sg'],
                        style: cellBGColor
                                }],
                                [{
                        text: 'Discontinuous Phase',
                        colSpan: 2,
                        alignment: 'left',
                        bold: true
                                }],
                                [{
                        text: 'Name',
                        style: cellBGColor
                                }, {
                        text: inputArray['dp_name'],
                        style: cellBGColor
                                }],
                                [{
                        text: 'Density',
                        style: cellBGColor
                                }, {
                        text: inputArray['dp_density'],
                        style: cellBGColor
                                }],
                                [{
                        text: 'IFT (Interfacial Tension)',
                        style: cellBGColor
                                }, {
                        text: inputArray['dp_tension'],
                        style: cellBGColor
                                }],
                                [{
                        text: 'Concentration',
                        style: cellBGColor
                                }, {
                        text: inputArray['dp_concentration'],
                        style: cellBGColor
                                }],
                                [{
                        text: Preseparation,
                        style: cellBGColor
                                }, {
                        text: inputArray['projected'],
                        style: cellBGColor
                                }]
                            ];
            }

            dataArr.table.body = dataRows;

            if (typeof headerColsArr[i] == 'undefined' || typeof headerColsArr[i] == undefined) {
                headerColsArr[i] = [];
            }
            headerColsArr[i].push(headerCol);
            headerColsArr[i].push(subHeaderCol);
            headerColsArr[i].push(subHeaderConfigCol);
            headerColsArr[i].push(dataArr);
        }



        var docDefinition = {
            content: [
                {
                    image: logoImg,
                    width: 200
                            }, '\n',
                {
                    text: 'Customer Name : ' + $scope.customerNameCompare,
                    fontSize: 14,
                    bold: true,
                    margin: [0, 0, 0, 8]
                                },
                {
                    text: 'Customer Address : ' + $scope.customerAddressCompare,
                    fontSize: 14,
                    bold: true,
                    margin: [0, 0, 0, 8]
                                }, {
                    alignment: 'left',
                    columns: headerColsArr
                            }

                        ],
            styles: {
                tableHeaderNoBorder: {
                    border: [false, false, false, false]
                },
                fillCellBG: {
                    fillColor: 'yellow'
                },
                fillCellBGLightGreen: {
                    fillColor: '#aaffaa'
                },
                fillCellBGLightBlue: {
                    fillColor: '#aaaaff'
                },
                fillTableHeaderBG: {
                    fillColor: 'gray'
                }
            },
            defaultStyle: {
                columnGap: 10,
            },
            footer: {
                columns: [
                    {
                        text: moment().format('MMMM Do YYYY, h:mm:ss a'),
                        alignment: 'right',
                        margin: [20, 5, 5, 5]
                    }
                ]
            }
        }

        var ua = window.navigator.userAgent;
        var msie = ua.indexOf("MSIE ");

        // download the PDF
        if (msie > 0 || window.navigator.appName == "Netscape") {
            var pdffilename = "product_comparison";
            var filename = pdffilename + '.pdf';
            pdfMake.createPdf(docDefinition).download(filename);
        } else {
            pdfMake.createPdf(docDefinition).open();
        }
        $("#customerInformationCompare").modal("hide");
    }
    $scope.saveConfiguration = function () {
        if (!$scope.showConfig) {
            $scope.showConfig = true;
            $scope.configName = Data.data.configurationName;
            delete Data.data.configurationName;
            return;
        }

        if (!$scope.configName) {
            alert("Please fill file name !")
            return;
        }


        var url = "";
        url += "configNameParam=" + $scope.configName;
        if (Data.data.solveFor == "Number of Coalescer") {
            url += "&solv4Param=N";
        } else if (Data.data.solveFor == "Maximum Flowrate") {
            url += "&solv4Param=Q";
        }


        if (Data.data.llCase) {
            url += '&typeofcallParam=LL';
        } else {
            url += '&typeofcallParam=LG';
        }


        if (Data.data.solveFor == "Number of Coalescer") {


            if (Data.data.flowRate) {
                url += "&qasysParam=" + String(Data.data.flowRate);
            }

            if (Data.data.flowRateUnit !== 'u') {
                url += "&qasysUnitParam=" + Data.data.flowRateUnit.toString();
            }
            url += '&ncParam=-999';
        } else if (Data.data.solveFor == "Maximum Flowrate") {

            url += '&qasysParam=-999';
            url += '&qasysUnitParam=-10';
            if (Data.data.number_of_col) {
                url += '&ncParam=' + String(Data.data.number_of_col);
            }

        }

        if (Data.data.maximum_pressure) {
            url += "&pmaxParam=" + String(Data.data.maximum_pressure);
        }

        if (Data.data.maxPressureUnits) {
            url += '&pmaxUnitParam=' + Data.data.maxPressureUnits.toString();
        }

        if (Data.data.temp_operating) {
            url += "&topParam=" + String(Data.data.temp_operating);
        }

        url += '&topUnitParam=' + ($scope.temprature == "Fahrenheit" ? "F" : "C");

        if (Data.data.operating_pressure) {
            url += '&popgParam=' + String(Data.data.operating_pressure);
        }

        if (Data.data.opPressureUnits) {
            url += '&popgUnitParam=' + Data.data.opPressureUnits.toString();
        }


        if (Data.data.liquidData.name) {
            url += "&cpnameParam=" + Data.data.liquidData.name;
        }

        if (Data.data.liquidData.density.value) {
            url += '&rhoCParam=' + String(Data.data.liquidData.density.value);
        }

        if (Data.data.liquidData.density.unit != 'Units') {
            url += '&rhoCUnitParam=' + (Data.data.liquidData.density.unit.toString());
        }

        if (Data.data.liquidData.viscosity) {
            url += '&muCParam=' + String(Data.data.liquidData.viscosity);
        }

        if (Data.data.disLiquidData.name) {
            url += '&dpnameParam=' + Data.data.disLiquidData.name;
        }

        if (Data.data.disLiquidData.density.value) {
            url += "&rhoDParam=" + String(Data.data.disLiquidData.density.value);
        }

        if (Data.data.disLiquidData.density.unit != 'Units') {
            url += '&rhoDUnitParam=' + (Data.data.disLiquidData.density.unit.toString());
        }

        if (Data.data.disLiquidData.interfacialTension) {
            url += '&IFTParam=' + String(Data.data.disLiquidData.interfacialTension);
            //url += '&IFTUnitParam=dyn/cm';
        }

        if (Data.data.disLiquidData.concentration.value) {
            url += '&mfdParam=' + String(Data.data.disLiquidData.concentration.value);
        }

        if (Data.data.disLiquidData.concentration.unit != 'Units') {
            url += '&mfdUnitParam=' + (Data.data.disLiquidData.concentration.unit == "ppm" ? "PPM weight" : "% weight");
        }

        url += '&usernameParam=' + user.get();

        if (Data.data.fileId) {
            url += '&unoParam=' + String(Data.data.fileId);
        } else {
            url += '&unoParam = 0';
        }



        if (Data.data.lgCase) {
            if (Data.data.liquidData.gravity) {
                url += "&sgParam=" + String(Data.data.liquidData.gravity);
            }
        }


        if (Data.data.llCase) {
            if (Data.data.slsProduct != 'Select' && Data.data.slsProduct != undefined) {
                url += '&pnslsParam=' + Data.data.slsProduct.toString();
            }

            if ($scope.testedFlowrate) {
                url += '&qslsParam=' + String(Data.data.testedFlowrate);
            }
            if ($scope.slsTestUnit != 'u' && Data.data.slsTestUnit != undefined) {
                url += '&qslsUnitParam=' + Data.data.slsTestUnit.toString();
            }
        } else if (Data.data.lgCase) {
            if (Data.data.projected) {
                url += '&preParam=' + String(Data.data.projected);
            }
        }


        //console.log(encodeURI(url));


        $http.get(Constants.saveConfiguration + url).success(function (response) {
            if (response.error) {
                alert(response.error)
            } else {
                alert("File saved Successfully")
            }
            Data.data.fileId = undefined;

            //console.log(response);
        }).error(function (e) {
            //alert("File saved Successfully")
            //console.log(e);
        });


    }

});