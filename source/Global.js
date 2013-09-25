/* Hate globals, but sometimes its just too tempting than trying to figure out the cross component calling */

var Global = {};
Global.logging = true;

Global.amtrakThis = "";
Global.routeThis = "";
Global.routeListThis = "";

Global.helpSite = "http://translunardesigns.com/amtrak.html";
Global.stateAddressPrefix = "http://www.amtrak.com/html/stations_";

Global.routeKey = "amtrak.route";
Global.routeDataList = [];

Global.preferenceKey = "amtrak.prefs";
Global.preference = {};

Global.departure = "";
Global.destination = "";
Global.departureSymbol = "";
Global.destinationSymbol = "";
Global.departureState = "";
Global.destinationState = "";
Global.toStations = [];
Global.fromStations = [];
Global.routeScheduleResults = [];
Global.routeScheduleResultsPos = 0;
Global.inProcessSched = false;
Global.inProcess = false;
Global.counter = -1;

Global.useCurrentTime = true;
Global.dayArg = '';
Global.monthArg = '';
Global.yearArg = '';
Global.hourArg = '';
Global.minuteArg = '0';

Global.log = function(str) {
	if (Global.logging) {
		enyo.log(str);
	}
};

Global.getStateList = function(onclickVal) {
	var stateArr = [];
	for (i in Global.addressList) {
		stateArr.push({kind:"MenuItem", onclick:"Global.toSelected", value:Global.addressList[i].abbr, caption:Global.addressList[i].state+"-"+Global.addressList[i].abbr});
	}
	return stateArr;
};

Global.dateStr = function(tempDate) {
	var hour = tempDate.getHours();
	var indic = 'AM';
	if (hour > 12) {
		hour = hour-12;
		indic = 'PM';
	}
	var minPref = '';
	var min = tempDate.getMinutes();
	if (min < 10) minPref = '0';
	var timeStr = hour +":" + minPref + min;
	return tempDate.toDateString() + " " + timeStr + " " + indic;
};
Global.checkLateStatus = function(status) {
	var stat = 1;
	if (status.toLowerCase().indexOf('late') > -1) {
		var search = "minutes";
		if (status.toLowerCase().indexOf('minutes') < 0) {
			if (status.toLowerCase().indexOf('hours') > -1) {
				search = '';
				return 2;
			} else {
				search = '';
			}
		}
		if (search != '') {
			var min = status.toLowerCase().split(' ');
			var time;
			var prev;
			for (ii in min) {
				if (min[ii] == search) {
					if (parseInt(prev) > 14) {
						return 2;
					}
				}
				prev = min[ii];
			}
		}
	}
	return stat;
}
Global.retrieveStationList = function(state, callBack) {
	if (Global.inProcess) {
		setTimeout(function() {
			Global.retrieveStationList(state, callBack);
		},
		200);
		return;
	}
	Global.inProcess = true;
	
	var pos = 0;
	for (j in Global.addressList) {
	if (Global.addressList[j].abbr == state) {
		if (Global.addressList[j].stations.length == 0) {
			//Global.log("Retrieve station list from web " + j + ":" + Global.addressList[j].stations.length);
			pos = j;
			AjaxRequest.get({
				'url':Global.stateAddressPrefix+state+'.html'
				,'onSuccess':function(req){
					Global.log("Success " + req.status);
					if (req.status == '200') {
						var callBackArr = [];
						var resultArr = req.responseText.toString().split("mp_trans_disable_start");
						var procArr = resultArr[1].split(";opener.updateField(&quot;");
						for (i in procArr) {
							if (i > 0 && i%2 == 0) {
							if (procArr[i].search("&quot;") > -1) {
								callBackArr.push(Global.parseAmtrakStationStr(procArr[i]));
							}
							}
						}
						Global.addressList[pos].stations = callBackArr;
						callBack(callBackArr);
					}
					Global.inProcess = false;
				}
				,'timeout':8000
				,'onTimeout':function(req){ Global.inProcess = false;Global.amtrakThis.popMessage('Connection Timed Out!'); }
				,'onError':function(req){ Global.inProcess = false;Global.amtrakThis.popMessage('Error, check your network connection '+req.statusCode);}
			});
		} else {
		Global.log("Retrieve station list from memory");
			callBack(Global.addressList[j].stations);
			Global.inProcess = false;
		}
	}
	}
};
String.prototype.trim = function() {
	return this.replace(/^\s+|\s+$/g,"");
};
String.prototype.ltrim = function() {
	return this.replace(/^\s+/,"");
};
String.prototype.rtrim = function() {
	return this.replace(/\s+$/,"");
};

