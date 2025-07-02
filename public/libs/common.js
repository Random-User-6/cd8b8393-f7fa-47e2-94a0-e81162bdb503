
var Five9Common = {};

/**
 * Prints debug messages to console if available
 */
Five9Common.debug = function() {
    if (typeof window.console != 'undefined') {
        if(window.console.log.apply) {
            window.console.log.apply(window.console, arguments);
        } else {
            if(!Five9Common.log) {
                Five9Common.log = Function.prototype.bind.call(console.log, console);
            }
            Five9Common.log.apply(window.console, arguments);
        }
    }
};


/**
 * Validates value according to type specific rules
 *
 * @param val
 * @param restrictions
 * @returns {*}
 */
Five9Common.validateInput = function(val, restrictions) {
    var response = {};
    val = val.trim();
    if (typeof restrictions == 'undefined') {
        var restrObj = {"type": "undefined"};
    } else if (typeof restrictions == 'string') {
        restrObj = JSON.parse(restrictions);
    } else if (typeof response == 'object') {
        restrObj = restrictions;
    } else {
        throw "Unexpected response";
    }

    switch (restrObj.type) {
        case "ccexpdate":

            var ref_year = parseInt(restrObj.reference_date.substr(0, 4));
            var ref_month = parseInt(restrObj.reference_date.substr(4, 2));
            var year = parseInt(val.substr(0, 4));
            var month = parseInt(val.substr(4, 2));
            var max_allowed = parseInt(restrObj.maxallowed);

            var selected_ccexp_date = (year - ref_year) * 12 + month - ref_month;

            if (selected_ccexp_date > max_allowed) {
                response.error = Five9Common.getString("five9-ln-str-input-exp-date-format");
            } else if (selected_ccexp_date < 0) {
                response.error = Five9Common.getString("five9-ln-str-input-exp-date-in-past");
            } else {
                response.valFormatted = val;
            }
            break;
        case "time":
            var timePat = /^(\d{1,2}):(\d{2})(\s?(AM|am|PM|pm))?$/;

            var matchArray = val.match(timePat);
            if (matchArray == null) {
                response.error = Five9Common.getString("five9-ln-str-input-time-format");
                break;
            }
            var hour = parseInt(matchArray[1]);
            var minute = parseInt(matchArray[2]);
            var ampm = matchArray[4];

            hour += (ampm == "PM" || ampm == "pm")? 12: 0;
            if (ampm == "") { ampm = null }

            if (hour < 0  || hour > 23) {
                response.error = Five9Common.getString("five9-ln-str-input-hours-format");
                break;
            }
            if (minute < 0 || minute > 59) {
                response.error = Five9Common.getString("five9-ln-str-input-minutes-format");
                break;
            }
            var t = hour * 100 + minute;
            if (t < parseInt(restrObj.range.minvalue) || t > parseInt(restrObj.range.maxvalue)) {
                response.error = Five9Common.getString("five9-ln-str-input-time-range-format",
                    restrObj.range.minvalue, restrObj.range.maxvalue);
                break;
            }

            response.valFormatted = (hour<10? "0":"") + hour + (minute<10? ":0": ":") + minute;
            break;
        case "phone":
        	if(restrObj["is_e164"] && restrObj["is_e164"] === "true"){
                var phonePat = new RegExp("^\\+" + restrObj["country_code"] + "\\d{7,14}$");
                var intPhonePat = /^\+\d{10,15}$/;
            } else {
                var phonePat = /^\(?([0-9]{3})\)?[-. ]?([0-9]{3})[-. ]?([0-9]{4})$/;
                var intPhonePat = /^011\d{7}\d*$/;
            }

        	if(phonePat.test(val) || restrObj["allow_international"] == "true" && intPhonePat.test(val)){
        		response.valFormatted = val.replace(/\D/g,'');
        	} else {
        		response.error = Five9Common.getString("five9-ln-str-input-phone-format");
        	}
            break;
        case "phoneInputGrammar":
        	if (restrObj["is_e164"] && restrObj["is_e164"] === "true") {

                var patternE164 = /^\+\d{10,15}$/;
                if (patternE164.test(val)) {
                    response.valFormatted = val;
                    break;
                }

                if (restrObj["language"] == "en-GB") {
                    //test when local code "0" present 
                    var phonePatGB = /^(\(?0[1-9]\d{3}\)?[-. ]?\d{3}[-. ]?\d{3})$|^(\(?0[1-9]\d{2}\)?[-. ]?\d{3}[-. ]?\d{4})$|^(\(?0[1-9]\d\)?[-. ]?\d{4}[-. ]?\d{4})$/;
                    if (phonePatGB.test(val)) {
                        response.valFormatted = (val.replace(/\D/g,'')).replace(/^0/g,'+44');
                        break;
                    }

                    //test when there is no local code 
                    phonePatGB = /^(\(?[1-9]\d{3}\)?[-. ]?\d{3}[-. ]?\d{3})$|^(\(?[1-9]\d{2}\)?[-. ]?\d{3}[-. ]?\d{4})$|^(\(?[1-9]\d\)?[-. ]?\d{4}[-. ]?\d{4})$/;
                    if (phonePatGB.test(val)) {
                        response.valFormatted = '+44' + (val.replace(/\D/g,''));
                        break;
                    }

                    var intPhonePatGB = /^00\d{7}\d*$/;
                    if (intPhonePatGB.test(val)) {
                        response.valFormatted = val.replace(/^00/g,'+');
                        break;
                    }
                } else {
                    var phonePatUS = /^\(?([0-9]{3})\)?[-. ]?([0-9]{3})[-. ]?([0-9]{4})$/;
                    if (phonePatUS.test(val)) {
                        response.valFormatted = '+1' + val.replace(/\D/g,'');
                        break;
                    }

                    var intPhonePatUS = /^011\d{7}\d*$/;
                    if (intPhonePatUS.test(val)) {
                        response.valFormatted = val.replace(/^011/g,'+');
                        break;
                    }
                }
        	} else {
                var pattern = /^(\(?([0-9]{3})\)?[-. ]?([0-9]{3})[-. ]?([0-9]{4}))$|^(011\d{7}\d*)$/;
                if (pattern.test(val)) {
                    response.valFormatted = val.replace(/\D/g,'');
                    break;
                }
        	}
            
        	response.error = Five9Common.getString("five9-ln-str-input-phone-format");
        	break;
        case "zipCode":
            if (/(^\d{5}$)|(^\d{5}-\d{4}$)/.test(val)) {
                response.valFormatted = val;
            } else {
                response.error = Five9Common.getString("five9-ln-str-input-zip-format");
            }
            break;
        case "socialsecurity":
            if (/^\d{3}-?\d{2}-?\d{4}$/.test(val)) {
                response.valFormatted = val;
            } else {
                response.error = Five9Common.getString("five9-ln-str-input-social-format");
            }
            break;
        case "currency":
            if (/^\$?((\d{1,3},(\d{3},)*\d{3})|\d+)(\.\d{2})?$/.test(val)) {
                var d = parseFloat(val.replace(/[,\$\s]/g, ''));
                if (d < parseFloat(restrObj.range.minvalue) || d > parseFloat(restrObj.range.maxvalue)) {
                    response.error = Five9Common.getString("five9-ln-str-input-time-range-format",
                        restrObj.range.minvalue,
                        restrObj.range.maxvalue);
                } else {
                    response.valFormatted = d;
                }
            } else {
                response.error = Five9Common.getString("five9-ln-str-input-currency-format");
            }
            break;
        case "creditcard":
            if (/^(?:\d[ -]?){12,18}\d$/.test(val)) {
                response.valFormatted = val.replace(/[-\s]/g, '');
            } else {
                response.error = Five9Common.getString("five9-ln-str-input-card-format");
            }
            break;
        case "digits":   // it is just a string!
            if (val.length < restrObj.range.minlength || val.length > restrObj.range.maxlength) {
                response.error = Five9Common.getString("five9-ln-str-input-digit-range-format",
                    restrObj.range.minlength,
                    restrObj.range.maxlength);
            } else {
                response.valFormatted = val;
            }
            break;
        case "integer":
            if (val.length < restrObj.range.minlength || val.length > restrObj.range.maxlength) {
                response.error = Five9Common.getString("five9-ln-str-input-digit-range-format",
                    restrObj.range.minlength,
                    restrObj.range.maxlength);
            } else if (/^[-+]?\d+$/.test(val)!=true) {
                response.error = Five9Common.getString("five9-ln-str-input-numeric-format");
                break;
            } else {
                response.valFormatted = val;
            }
            break;
        case "date":
            var month = 0;
            var day = 0;
            var year = 0;
            var datePat = /^(\d{1,2})(\/|-)(\d{1,2})(\/|-)(\d{4})$/;
            var matchArray = val.match(datePat);

            if (matchArray == null) {
                datePat = /^(\d{4})-(\d{1,2})-(\d{1,2})$/;
                matchArray = val.match(datePat);
                if (matchArray == null) {         
                    response.error = Five9Common.getString("five9-ln-str-input-date-format");
                    break;
                }
                month = parseInt(matchArray[2]);
                day = parseInt(matchArray[3]);
                year = parseInt(matchArray[1]);
            } else {
                month = parseInt(matchArray[1]);
                day = parseInt(matchArray[3]);
                year = parseInt(matchArray[5]);
            }

            if (month < 1 || month > 12) {
                response.error = Five9Common.getString("five9-ln-str-input-months-format");
                break;
            }
            if (day < 1 || day > 31) {
                response.error = Five9Common.getString("five9-ln-str-input-days-format");
                break;
            }
            if ((month==4 || month==6 || month==9 || month==11) && day==31) {
                response.error = Five9Common.getString("five9-ln-str-input-month-format", month);
                break;
            }
            if (month == 2) {
                var isleap = (year % 4 == 0 && (year % 100 != 0 || year % 400 == 0));
                if (day > 29 || (day==29 && !isleap)) {
                    response.error = Five9Common.getString("five9-ln-str-input-february-format", year, day);
                    break;
                }
            }
            var d = year*10000 + month*100 + day;
            if (d < parseInt(restrObj.range.minvalue) || d > parseInt(restrObj.range.maxvalue)) {
                response.error = Five9Common.getString("five9-ln-str-input-exp-date-between",
                    restrObj.range.minvalue.substr(4,2), restrObj.range.minvalue.substr(6), restrObj.range.minvalue.substr(0,4), 
                    restrObj.range.maxvalue.substr(4,2), restrObj.range.maxvalue.substr(6), restrObj.range.maxvalue.substr(0,4)); 
                break;
            }

            response.valFormatted = year + (month < 10? "-0":"-") + month + (day < 10? "-0":"-") +day;
            break;
        case "number":
            var deciPat = /^[-+]?\d+(\.\d+)?$/;
            if(deciPat.test(val)!=true){
                response.error = Five9Common.getString("five9-ln-str-input-numeric-format");
                break;
            }

            var numericPat = /^[-+]?\d+(\.\d{1,5})?$/;
            if(numericPat.test(val)!=true){
                response.error = Five9Common.getString("five9-ln-str-input-max-fraction");
                break;
            }

            var d = parseFloat(val);
            if (d < parseFloat(restrObj.range.minvalue) || d > parseFloat(restrObj.range.maxvalue)) {
                response.error = Five9Common.getString("five9-ln-str-input-time-range-format",
                    restrObj.range.minvalue,
                    restrObj.range.maxvalue);
            } else {
                response.valFormatted = d;
            }
            break;
        case "currency_without_cents":
            if (/^((\d{1,3},(\d{3},)*\d{3})|\d+)$/.test(val)) {
                var d = parseFloat(val.replace(/[,\$\s]/g, ''));
                if (d < parseFloat(restrObj.range.minvalue) || d > parseFloat(restrObj.range.maxvalue)) {
                    response.error = Five9Common.getString("five9-ln-str-input-time-range-format",
                        restrObj.range.minvalue,
                        restrObj.range.maxvalue);
                } else {
                    response.valFormatted = d;
                }
            } else {
                response.error = Five9Common.getString("five9-ln-str-input-currency-format");
            }
            break;
        case "alphanum":
        	var pureValue = val.replace(/_/gi,'');
        	pureValue = pureValue.replace(/-/gi,'');
        	pureValue = pureValue.replace(/ /gi,'');
        	if (!/^\w+$/.test(pureValue) || pureValue.length > 20) {
        		response.error = Five9Common.getString("five9-ln-str-input-incorrect-value");
        	} else {
        		response.valFormatted = pureValue;
        	}
        	break;
        default:
            response.valFormatted = val;
            break;
    }
    return response;
};

