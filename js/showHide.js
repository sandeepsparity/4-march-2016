
// JavaScript source code
//$(document).ready(function () {
//    $('#purpose').on('change', function () {
//        if (this.value == '0')
//        {
//            $("#idNumOfCoal").show();
//            $("#idMaxFlowRate").hide();
//        }
//        else {
//            $("#idNumOfCoal").hide();
//            $("#idMaxFlowRate").show();
//        }
//    });
//});


function showhideCol2NOCoal() {
    var div = document.getElementById("idCol2NOCoal");
    if (div.style.display !== "none") {
        div.style.display = "none";
    }
    else {
        div.style.display = "block";
    }
}

function showhideCol3NOCoal() {
    var div = document.getElementById("idCol3NOCoal");
    if (div.style.display !== "none") {
        div.style.display = "none";
    }
    else {
        div.style.display = "block";
    }
}

function showhideCol2MFRate() {
    var div = document.getElementById("idCol2MFRate");
    if (div.style.display !== "none") {
        div.style.display = "none";
    }
    else {
        div.style.display = "block";
    }
}

function showhideCol3MFRate() {
    var div = document.getElementById("idCol3MFRate");
    if (div.style.display !== "none") {
        div.style.display = "none";
    }
    else {
        div.style.display = "block";
    }
}
 $("#idSolveFor").on("change", function () {
        if (this.value == 1) {
            $("#idMaxFlowRate").show();
            $("#idNumOfCoal").hide();
        }
        
    });

    $("#idMaxFlowRate1").on("change", function () {
        if (this.value == 1) {
            $("#idNumOfCoal").show();
            $("#idMaxFlowRate").hide();
            
        }
    });
    
    $("#idTest").on("change", function () {
        if (this.value == 0 || this.value == 1 || this.value == 2 || this.value == 3 || this.value == 4)
        {
            $("#idFluoropolymer").show();
            $("#idSpecifyGravity").hide();
            $("#idSLSTData").show();
            
            
        }
        else
        {
            $("#idFluoropolymer").hide();
            $("#idSpecifyGravity").show();
            $("#idSLSTData").hide();
        }
            
    });

    $("#idNumColSce").on("change", function () {
        if (this.value == 0)
        {
            $("#idPSep").show();
            $("#idProj").show();
        }
        else
        {
            $("#idPSep").hide();
            $("#idProj").hide();
        }

    });