Global.useNew = false;
Global.checkRouteSchedule = function(routeNameArg, departureArg, destinationArg, callBackArg, routePosArg) {
	if (Global.useNew) {
		Global.log("Check Status");
		Global.checkStatus(routeNameArg, departureArg, destinationArg, callBackArg, routePosArg);
		return;
	}
	Global.amtrakThis.$.ScheduleSpinner.show();
	if (Global.inProcessSched) {
		setTimeout(function() {
			Global.checkRouteSchedule(routeNameArg, departureArg, destinationArg, callBackArg, routePosArg);
		},
		2000);
		return;
	}
	Global.inProcessSched = true;
	Global.routeScheduleResultsPos = routePosArg;

	var routeName = routeNameArg;
	var departure = departureArg;
	var destination = destinationArg;
	var callBack = callBackArg;
	var day = Global.dayArg;
	var	month = Global.monthArg;
	var year = Global.yearArg;
	var hour = Global.hourArg;
	var minute = Global.minuteArg;
	
	var tempDate = new Date();
	if (!Global.useCurrentTime) {
		tempDate.setDate(day);
		tempDate.setMonth(month);
		tempDate.setFullYear(year);
		// Why is hour fast? Some diff between javascript 0-23
		tempDate.setHours(hour);
		tempDate.setMinutes(minute);
	}
	var dayStr = tempDate.toLocaleDateString();
	

	var timeArr = (tempDate.toTimeString()).split(':');
	var timeStr = timeArr[0]+":"+timeArr[1];
	//Global.log("Checking schedule for " + departure + " to " + destination);
	Global.amtrakThis.$.AmtrakHeader.setContent("As of: " + Global.dateStr(tempDate)),
	
	
	AjaxRequest.post({
		'url':'http://tickets.amtrak.com/itd/amtrak', 
		'parameters' : {  
			'requestor':'amtrak.presentation.handler.page.rail.AmtrakCMSRailSchedulesSelectTrainPageHandler',
			'xwdf_origin':'/sessionWorkflow/productWorkflow[@product="Rail"]/travelSelection/journeySelection[1]/departLocation/search',
			'wdf_origin':departure,
			'xwdf_destination':'/sessionWorkflow/productWorkflow[@product="Rail"]/travelSelection/journeySelection[1]/arriveLocation/search',
			'wdf_destination':destination,
			'status_dep':'checked',
			'/sessionWorkflow/productWorkflow[@product="Rail"]/tripRequirements/journeyRequirements[1]/departDate.date':dayStr,
			'/sessionWorkflow/productWorkflow[@product="Rail"]/tripRequirements/journeyRequirements[1]/departTime.hourmin':timeStr,
			'_handler=amtrak.presentation.handler.request.rail.AmtrakCMSRailSchedulesSearchRequestHandler/_xpath=/sessionWorkflow/productWorkflow[@product="Rail"]':'',
			'_handler=amtrak.presentation.handler.request.rail.AmtrakCMSRailSchedulesSearchRequestHandler/_xpath=/sessionWorkflow/productWorkflow[@product="Rail"].x':'111',
			'_handler=amtrak.presentation.handler.request.rail.AmtrakCMSRailSchedulesSearchRequestHandler/_xpath=/sessionWorkflow/productWorkflow[@product="Rail"].y':'13',
			'_handler=amtrak.presentation.handler.request.rail.AmtrakRailTrainStatusSearchRequestHandler/_xpath=/sessionWorkflow/productWorkflow[@product="Rail"]':''
		}
		,'onSuccess' : function(req){ 
			// Clear the schedule and reload results
			Global.routeScheduleResults = [];
			Global.routeScheduleResultsPos = 0;
			Global.routeListThis.$.virtualList.refresh();
			if (req.responseText.indexOf("Problem Finding Service") > -1) {
				Global.routeScheduleResults.push({id:Global.routeScheduleResultsPos, routeName:routeName, statusCode:3, destinationStatus:"Problem finding service. Arrival and departure must be on the same route."});
				Global.routeListThis.$.virtualList.refresh();
			} else if (req.responseText.indexOf("Oops") > -1) {
				Global.routeScheduleResults.push({id:Global.routeScheduleResultsPos, routeName:routeName, statusCode:3, destinationStatus:"Problem connecting to Amtrak.com, if this persists please contact the developer."});
				Global.routeListThis.$.virtualList.refresh();
			} else {
				var procArrSc = req.responseText.toString().split("<tr class=\"status_result departs");
				var callBackSchedArr = [];
				var callBackData = {};
				for (i in procArrSc) {
					if (i > 0) {
						var trainsSc = procArrSc[i].split("<tr class=\"status_result arrives")
						var departsSc = Global.parseAmtrakScheduleStr(trainsSc[0]);
						var arrivesSc = Global.parseAmtrakScheduleStr(trainsSc[1]);
						departsSc.destinationTime = arrivesSc.destinationTime;
						departsSc.destinationDay = arrivesSc.destinationDay;
						departsSc.destinationStatus = arrivesSc.destinationStatus;
						departsSc.id = Global.routeScheduleResultsPos;
						departsSc.routeName = routeName;
						if (departsSc.statusCode > 0 || arrivesSc.statusCode > 0) {
							if (arrivesSc.statusCode > departsSc.statusCode) {
								departsSc.statusCode = arrivesSc.statusCode;
							}
						}
						//Global.log("Departs " + JSON.stringify(departsSc));
						//callBackSchedArr.push(departsSc);
						Global.routeScheduleResults.push(departsSc);
					}
				}
			}
			Global.inProcessSched = false;
			Global.routeListThis.scheduleUpdate();
		}
		,'timeout':10000
		,'onTimeout':function(req){ Global.inProcessSched = false;Global.amtrakThis.$.ScheduleSpinner.hide();Global.amtrakThis.popMessage('Connection Timed Out!'); }
		,'onError':function(req){ Global.inProcessSched = false;Global.amtrakThis.$.ScheduleSpinner.hide();Global.amtrakThis.popMessage('Error, check your network connection '+req.statusCode);}
	});
};

