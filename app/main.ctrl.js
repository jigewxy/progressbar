
app.controller("mainApp", ["$scope","$http", "$timeout",function($scope, $http, $timeout){

    var _maximum =0;
    var _mode ="";
    var _originValues = [];
    var _barClass = ["bg-info", "bg-primary", "bg-dark", "bg-secondary","bg-success"]; //bar colors
    var _buttonClass = ["btn btn-outline-info", "btn btn-outline-primary", "btn btn-outline-dark", "btn btn-outline-danger", 
                       "btn btn-outline-secondary", "btn btn-success"]; //BUTTON COLORS

   /** __init__ function */
   $scope.init = function(){

       $scope.bars=[];
       $scope.buttons =[];
       $scope.selectOptions=[];
       $scope.selectedBarIndex = null;
       _originValues =[];
       

       _refreshApiData();

   }


   /** refresh data */
   $scope.refreshData = function(){

       _mode="refresh";
       $scope.init();

   }

   $scope.resetCurrentBar = function(){

       var index = $scope.selectedBarIndex;
       if(index === null)
           return
       else
           _updateBar(index, _originValues[index]);

   }


   /** switch bar in SELECT box behavior definition */
   $scope.switchBar = function(input){



       if(_mode=="refresh")  //prevent calling function if it is manual refresh
           return;
       
       if(input!==undefined)
       {
          $scope.barOption ="ProgressBar#"+(input+1);
       }

        var option= $scope.barOption;
        var barIndex = parseInt(option.substring(option.length-1))-1;
        $scope.selectedBarIndex = barIndex;

        angular.element(".progress-bar").removeClass("progress-bar-striped");
        angular.element(".progress-bar").eq(barIndex).addClass("progress-bar-striped");
       

   }

   /** Increase or Decrease bar length when clicking on buttons */
   $scope.alterBar = function(operand){

       console.log(operand);
      var index = $scope.selectedBarIndex;
      var temp = Object.assign({}, $scope.bars[index]);  //deep clone object for backup access
      var newValue = temp.value + operand;
      var newPercentage =  ((newValue/_maximum)*100).toFixed(2)+"%";


      if(newValue<0)
      {
           newValue = 0;
           newPercentage = "0%";
           $scope.bars[index].class = temp.class+" progress-bar-striped";
           PNotify.notice({
               title: "Warning!",
               text: "Value can't be less than 0",
               delay: 2000,
               animation_speed: "slow"
             });
      }
      else if(newValue >=_maximum)
          { 
           $scope.bars[index].class = "bg-danger progress-bar-striped progress-bar-animated";
           PNotify.notice({
               title: "Warning!",
               text: "Value exceeds maximum limit",
               delay: 2000,
               animation_speed: "slow"
             });
           }
      else
           $scope.bars[index].class = _barClass[index]+" progress-bar-striped";
       

      _updateBar(index, newValue);

      /* $scope.bars[index] = Object.assign($scope.bars[index], { value: newValue,
                                                               percent: newPercentage,
                                                               style:{"width": newPercentage, "height":"30px"},
                                                            });*/
       
   }


   /**export HTML as PNG image */
   $scope.saveAsImg = function(){

       html2canvas(document.querySelector("#mainContainer"), {
                       logging:true,
                       imageTimeout: 10000,
               }).then(function(canvas) {
               
               canvas.toBlob(function(blob){

                   saveAs(blob, "barpicture.png");
                     /*  var url = window.URL.createObjectURL(blob);
                       var a = document.createElement("a");
                       a.href =url;
                       a.target="_blank";
                       a.click();
                       window.URL.revokeObjectURL(url);*/
               }, "image/png", 1);
                   

       });

   }

   /** Update Bar on new value */
   function _updateBar(index, newValue){

       if( $scope.bars[index].value == newValue)
           return;
       else
       {
          var newPercentage =  ((newValue/_maximum)*100).toFixed(2)+"%";
          
          if(newValue>=_maximum)
              $scope.bars[index].class = "bg-danger progress-bar-striped progress-bar-animated";
           else 
              $scope.bars[index].class = _barClass[index]+" progress-bar-striped";

           $scope.bars[index] = Object.assign($scope.bars[index], { value: newValue,
               percent: newPercentage,
               style:{"width": newPercentage, "height":"30px"},
           });
       }

   }

  /** HTTP caller */
   function _refreshApiData(){

       $http.get("http://pb-api.herokuapp.com/bars").then(function(response){

           var resp = response.data;
           _maximum = resp.limit;  //update maximum limit

           console.log(resp);
           
           resp.buttons.forEach(function(iter, i){

               $scope.buttons.push({
                                   increment: iter,
                                   btnClass: _buttonClass[i]
                                   });

           });

           resp.bars.forEach(function(iter,i){
               
               _originValues.push(iter);
               var percentage =  ((iter/resp.limit)*100).toFixed(2)+"%";

               $scope.bars.push({
                               value: iter,
                               percent: percentage,
                               style: {"width": percentage, "height":"30px"},
                               class: _barClass[i]
                             
                            });

               $scope.selectOptions.push("ProgressBar#"+(i+1));
               
           });

           $scope.barOption = "ProgressBar#1";
           $timeout(function(){$scope.switchBar();}, 0); //wait for the previous digest cycle completion
           _mode=""; //reset _mode
           
       });

   }



}]);

