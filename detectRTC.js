// todo: need to check exact chrome browser because opera also uses chromium framework
var isChrome = !!navigator.webkitGetUserMedia;

console.log("isChrome: " + isChrome);

var DetectRTC = {};

(function () {

    var screenCallback;

    DetectRTC.screen = {
        chromeMediaSource: 'screen',
        getSourceId: function(callback) {
            if(!callback) throw '"callback" parameter is mandatory.';
            screenCallback = callback;
            window.postMessage('get-sourceId', '*');
        },
        isChromeExtensionAvailable: function(callback) {
            if(!callback) return;

            console.log("isChromeExtensionAvailable callback: " + JSON.stringify(callback));
            if(DetectRTC.screen.chromeMediaSource == 'desktop') return callback(true);

            // ask extension if it is available
            window.postMessage('are-you-there', '*');

            setTimeout(function() {
                if(DetectRTC.screen.chromeMediaSource == 'screen') {
                    callback(false);
                }
                else callback(true);
            }, 2000);
        },
        onMessageCallback: function(data) {
            if (!(typeof data == 'string' || !!data.sourceId)) return;

            console.log('chrome message', data);

            // "cancel" button is clicked
            if(data == 'PermissionDeniedError') {
                DetectRTC.screen.chromeMediaSource = 'PermissionDeniedError';
                if(screenCallback) return screenCallback('PermissionDeniedError');
                else throw new Error('PermissionDeniedError');
            }

            // extension notified his presence
            if(data == 'rtcmulticonnection-extension-loaded') {
                if(document.getElementById('install-button')) {
                    document.getElementById('install-button').parentNode.innerHTML = '<strong>Great!</strong> <a href="https://chrome.google.com/webstore/detail/screen-capturing/ajhifddimkapgcifgcodmmfdlknahffk" target="_blank">Google chrome extension</a> is installed.';
                }
                DetectRTC.screen.chromeMediaSource = 'desktop';
            }

            // extension shared temp sourceId
            if(data.sourceId) {
                DetectRTC.screen.sourceId = data.sourceId;
                if(screenCallback) screenCallback( DetectRTC.screen.sourceId );
            }
        },
        getChromeExtensionStatus: function (callback) {
            if (!!navigator.mozGetUserMedia) return callback('not-chrome');
            console.log("!!!! getChromeExtensionStatus begin");

            var extensionid = 'ajhifddimkapgcifgcodmmfdlknahffk';
            var image = document.createElement('img');
            image.src = 'chrome-extension://' + extensionid + '/icon.png';
            image.onload = function () {
                console.log("image onload begins");
                DetectRTC.screen.chromeMediaSource = 'screen';
                window.postMessage('are-you-there', '*');
                setTimeout(function () {
                    if (!DetectRTC.screen.notInstalled) {
                        callback('installed-enabled');
                    }
                }, 2000);
            };
            image.onerror = function () {
                DetectRTC.screen.notInstalled = true;
                callback('not-installed');
            };
            console.log("!!!! getChromeExtensionStatus end");
        }
    };
    // check if desktop-capture extension installed.
    if(window.postMessage && isChrome) {
        // currently isChromeExtensionAvailable needs a callback to be passed in,
        // otherwise, it'll just return
        DetectRTC.screen.isChromeExtensionAvailable();
    }
})();

DetectRTC.screen.getChromeExtensionStatus(function(status) {
    if(status == 'installed-enabled') {
        if(document.getElementById('install-button')) {
            document.getElementById('install-button').parentNode.innerHTML = '<strong>Great!</strong> <a href="https://chrome.google.com/webstore/detail/screen-capturing/ajhifddimkapgcifgcodmmfdlknahffk" target="_blank">Google chrome extension</a> is installed.';
        }
        DetectRTC.screen.chromeMediaSource = 'desktop';
    }
});

window.addEventListener('message', function (event) {
    if (event.origin != window.location.origin) {
        return;
    }
    DetectRTC.screen.onMessageCallback(event.data);
});

console.log('current chromeMediaSource', DetectRTC.screen.chromeMediaSource);