/**
 * Simple API request without ETag and header options
 * @param url
 * @param method
 * @param data
 * @param callback
 */
Five9Common.callAPI = function(url, method, data, callback)
{
    Five9Common._sendAPIRequest(url, method, null, null, data, callback);
};

/**
 * API Request with ETag precondition
 *
 * @param url
 * @param method
 * @param etag
 * @param data
 * @param callback
 */
Five9Common.callAPIWithCondition = function(url, method, etag, data, callback)
{
    Five9Common._sendAPIRequest(url, method, null, etag, data, callback);
};

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
Five9Common._sendAPIRequest = function(url, method, headers, etag, data, callback) {

    var request = {
        type: method,
        url: url,
        cache: false,
        contentType: "application/json; charset=utf-8",
        data: JSON.stringify(data)
    };

    headers = headers || {};
    request.headers = headers;

    if (etag != null) {
        request.headers['If-Match'] = etag;
    }

    request.success = function(response, result, xhr) {
        var api_response = Five9Common._parseAPIResponse(response, result);
        if (typeof callback != 'undefined') {
            callback(api_response.error, api_response.data, xhr);
        }
    };

    request.error = function (request,error, xhr) {
        if (typeof callback != 'undefined') {
            callback(error, null, xhr);
        }
    };

    $.ajax(request);
};