Global.parseAmtrakScheduleStr = function(input) {
	var ret = {statusCode:-2, train:'', routeName:'', service:'', departTime:'', departDay:'',departStatus:'',destinationTime:'', destinationDay:'', destinationStatus:''};
	var tempArr = input.split('<div class="route_num">');
	for (i in tempArr) {
		if (tempArr[i].indexOf('<div class="route_name">') > -1) {
			var trainNum = tempArr[i].split('<div class="route_name">')
			ret.train = (trainNum[0].split('</div>'))[0];
			ret.service = (trainNum[1].split('</div>'))[0];
			
			var sched = trainNum[1].split('<td class="scheduled">');
			var time = ((sched[1].split('<div class="time">'))[1].split('</div>'))[0].toUpperCase();
			var date = (((sched[1].split('<div class="date"'))[1].split('">'))[1].split('</div>'))[0];
			var status = ((((sched[1].split('statusbackground">'))[1].trim()).split('</td>'))[0].trim()).replace('<br/>', ' ');
			if (status.toLowerCase().indexOf("presently, no further information is available. please check back later for updated information.") > -1
			|| status.toLowerCase().indexOf("on time") > -1
			|| status.toLowerCase().indexOf("early") > -1
			|| status == '') {
				ret.statusCode = 0;
				status = 'On Time.'
			} else if (status.toLowerCase().indexOf('delay') > -1 || status.toLowerCase().indexOf('late') > -1) {
				 ret.statusCode = Global.checkLateStatus(status);
			} else {
				ret.statusCode = 3;
			}
			ret.departTime = time;
			ret.departDay = date;
			ret.departStatus = status;
		}
		// This doesn't look right, but works because tempArr.length is 2 for departing and 1 for arriving trains
		if (ret.statusCode == -2) {
			var time = ((input.split('<div class="time">'))[1].split('</div>'))[0].toUpperCase();
			var date = (((input.split('<div class="date"'))[1].split('">'))[1].split('</div>'))[0];
			var status = ((((input.split('statusbackground">'))[1].trim()).split('</td>'))[0].trim()).replace('<br/>', ' ');
			if (status.toLowerCase().indexOf("presently, no further information is available. please check back later for updated information.") > -1
			|| status.toLowerCase().indexOf("on time") > -1
			|| status.toLowerCase().indexOf("early") > -1
			|| status == '') {
				ret.statusCode = 0;
				status = 'On Time.'
			} else if (status.toLowerCase().indexOf('delay') > -1 || status.toLowerCase().indexOf('late') > -1) {
				ret.statusCode = Global.checkLateStatus(status);
			} else {
				ret.statusCode = 3;
			}
			ret.destinationTime = time;
			ret.destinationDay = date;
			ret.destinationStatus = status;
		}
	}

    return ret;

};

