(function() {
  angular
    .module('weMessageApp')
    .controller('conversationCtrl', conversationCtrl);

  conversationCtrl.$inject = ['$scope', '$routeParams', '$socket', '$http', 'constants'];
  function conversationCtrl($scope, $routeParams, $socket, $http, constants) {
    var vm = this;
    // accountid refers to wemessage account id
    // userId refers to temporary id set by web socket
    vm.accountid = $routeParams.accountid;
    vm.userId = vm.userId || localStorage.getItem('userId') || '';
    vm.contact = {
      id: $routeParams.contactid,
      name: $routeParams.contactName,
      shortName: $routeParams.contactName.split(' ')[0]
    };
    vm.threadUrl = constants.apiUrl + '/messages/sender/' + vm.accountid + '/recipient/' + vm.contact.id

    // Store name in localStorage on login, retrieve from localStorage here
    // vm.accountName = localStorage.getItem('accountName');
    vm.accountName = 'Andy'

    vm.alertMessage = '';

    vm.messageThread = [];
    // Get message thread for the logged in account and this contact
    $http({
      method: 'GET',
      url: vm.threadUrl
    })
    .then(function successCallback(response) {
      vm.messageThread = response.data;
      if(vm.messageThread) {
        for(var i = 0; i < vm.messageThread.length; i++) {
          if(vm.messageThread[i].sender_account == vm.accountid) {
            vm.messageThread[i].selfClasses = 'self-sent text-right';
            vm.messageThread[i].showNickname = false;
          } else {
            vm.messageThread[i].showNickname = true;
            vm.messageThread[i].username = vm.contact.shortName;
          }
        }
      }
    }, function errorCallback(response) {
      console.log(response);
    });

    var sortedIds = [vm.accountid, vm.contact.id];
    sortedIds.sort(function(a, b) {
      return a - b;
    });
    vm.roomid = 'convo-' + sortedIds[0] + '-' + sortedIds[1];

    // join socket chatroom with contact
    $socket.emit('join-room', {
      roomid: vm.roomid,
      nickname: vm.accountName,
      conversation: true
    });

    // set user id on connect
    $socket.on('set-id', function(id) {
      vm.userId = id;
      localStorage.setItem('userId', id);
    });

    // display messages as they come in
    $socket.on('chatroom-message', function (data) {
      // get message data from socket event
      var nickname = data.username || vm.nickname || '';
      var message = {
        content: data.message,
        selfClasses: '',
        showNickname: true,
        username: nickname
      };
      // alter layout if message was sent by this user
      if(vm.userId == data.sender) {
        message.selfClasses = 'self-sent text-right';
        message.showNickname = false;
      // alter layout if it's a system message
      } else if(data.sender == 'the socket master') {
        message.selfClasses = 'bold text-center';
        message.showNickname = false;
      }
      // display the message
      vm.messageThread.push(message);
      // scroll to the bottom of the message thread
      // jQuery - because anchorScroll != 'clean'
      $('html, body').animate({
        scrollTop: $('#message-input-anchor').offset().top
      }, 'slow');
    });

    // send message on submit
    vm.sendMessage = function sendMessage() {
      if(vm.messageToSend) {
        $socket.emit('chatroom-message', vm.messageToSend);
        vm.messageToSend = '';
      }
      return false;
    };

  };
})();
