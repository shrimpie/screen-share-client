var video;
var channel = "testchannel";
var userLeft = false;
var roomId = document.getElementById("room-id");
var screenId = document.getElementById("screen-id");
screenId.style.visibility = "hidden";
var joinBtn = document.getElementById('join-room');
var leaveBtn = document.getElementById('leave-room');
var studentId = document.getElementById('student-id');
var message = document.getElementById('message');
joinBtn.disabled = true;
leaveBtn.disabled = true;

var teacherScreenId;

var videosContainer = document.getElementById("videos-container") || document.body;
var roomsList = document.getElementById('rooms-list');
var screensharing = new Screen(channel);
console.log("screensharing: " + JSON.stringify(screensharing));

//var sender = Math.round(Math.random() * 999999999) + 999999999;

var sender = location.hash.replace('#', '');

if(!sender.length) {
    sender = Math.round(Math.random() * 999999999) + 999999999;
    location.href = location.href.split('#')[0] + '#' + sender;
    location.reload();
}

studentId.innerHTML = sender;
var SIGNALING_SERVER = 'http://localhost:9559/';

io.connect(SIGNALING_SERVER).emit('new-channel', {
    channel: channel,
    sender: sender
});

var socket = io.connect(SIGNALING_SERVER + channel);

console.log("screensharing.userid: " + screensharing.userid);

socket.emit('new-student', {
    student: sender
});

socket.on('reenable-join-screen-share', function(data) {
    console.log('got reenable-join-screen-share event, data: ' + JSON.stringify(data));
    if(joinBtn.disabled) {
        joinBtn.disabled = false;
        message.innerHTML = "Message: teacher started screen sharing again.";
    }
});

socket.on('connect', function (data) {
});

socket.send = function (message) {
    socket.emit('message', {
        sender: sender,
        data: message
    });
};
screensharing.openSignalingChannel = function(callback) {
    return socket.on('message', callback);
};
screensharing.onscreen = function(_screen) {
    console.log("onscreen _screen: " + JSON.stringify(_screen));
    // remember teacher screen id
    if(!teacherScreenId) {
        teacherScreenId = _screen.userid;
    }

    if(!userLeft) {
        roomId.innerHTML = _screen.roomid;
        screenId.innerHTML = _screen.userid;
        joinBtn.disabled = false;
        leaveBtn.disabled = true;
    }

    joinBtn.onclick = function() {
        joinBtn.disabled = true;
        leaveBtn.disabled = false;
        userLeft = false;
        var _screen = {
            userid: screenId.innerHTML,
            roomid: roomId.innerHTML
        };
        screensharing.view(_screen);
        socket.emit('join-share-screen', {
            student: sender
        });
    };

    leaveBtn.onclick = function() {
        socket.emit('leave-share-screen', {
            student: sender
        });
        userLeft = true;
        leaveBtn.disabled = true;
        joinBtn.disabled = false;
        screensharing.leave();
        if (video && video.parentNode) {
            video.parentNode.removeChild(video);
        }
    };
};

screensharing.onaddstream = function(media) {
    media.video.id = media.userid;
    video = media.video;
    video.setAttribute('controls', true);
    videosContainer.insertBefore(video, videosContainer.firstChild);
    video.play();
};

screensharing.onuserleft = function(userid) {
    // console.log('self screen userid: ' + screensharing.userid);
    // console.log('onuserleft event userid: ' + userid);
    // console.log('teacherScreenId: ' + teacherScreenId);
    // a student only cares if teacher stopped sharing,
    // he doesn't listen to if other student left.
    if(userid === teacherScreenId) {
        message.innerHTML = "Message: teacher stopped screen sharing.";
        joinBtn.disabled = true;
        leaveBtn.disabled = true;
        var video = document.getElementById(userid);
        if (video && video.parentNode) {
            video.parentNode.removeChild(video);
        } 
    }
};

// check pre-shared screens
screensharing.check();




