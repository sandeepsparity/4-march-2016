angular.module("app").directive("footerDirective", footerDirective);

function footerDirective() {
    return {
        restrict: "E",
        templateUrl: "partials/footer.html",
        replace: true,
        controller: function ($scope) {
            $scope.$on("showCalculateButton", function (event, args) {
                if (args.show) {
                    $scope.showCalc = true;
                }
            });
        }
    }
}


angular.module('app').directive('allowNumbersOnly', allowNumbersOnly);

function allowNumbersOnly() {
    return {
        restrict: "A",
        link: function (scope, element) {
            //if (!ngModel) return;

            var ua = window.navigator.userAgent;
            var msie = ua.indexOf("MSIE ");

            if (msie > 0) {
                $(element).attr("type", "text");
                $(element).unbind("keypress").bind("keypress", function (e) {
                    if (window.event) {
                        var charCode = window.event.keyCode;
                    } else if (e) {
                        var charCode = e.which;
                    } else {
                        return true;
                    }

                    if (charCode > 31 && (charCode < 48 || charCode > 57) && charCode != 46 && charCode != 45) {
                        return false;
                    }

                    if ($(element).val().indexOf('.') != -1 && charCode == 46) {
                        return false;
                    }

                    if ($(element).val().indexOf('-') != -1 && charCode == 45) {
                        return false;
                    }

                    if ($(element).val().length > 0 && charCode == 45) {
                        return false;
                    }

                    return true;
                });
            }
        }
    };
}


angular.module('app').directive('pallHeader', pallHeader);
pallHeader.$inject = ["user", "usSpinnerService", "$http", "Constants"];

function pallHeader(user, usSpinnerService, $http, Constants) {
    return {
        restrict: "E",
        templateUrl: "partials/header.html",
        replace: true,
        link: function ($scope, element, attr) {
            if (attr.showmenus == "false") {
                $scope.showMenus = false;
            } else {
                $scope.showMenus = true;
            }
        }
    }
}
