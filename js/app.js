//<!-- Version 1.3 -->
//<!-- Version 1.3 -->
"use strict";
angular.module('app', ['ui.router', 'highcharts-ng', 'ui.slider', 'ngLoadingSpinner', 'angular-nicescroll', 'rzModule']);
angular.module('app').config(config);
angular.module('app').factory('Data', function ($http, Constants) {
    var factory = {};
    factory.data = {};
    return factory;
})
angular.module('app').directive('modal', function () {
    return {
        template: '<div class="modal fade">' +
            '<div class="modal-dialog">' +
            '<div class="modal-content">' +
            '<div class="modal-header">' +
            '<button type="button" class="close" data-dismiss="modal" aria-hidden="true">&times;</button>' +
            '</div>' +
            '<div class="modal-body" ng-transclude></div>' +
            '</div>' +
            '</div>' +
            '</div>',
        restrict: 'E',
        transclude: true,
        replace: true,
        scope: true,
        link: function postLink(scope, element, attrs) {
            scope.title = attrs.title;
            scope.$watch(attrs.visible, function (value) {
                if (value == true)
                    $(element).modal('show');
                else
                    $(element).modal('hide');
            });

            $(element).on('showwn.bs.modal', function () {
                scope.$apply(function () {
                    scope.$parent[attrs.visible] = true;
                });
            });

            $(element).on('hidden.bs.modal', function () {
                scope.$apply(function () {
                    scope.$parent[attrs.visible] = false;
                });
            });
        }
    }
});
angular.module('app').filter('setDecimal', function ($filter) {
    return function (input, places) {
        if (isNaN(input)) {
            return input;
        }
        // If we want 1 decimal place, we want to mult/div by 10
        // If we want 2 decimal places, we want to mult/div by 100, etc
        // So use the following to create that factor

        if (input < 0.01) {
            if (input.toString().indexOf("e") !== -1) {
                return input.toString().substring(0, 4) + " * e" + input.toString().split("e")[1];
            } else if (input.toString().indexOf(".") !== -1) {
                var expo = input.toExponential();
                var result = expo.split('e')[0].substring(0, 4) + " * e" + expo.split('e')[1];
                return result;
            } else {
                return input;
            }
        } else {
            var factor = "1" + Array(+(places > 0 && places + 1)).join("0");
            return Math.round(input * factor) / factor;
        }

    };
});


function config($stateProvider, $urlRouterProvider) {
    $urlRouterProvider.otherwise("/login");
    $stateProvider.state('login', {
            url: "/login",
            templateUrl: "partials/login.html",
            controller: "loginController"
        })
        .state('home', {
            url: "/operatingCondition/:id",
            templateUrl: "partials/opration-condition.html",
            controller: "inputController"
        })
        .state('graph', {
            url: "/opengraph",
            templateUrl: "partials/open_graph.html",
            controller: "graphController"
        });
};
