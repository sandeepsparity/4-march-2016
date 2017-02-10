angular.module('app').controller('loginController', function ($scope, $http, $state, usSpinnerService, Constants, user) {
    $scope.handleKeyPress = function (event) {
        if (event.which === 13) {
            $scope.login();
        }
    }


    $scope.login = function () {
        if (!$scope.username || $scope.username == undefined) {
            alert("Please Enter Username.");
            $("#j_username").focus();
            return;
        }

        if (!$scope.password || $scope.password == undefined) {
            alert("Please Enter Password.");
            $("#j_password").focus();
            return;
        }

        //var loginUrl = 'https://search.pall.com/services/sizing/rest/ajaxLogin?';
        var loginUrl = Constants.login;
        loginUrl += "j_username=" + $scope.username;
        loginUrl += "&j_password=" + $scope.password;
        usSpinnerService.spin('spinner-1');
 
        $http.get(loginUrl).success(function (response) {
            if (response.status == "Success" || response.status == "Sucess") {
                user.set($scope.username);
                $state.go('home');
                return;
            } else {
                if (response.message) {
                    window.alert(response.message);
                }
            }
        }).error(function () {
            window.alert("Please enter valid Username and Password");
        });
    }

    $scope.forgotPassword = function () {
        if ($scope.forgotPasswordEmail == undefined) {
            $scope.showMessage = true;
            return;
        } else {
            $scope.showMessage = false;
        }
        $scope.showMessage = false;
        var forgotPasswordUrl = Constants.forgotPassword;
        forgotPasswordUrl += "/" + $scope.forgotPasswordEmail + "/password/reset";
        usSpinnerService.spin('spinner-1');
        $http.get(forgotPasswordUrl).success(function (response) {
            if (response.error) {
                $scope.exceptionMsg = response.error;
                $("#exceptionModal1").modal('show');
                return;
            } else {
                $scope.exceptionMsg = "Please Check Your Email.";
                $("#exceptionModal1").modal('show');
                return;
            }
        }).error(function (error) {
            $scope.showMessage = true;
            $scope.iem = error;
        });

    }
    $scope.closeException = function () {
        $("#exceptionModal1").modal('hide');
        $(".modal-backdrop.in").css("opacity", "0");
        $(".modal-backdrop.fade.in").hide();
        location.reload();
        return;
    }
});