Global.parseAmtrakScheduleStr2 = function(input) {
	var ret = {statusCode:-2, train:'', routeName:'', service:'', departTime:'', departDay:'',departStatus:'',destinationTime:'', destinationDay:'', destinationStatus:''};
	
	var from = input.substring(input.indexOf('From</span>: '));
	
	var tempArr = input.split('</span>');
	for (i in tempArr) {
		switch (i) {
			case 0: ret.train = tempArr[i].substring(3, tempArr[i].indexOf(' '));
					ret.routeName = tempArr[i].substring(tempArr[i].indexOf(' '), tempArr[i].indexOf('<a href'));
			break;
			case 2:	// From description
			break;
			case 3:	// From symbol
			break;
			case 4:	// departure time
					var departArr = tempArr[i].split('<div id="un_modifyLinks">');
					ret.departTime = departArr[1].substring(0, departArr[1].indexOf('</div>'));
					ret.departStatus = departArr[2].substring(0, departArr[2].indexOf('</div>'));
			break;
			case 5:	// To
			break;
			case 6:	// To Symbol
			break;
			case 7:	// Arrival Time
					var arrArr = arrArr[i].split('<div id="un_modifyLinks">');
					ret.destinationTime = arrArr[1].substring(0, arrArr[1].indexOf('</div>'));
					ret.destinationStatus = arrArr[2].substring(0, arrArr[2].indexOf('</div>'));
			break;
		}

	}

    return ret;

};
Global.checkStatus = function(routeNameArg, departureArg, destinationArg, callBackArg, routePosArg) {
Global.log("Check mobile site");
	Global.amtrakThis.$.ScheduleSpinner.show();
	if (Global.inProcessSched) {
		setTimeout(function() {
			Global.checkStatus(routeNameArg, departureArg, destinationArg, callBackArg, routePosArg);
		},
		2000);
		return;
	}
	Global.inProcessSched = true;
	Global.routeScheduleResultsPos = routePosArg;

	var routeName = routeNameArg;
	var departure = departureArg;
	var destination = destinationArg;
	var callBack = callBackArg;
	var day = Global.dayArg;
	var	month = Global.monthArg;
	var year = Global.yearArg;
	var hour = Global.hourArg;
	var minute = Global.minuteArg;
	
	var tempDate = new Date();
	if (!Global.useCurrentTime) {
		tempDate.setDate(day);
		tempDate.setMonth(month);
		tempDate.setFullYear(year);
		// Why is hour fast? Some diff between javascript 0-23
		tempDate.setHours(hour);
		tempDate.setMinutes(minute);
	}
	var dayStr = tempDate.toLocaleDateString();
	var timeArr = (tempDate.toTimeString()).split(':');
	var timeStr = timeArr[0]+":"+timeArr[1];
	Global.log("Checking schedule for " + departure + " to " + destination);
	Global.amtrakThis.$.AmtrakHeader.setContent("As of: " + Global.dateStr(tempDate)),

	AjaxRequest.post({
		'url':'http://m.amtrak.com/mt/www.amtrak.com/itd/amtrak?un_jtt_v_target=status', 
		'parameters' : {  
			'requestor':'amtrak.presentation.handler.page.rail.AmtrakCMSRailSchedulesSelectTrainPageHandler',
			'xwdf_origin':'/sessionWorkflow/productWorkflow[@product="Rail"]/travelSelection/journeySelection[1]/departLocation/search',
			'wdf_origin':departure,
			'xwdf_destination':'/sessionWorkflow/productWorkflow[@product="Rail"]/travelSelection/journeySelection[1]/arriveLocation/search',
			'wdf_destination':destination,
			'xwdf_SortBy':'/sessionWorkflow/productWorkflow[@product="Rail"]/tripRequirements/journeyRequirements[1]/departDate/@radioSelect',
			'wdf_SortBy':'arrivalTime',
			'status_dep':'checked',
			'un_jtt_status':'1',
			'un_form_encoding':'utf-8',
			'un_form_post_list':'',
			'/sessionWorkflow/productWorkflow[@product="Rail"]/tripRequirements/journeyRequirements[1]/departDate.date':dayStr,
			'/sessionWorkflow/productWorkflow[@product="Rail"]/tripRequirements/journeyRequirements[1]/departTime.hourmin':timeStr,
			'_handler=amtrak.presentation.handler.request.rail.AmtrakCMSRailSchedulesSearchRequestHandler/_xpath=/sessionWorkflow/productWorkflow[@product="Rail"]':'',
			'_handler=amtrak.presentation.handler.request.rail.AmtrakCMSRailSchedulesSearchRequestHandler/_xpath=/sessionWorkflow/productWorkflow[@product="Rail"].x':'111',
			'_handler=amtrak.presentation.handler.request.rail.AmtrakCMSRailSchedulesSearchRequestHandler/_xpath=/sessionWorkflow/productWorkflow[@product="Rail"].y':'13',
			'_handler=amtrak.presentation.handler.request.rail.AmtrakRailTrainStatusSearchRequestHandler/_xpath=/sessionWorkflow/productWorkflow[@product="Rail"]':''
		}
		,'onSuccess' : function(req){ 
			// Clear the schedule and reload results
			Global.routeScheduleResults = [];
			Global.routeScheduleResultsPos = 0;
			Global.routeListThis.$.virtualList.refresh();
			Global.log(req.responseText);
			if (req.responseText.indexOf("Problem Finding Service") > -1) {
				Global.routeScheduleResults.push({id:Global.routeScheduleResultsPos, routeName:routeName, statusCode:3, destinationStatus:"Problem finding service. Arrival and departure must be on the same route."});
				Global.routeListThis.$.virtualList.refresh();
			} else if (req.responseText.indexOf("Oops") > -1) {
				Global.routeScheduleResults.push({id:Global.routeScheduleResultsPos, routeName:routeName, statusCode:3, destinationStatus:"Problem connecting to Amtrak.com, if this persists please contact the developer."});
				Global.routeListThis.$.virtualList.refresh();
			} else {
				var procArrSc = req.responseText.toString().split('<span class="un_jtt_resultLink">');
				var callBackSchedArr = [];
				var callBackData = {};
				for (i in procArrSc) {
					if (i > 0) {
						var trainsSc = procArrSc[i].split("<tr class=\"status_result arrives")
						var departsSc = Global.parseAmtrakScheduleStr2(trainsSc[0]);
						Global.amtrakThis.popMessage("Depart " + departsSc.statusCode +":"+  departsSc.train+":"+ departsSc.routeName+":"+ departsSc.service+":"+ departsSc.departTime +":"+departsSc.departDay+":"+ departsSc.departStatus+":"+ departsSc.destinationTime+":"+ departsSc.destinationDay+":"+ departsSc.destinationStatus);
	
						var arrivesSc = Global.parseAmtrakScheduleStr2(trainsSc[1]);
						
						Global.amtrakThis.popMessage("Arrive " + arrivesSc.statusCode +":"+  arrivesSc.train+":"+ arrivesSc.routeName+":"+ arrivesSc.service+":"+ arrivesSc.departTime +":"+arrivesSc.departDay+":"+ arrivesSc.departStatus+":"+ arrivesSc.destinationTime+":"+ arrivesSc.destinationDay+":"+ arrivesSc.destinationStatus);

						departsSc.destinationTime = arrivesSc.destinationTime;
						departsSc.destinationDay = arrivesSc.destinationDay;
						departsSc.destinationStatus = arrivesSc.destinationStatus;
						departsSc.id = Global.routeScheduleResultsPos;
						departsSc.routeName = routeName;
						if (departsSc.statusCode > 0 || arrivesSc.statusCode > 0) {
							if (arrivesSc.statusCode > departsSc.statusCode) {
								departsSc.statusCode = arrivesSc.statusCode;
							}
						}
						Global.log("Departs " + JSON.stringify(departsSc));
						//callBackSchedArr.push(departsSc);
						Global.routeScheduleResults.push(departsSc);
						Global.routeListThis.$.virtualList.refresh();
					}
				}
			}
			Global.inProcessSched = false;
			Global.routeListThis.scheduleUpdate();
		}
		,'timeout':10000
		,'onTimeout':function(req){ Global.inProcessSched = false;Global.amtrakThis.$.ScheduleSpinner.hide();Global.amtrakThis.popMessage('Connection Timed Out!'); }
		,'onError':function(req){ Global.inProcessSched = false;Global.amtrakThis.$.ScheduleSpinner.hide();Global.amtrakThis.popMessage('Error, check your network connection '+req.statusCode);}
	});
};
Global.parseAmtrakStationStr = function(input) {
	var tempSymArr = input.split("&quot;");

	var name = tempSymArr[0];
	var state = tempSymArr[2];
	var symbol = tempSymArr[4];

	return {'value':name, 'caption':name, 'symbol':symbol};
};

