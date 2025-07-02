    var DebugController = {};


    DebugController.baseUrl;
    DebugController.connectId;
    DebugController.sessionId;
    DebugController.staticData;

    DebugController.states = [];

    DebugController.connect = function () {
        Five9Common.debug("connect");
        DebugController.sendAPIRequest(DebugController.baseUrl + "connect_session/" + DebugController.connectId, "GET", null, null, null, DebugController.onInit, DebugController.onError);
        //url, method, headers, etag, data, callback
    }

    DebugController.getUpdate = function (){
        DebugController.sendAPIRequest(DebugController.baseUrl + "get_update/" + DebugController.sessionId, "GET", null, null, null, DebugController.onUpdate, DebugController.onError);
    }

    DebugController.getStaticData = function () {
        Five9Common.debug("get_static_data");
        DebugController.sendAPIRequest(DebugController.baseUrl + "get_static_data/" + DebugController.sessionId, "GET", null, null, null, DebugController.onGetStaticData, DebugController.onError);
        //url, method, headers, etag, data, callback
    }

    DebugController.disconnect = function () {
        Five9Common.debug("disconnect");
        navigator.sendBeacon(DebugController.baseUrl + "disconnect/" + DebugController.sessionId);
    }

    DebugController.onInit = function (data) {
        DebugUI.displayStatus();
        Five9Common.debug("onInit", data);
        var response = JSON.parse(data);
        if (response && response.sessionId) {
            DebugController.sessionId = response.sessionId;
            Five9Common.debug("onInit set ", DebugController.sessionId);
        }
        DebugController.getUpdate();
    }

    DebugController.onUpdate = function (data) {
        if (data && !$.isEmptyObject(data)) {
            if(data.isEnd){
                Five9Common.debug("Session ended");
                return;
            }
            Five9Common.debug("data for module: " + data.executorState.moduleName);
            DebugController.addState(data);
            if(!DebugController.staticData){
                DebugController.getStaticData();
            }
            DebugController.getUpdate();
        } else {
            DebugUI.displayStatus();
            setTimeout(DebugController.getUpdate, 1000);
        }
    }

    DebugController.onError = function (request, description, shortDescription) {
        Five9Common.debug(description);
        var response = JSON.parse(description);
        if(response){
            DebugUI.displayError( response.reason);
        }
    }

    DebugController.onGetStaticData = function (data) {
        if (data && !$.isEmptyObject(data)) {
            if(!DebugController.staticData){
                DebugController.staticData = data;
                DebugUI.notifyStaticData(DebugController.staticData);
            }
        } else {
            Five9Common.debug("Empty static data received");
            DebugController.getStaticData();
        }
    }



    /**
     * Sends AJAX request to server
     *
     * @param url to which request should be send
     * @param method which should be used in request
     * @param data which should be passed in a body
     * @param headers to be set for request
     * @param etag to be used in precondition header
     * @param callback to be called when operation is finished
     */
    DebugController.sendAPIRequest = function (url, method, headers, etag, data, successCB, errorCB) {

        var request = {
            type: method,
            url: url,
            cache: false,
            contentType: "application/json; charset=utf-8",
            data: JSON.stringify(data),
        };

        request.success = function(response, result, xhr) {
            if (typeof successCB != 'undefined') {
                successCB(response, result, xhr);
            }
        };

        request.error = function(request, textStatus, errorDescription) {
            if (typeof errorCB != 'undefined') {
                var description = null;
                if(request.status === 500 && request.responseText) {
                    description = request.responseText;

                }
                errorCB(request, description, errorDescription);
            }
        };

        headers = headers || {};
        request.headers = headers;

        if (etag != null) {
            request.headers['If-Match'] = etag;
        }
        $.ajax(request);
    };

    DebugController.addState = function(state, index){
        var len = DebugController.states.length;
        if(index === undefined){
            index = len;
        }

        DebugController.states.splice(index, 0, state);
        DebugUI.notifyStateListener(index);
    }

    DebugController.initBaseUrl = function(){
        if(!DebugController.baseUrl){
            var path = location.pathname;
            var lastIdex = path.lastIndexOf('/index.html');
            var firstIndex = path.lastIndexOf('/', lastIdex - 1) + 1;
            var domainId = path.substr(firstIndex, lastIdex - firstIndex);

            DebugController.baseUrl = window.location.origin + '/ivr/debug/'+domainId+'/';
            Five9Common.debug("baseUrl = " + DebugController.baseUrl);
        }

        if(!DebugController.connectId){
            var url = new URL(window.location.href);
            DebugController.connectId = url.searchParams.get("id");
            Five9Common.debug("Connect id = " + DebugController.connectId);
        }

    }

    DebugController.onClosingTab = function(state, index){
        DebugController.disconnect();
    }

    DebugController.saveToFile = function download(filename) {
        var element = document.createElement('a');
        element.setAttribute('href', 'data:text/plain;charset=utf-8,' + encodeURIComponent(JSON.stringify(DebugController.states)));
        element.setAttribute('download', filename);

        element.style.display = 'none';
        document.body.appendChild(element);

        element.click();

        document.body.removeChild(element);
    }

    $( document ).ready(function() {
        DebugController.initBaseUrl();
        DebugController.connect();
        $(window).on('beforeunload', DebugController.onClosingTab);
    });