Five9Common._sendSyncAPIRequest = function(path, method){
    var result = $.ajax({
        url: path,
        type: method,
        async: false,
        cache: false,
        contentType: "application/json; charset=utf-8",
        });
    
    return result.responseText;
};

Five9Common._parseAPIResponse = function(response, result)
{
    var api_response = {
            error: null,
            data: null
        };

    if (result == 'success') {
        var obj = null;
        if (typeof response == 'string') {
            obj = JSON.parse(response);
        } else if (typeof response == 'object') {
            obj = response;
        } else {
            throw "Unexpected response";
        }

        if (obj.error != null) {
            api_response.error = obj.error;
        } else {
            api_response.data = obj.count == 0 ? [] :  obj.items;
        }

    } else {
        api_response.data = '__nocontent__';
    }

    return api_response;
};

Five9Common._parseError = function(response) {
    if ((response) && (typeof response.responseText != 'undefined' )) {
        var response = JSON.parse(response.responseText);
        return response.error;
    } else {
        return {code: 500, message: "unknown error"};
    }
};


Five9Common.View = function(app, pageId) {

    this.pageId = pageId;
    this.app = app;
    this.page = $(pageId);
    this.viewShownCallbacks = $.Callbacks();
    this.prototype = Five9Common.View.prototype;

    return this;
};