Global.saveRouteList = function() {
	localStorage.setItem(Global.routeKey, JSON.stringify(Global.routeDataList));
};

Global.loadRouteList = function() {
	// list of routes
	Global.routeDataList = localStorage.getItem(Global.routeKey);

	if (Global.routeDataList == undefined) {
		Global.routeDataList = [];
	} else {
		try {
			Global.routeDataList = JSON.parse(Global.routeDataList);
		} catch (Exception) {
			Global.routeDataList = [];
		}
	}
};


Global.savePreferences = function() {
	localStorage.setItem(Global.preferenceKey, JSON.stringify(Global.preference));
};

Global.loadPreferences = function() {
	Global.preferenceKey = localStorage.getItem(Global.preferenceKey);
	if (Global.preference == undefined) {
		Global.preference = {}
	} else {
		try {
			Global.preference = JSON.parse(Global.preference);
		} catch (Exception) {
			Global.preference = {};
		}
	}
};

Global.addressList = [
	{country: "Canada", stations: [], state: "British Columbia", abbr: "BC"},
	{country: "Canada", stations: [], state: "Ontario", abbr: "ON"},
	{country: "Canada", stations: [], state: "Quebec", abbr: "QC"},
	{country: "US", stations: [], state: "Alabama", abbr: "AL"},
	{country: "US", stations: [], state: "Alaska", abbr: "AK"},
	{country: "US", stations: [], state: "Arkansas", abbr: "AR"},
	{country: "US", stations: [], state: "Arizona", abbr: "AZ"},
	{country: "US", stations: [], state: "California", abbr: "CA"},
	{country: "US", stations: [], state: "Colorado", abbr: "CO"},
	{country: "US", stations: [], state: "Connecticut", abbr: "CT"},
	{country: "US", stations: [], state: "District of Columbia", abbr: "DC"},
	{country: "US", stations: [], state: "Delaware", abbr: "DE"},
	{country: "US", stations: [], state: "Florida", abbr: "FL"},
	{country: "US", stations: [], state: "Georgia", abbr: "GA"},
	{country: "US", stations: [], state: "Hawaii", abbr: "HI"},
	{country: "US", stations: [], state: "Iowa", abbr: "IA"},
	{country: "US", stations: [], state: "Idaho", abbr: "ID"},
	{country: "US", stations: [], state: "Illinois", abbr: "IL"},
	{country: "US", stations: [], state: "Indiana", abbr: "IN"},
	{country: "US", stations: [], state: "Kansas", abbr: "KS"},
	{country: "US", stations: [], state: "Kentucky", abbr: "KY"},
	{country: "US", stations: [], state: "Lousiana", abbr: "LA"},
	{country: "US", stations: [], state: "Massachusetts", abbr: "MA"},
	{country: "US", stations: [], state: "Maryland", abbr: "MD"},
	{country: "US", stations: [], state: "Maine", abbr: "ME"},
	{country: "US", stations: [], state: "Michigan", abbr: "MI"},
	{country: "US", stations: [], state: "Minnesota", abbr: "MN"},
	{country: "US", stations: [], state: "Missouri", abbr: "MO"},
	{country: "US", stations: [], state: "Mississippi", abbr: "MS"},
	{country: "US", stations: [], state: "Montana", abbr: "MT"},
	{country: "US", stations: [], state: "North Carolina", abbr: "NC"},
	{country: "US", stations: [], state: "North Dakota", abbr: "ND"},
	{country: "US", stations: [], state: "Nebraska", abbr: "NE"},
	{country: "US", stations: [], state: "New Hampshire", abbr: "NH"},
	{country: "US", stations: [], state: "New Jersey", abbr: "NJ"},
	{country: "US", stations: [], state: "New Mexico", abbr: "NM"},
	{country: "US", stations: [], state: "Nevada", abbr: "NV"},
	{country: "US", stations: [], state: "New York", abbr: "NY"},
	{country: "US", stations: [], state: "Ohio", abbr: "OH"},
	{country: "US", stations: [], state: "Oklahoma", abbr: "OK"},
	{country: "US", stations: [], state: "Oregon", abbr: "OR"},
	{country: "US", stations: [], state: "Pennsylvania", abbr: "PA"},
	{country: "US", stations: [], state: "Rhode Island", abbr: "RI"},
	{country: "US", stations: [], state: "South Carolina", abbr: "SC"},
	{country: "US", stations: [], state: "Tennessee", abbr: "TN"},
	{country: "US", stations: [], state: "Texas", abbr: "TX"},
	{country: "US", stations: [], state: "Utah", abbr: "UT"},
	{country: "US", stations: [], state: "Virginia", abbr: "VA"},
	{country: "US", stations: [], state: "Vermont", abbr: "VT"},
	{country: "US", stations: [], state: "Washington", abbr: "WA"},
	{country: "US", stations: [], state: "West Virginia", abbr: "WI"},
	{country: "US", stations: [], state: "Wisconsin", abbr: "WV"},
	{country: "US", stations: [], state: "Wyoming", abbr: "WY"}
];

	js_traverse = function(jsonObject) {
		var type = typeof jsonObject;
		if (type == "object") {
			for (var key in jsonObject) {
				enyo.log("key: ", key);
				js_traverse(jsonObject[key]);
			}
		} else {
			enyo.log(jsonObject);
		}
	};