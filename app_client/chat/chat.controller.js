(function() {
  angular
    .module('weMessageApp')
    .controller('chatCtrl', chatCtrl);

  chatCtrl.$inject = ['$scope', '$socket', '$uibModal'];
  function chatCtrl($scope, $socket, $uibModal) {
    var vm = this;
    vm.alertMessage = '';
    vm.messageThread = [];
    vm.userId = '';

    // set user id on connect
    $socket.on('set-id', function(data) {
      vm.userId = data;
    });

    // display messages as they come in
    $socket.on('chatroom-message', function (data) {
      var message = {
        content: data.message,
        selfClasses: '',
        showNickname: true,
        username: data.username
      };
      if(vm.userId == data.sender) {
        message.selfClasses = 'self-sent text-right';
        message.showNickname = false;
      }
      vm.messageThread.push(message);

      $('html, body').animate({
        scrollTop: $('#message-input-anchor').offset().top
      }, 'slow');
    });

    // send message on submit
    vm.sendMessage = function sendMessage() {
      if(vm.messageToSend && vm.messageToSend != '') {
        $socket.emit('chatroom-message', vm.messageToSend);
        vm.messageToSend = '';
      }
      return false;
    };

    vm.chatNicknamePopup = function() {
      var modalInstance = $uibModal.open({
        backdrop: 'static',
        keyboard: false,
        templateUrl: '/chatNickname/chatNickname.view.html',
        controller: 'chatNicknameCtrl as vm'
      });
      modalInstance.result.then(function(name) {
        vm.alertMessage = 'Your nickname was set to ' + name + '.';
      });
    };

    vm.chatNicknamePopup();

    // echo-ack, not currently in use
    vm.sendMessageACK = function sendMessageACK() {
      $socket.emit('echo-ack', vm.dataToSend, function (data) {
          vm.serverResponseACK = data;
      });
      vm.dataToSend = '';
    };

  };
})();