Five9Common.getString = function() {
    var parameters = Array.prototype.slice.call(arguments, 0);
    var id = parameters[0];
    var args = parameters.slice(1);


    $("#locales").removeClass().addClass(id);
    
    var str = window.getComputedStyle(document.querySelector('.'+id), ':after').getPropertyValue('content');

    if(str){
        str = str.substr(1, (str.length-2));
    } else {
        Five9Common.debug("Unknown string id:" + id );
        return "";
    }

    return str.replace(/{(\d+)}/g, function(match, number) {
        return typeof args[number] != 'undefined'
            ? args[number]
            : match
            ;
    });


}

Five9Common.View.prototype = {

    show: function() {
        Five9Common.debug("going to change page: ", this.page, this);

        var currentView = this.app.getActivePage();
        if (currentView.hasOwnProperty("destroy")) {
            currentView.destroy();
        }

        $(document).pagecontainer("change", this.page, {transition: "slide"});

        var view = this;
        function wrapEventHandler(view, eventHandlerName)
        {
            return function(event) {
                var eventHandler = view[eventHandlerName];
                eventHandler.call(view, this, event);
            };
        }

        // apply events
        for (var eventSelector in this.events) {

            if (this.events.hasOwnProperty(eventSelector)){
                var eventHandlerName = this.events[eventSelector];

                var parsedSelector = eventSelector.split(' ');
                Five9Common.debug("binding event: ", parsedSelector[0], parsedSelector[1], eventHandlerName, view.getActivePage().find(parsedSelector[0]).length);
                view.getActivePage().find(parsedSelector[0]).bind(parsedSelector[1],wrapEventHandler(view, eventHandlerName));
            }
        }

        view.viewShownCallbacks.fireWith(view,[]);
    },

    destroy: function() {},

    getActivePage: function() {
        return this.app.getActivePage();
    },

    showValidationError: function(fieldObj, errorTxt) {
        if (typeof fieldObj != 'undefined') {
            var pos = fieldObj.position();
            $('<div />')
                .html(errorTxt)
                .css({
                    top: pos.top + fieldObj.height()  + 1,
                    left: pos.left,
                    width: Five9Ivr._errmsg_width,
                    position: 'absolute',
                    'background-color': Five9Ivr._errmsg_bg_color
                }).insertAfter(fieldObj).attr('id', 'err' + fieldObj.attr("id"));
            setTimeout(function() {
                $('#err' + fieldObj.attr("id")).fadeOut().empty();
            }, 2500);
        }
    }

};

