var videosContainer = document.getElementById("videos-container") || document.body;
var roomsList = document.getElementById('rooms-list');
var studentList = document.getElementById('student-list');
var roomId = document.getElementById('room-id');
roomId.defaultValue = "testroomid";

var channel = "testchannel";
var screensharing = new Screen(channel);
console.log("screensharing: " + JSON.stringify(screensharing));

var sender = Math.round(Math.random() * 999999999) + 999999999;
var SIGNALING_SERVER = 'http://localhost:9559/';

io.connect(SIGNALING_SERVER).emit('new-channel', {
    channel: channel,
    sender: sender
});
var socket = io.connect(SIGNALING_SERVER + channel);

var students = new Set();
var studentsStatus = {};

socket.on('connect', function () {
    // setup peer connection & pass socket object over the constructor!
});

// now lets make it sharing only single video.
var video;

var shareFirstTime = true;

// testing start here
socket.on('new-student', function(data) {
    // add new students to list
    console.log('get student data: ' + JSON.stringify(data));
    if(!students.has(data.student)) {
        students.add(data.student);
        var stu = document.createElement('li');
        stu.id = data.student;
        stu.innerHTML = "Student screen id: " + data.student;
        studentList.appendChild(stu);
    }
});

socket.on('join-share-screen', function(data) {
    console.log(data.student + " joined the share screen");
    if(!(data.student in studentsStatus) || !studentsStatus[data.student]) {
        studentsStatus[data.student] = true;
        var stu = document.getElementById(data.student);
        stu.innerHTML = "Student id: " + data.student + " joined."
    }
});

socket.on('leave-share-screen', function(data) {
    console.log(data.student + " left the share screen");
    if(data.student in studentsStatus) {
        studentsStatus[data.student] = false;
        var stu = document.getElementById(data.student);
        stu.innerHTML = "Student id: " + data.student + " left."
    }
});

// testing end here

socket.send = function (message) {
    socket.emit('message', {
        sender: sender,
        data: message
    });
};
screensharing.openSignalingChannel = function(callback) {
    return socket.on('message', callback);
};

// onaddstream happens when a teacher starts to share his screen
screensharing.onaddstream = function(media) {
    media.video.id = media.userid;
    video = media.video;
    video.setAttribute('controls', true);
    videosContainer.insertBefore(video, videosContainer.firstChild);
    video.play();
    if(!shareFirstTime) {
        console.log('sharing again');
        socket.emit('teacher-share-screen-again', {
            message: 'testing'
        });
    }
};

// if someone leaves; just remove his screen
screensharing.onuserleft = function(userid) {
    var video = document.getElementById(userid);
    if (video && video.parentNode) video.parentNode.removeChild(video);
};

screensharing.check(); // check pre-shared screens

var startShareBtn = document.getElementById('share-screen');
var endShareBtn = document.getElementById('end-share');


startShareBtn.onclick = function() {
    roomId.disabled = this.disabled = true;
    screensharing.isModerator = true;
    screensharing.userid = roomId.value;
    screensharing.share();
    endShareBtn.disabled = false;
    if(shareFirstTime) {
        shareFirstTime = false;
    }
};
endShareBtn.disabled = true;
endShareBtn.onclick = function() {
    console.log("screensharing userid: " + screensharing.userid);
    this.disabled = true;
    startShareBtn.disabled = false;
    screensharing.leave();

    if(video) {
        videosContainer.removeChild(video);
        video = null;
    }
};

screensharing.onNumberOfParticipantsChnaged = function(numberOfParticipants) {
    if(!screensharing.isModerator) return;
    document.title = numberOfParticipants + ' users are viewing your screen!';
};