Five9Common.MobileApp = function() {

    this.prototype = Five9Common.MobileApp.prototype;

    this.idleTimerCallbacks = $.Callbacks("stopOnFalse");
    return this;
};

Five9Common.MobileApp.prototype = {

    start: function() {
        Five9Common.debug("Starting mobile application");
        $(document).pagecontainer({ defaults: true });
    },

    init: function() {},

    getActivePage: function() {
        return $(document).pagecontainer("getActivePage");
    },

    startStopIdleTimer: function(startOrStop) {
        var app = this;

        var idleTime = 0;
        var idleTimerInterval = 10000;

        function resetIdleTime() {
            idleTime = 0;
            app.idleTimerCallbacks.fireWith(app, [idleTime, 'reset']);
        }

        if (startOrStop == 'start') {

            if (typeof app._idleTimer != 'undefined' || app._idleTimer != null) {
                Five9Common.log("Warning: double idle timer start");
                return;
            }
            app._idleTimer = window.setInterval(function(){
                idleTime += idleTimerInterval;
                app.idleTimerCallbacks.fireWith(app, [idleTime, 'tick']);
            }, idleTimerInterval);


            $(document).mousemove(resetIdleTime);
            $(document).keypress(resetIdleTime);

        } else {
            window.clearInterval(app._idleTimer);
            app._idleTimer = null;
            $(document).off("mousemove", resetIdleTime);
            $(document).off("keypress",  resetIdleTime);

        }
    },
    addIdleTimerCallback: function (callback) {
        this.idleTimerCallbacks.add(callback);
    },

    removeIdleTimerCallback: function(callback) {
        this.idleTimerCallbacks.remove(callback);
    }

};

Five9Common.ie_init = function(){
    if (!Array.prototype.includes) {
      Array.prototype.includes = function(search, start) {
        'use strict';
        if (typeof start !== 'number') {
          start = 0;
        }
        
        if (search === undefined || (start + search.length > this.length)) {
          return false;
        } else {
          return this.indexOf(search, start) !== -1;
        }
      };
    }
};

Five9Common.ie_init();
