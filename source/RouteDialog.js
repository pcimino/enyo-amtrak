
var createReturn = true;

enyo.kind({
	name: "RouteDialog",
	kind: enyo.ModalDialog,
	published: {
	},
	create: function() {
		this.inherited(arguments);
		Global.routeThis = this;
	},
	render: function() {
		this.inherited(arguments);
	},
	rendered: function() {
		this.inherited(arguments);
		if (enyo.fetchDeviceInfo().maximumCardHeight < 410) {
			this.$.HeaderHBox.setShowing(false);
		}
	},
	ready: function() {
		//Global.log("Route ready");
	},
	windowRotated: function(inSender) {
		var ori = enyo.getWindowOrientation();
		if ((ori == 'left' || ori == 'right') && enyo.fetchDeviceInfo().maximumCardWidth < 500) {
	//Global.amtrakThis.popMessage("DEBUG ROTATE " + enyo.fetchDeviceInfo().maximumCardHeight + ":" + enyo.fetchDeviceInfo().maximumCardWidth + " ROTATE " + enyo.fetchDeviceInfo().screenHeight + ":" + enyo.fetchDeviceInfo().screenWidth);
	//Global.amtrakThis.popMessage("DEBUG ROTATE " + enyo.fetchDeviceInfo().maximumCardHeight);
		//if (enyo.fetchDeviceInfo().maximumCardHeight < 410) {
			this.$.HeaderHBox.setShowing(false);
		} else {
		this.$.HeaderHBox.setShowing(true);
		}
	},
	components: [		
		{kind: "ApplicationEvents", onWindowRotated: "windowRotated"},
		{kind: "HFlexBox", name:'HeaderHBox', showing:true, components: [
			{kind: "Image", src: "images/icon32.png", style: "padding-right: 10px", width: "50px"},
			{content: "Add a new Route", flex: 1, className: "enyo-text-ellipsis", style: "text-transform: capitalize;"}
		]},	
		{kind: "VFlexBox", name: "SearchVFlexBox", components: [
			{kind: "Input", name: "routeNameText", hint:"Route Name", caption: "Route Name", tabIndex: "1"},
			{kind: "HFlexBox", align: "center", tapHighlight: false, components: [
				{kind: "CheckBox", checked: createReturn, tabIndex: "2", name: "createReturnTrip", onChange: "checkboxClicked"},
				{kind: "Spacer"},
				{content: "Create Return Route"},
				{kind: "Spacer"}
			]},
			{kind: "CustomListSelector", name:'fromStateListSelector', label:'Departure State', items:[], onChange: "fromStateChanged"},
			{kind: "CustomListSelector", name:'fromStationListSelector', label:'Departure Station', disabled:true, items:[], onChange: "fromStationChanged"},
			{kind: "CustomListSelector", name:'toStateListSelector', label:'Destination State', items:[], onChange: "toStateChanged"},
			{kind: "CustomListSelector", name:'toStationListSelector', label:'Destination Station', disabled:true, items:[], onChange: "toStationChanged"},
				{kind: "HFlexBox", bgcolor: '555555', components: [
					{kind: "Button", caption: "Save", onclick: "buttonSave"},
					{kind: "Spacer"},
					{kind: "Button", caption: "Cancel", name: "cancelButton", onclick: "buttonCancel"}
				]}

		]}
	],
	// State selection
	fromStateChanged: function(inSender, inValue, inOldValue) {
		//Global.log("fromStateChanged " + inValue);
		Global.departureState = Global.addressList[inValue].abbr;
		Global.retrieveStationList(Global.departureState, this.setupFromStationList);	
		if (Global.destinationState == '') {
			this.$.toStateListSelector.setValue(this.$.fromStateListSelector.getValue());
			this.toStateChanged(inSender, inValue, inOldValue);
		}
	},
	toStateChanged: function(inSender, inValue, inOldValue) {
		//Global.log("toStateChanged " + inValue);
		Global.destinationState = Global.addressList[inValue].abbr;
		Global.retrieveStationList(Global.destinationState, this.setupToStationList);
	},
	//Select stations
	fromStationChanged: function(inSender, inValue, inOldValue) {
		Global.departure = Global.fromStations[inValue].value;
		Global.departureSymbol = Global.fromStations[inValue].symbol;
		Global.routeThis.$.fromStationListSelector.setLabel('');
	},
	toStationChanged: function(inSender, inValue, inOldValue) {
		Global.destination = Global.toStations[inValue].value;
		Global.destinationSymbol = Global.toStations[inValue].symbol;
		Global.routeThis.$.toStationListSelector.setLabel('');
	},
	buttonSave: function() {
		var nam = this.$.routeNameText.getValue();
		if (nam.trim() == "") {
			nam = "My Route";
		}

		if (Global.departure.trim() == "" || Global.destination.trim() == "") {
			Global.amtrakThis.popMessage("Please select both a departure and destination station.");
		} else {
			this.saveNewRoute(nam, Global.departure, Global.departureSymbol, Global.destination, Global.destinationSymbol);
			if (createReturn) {
				this.saveNewRoute(nam + " - Return", Global.destination, Global.destinationSymbol, Global.departure, Global.departureSymbol);
			}
			this.$.routeNameText.setValue('');
			this.close();
		}
	},
	saveNewRoute: function(nam, departure, departureSymbol, destination, destinationSymbol) {
		var newListItem = {'caption':nam, 'departure':departure, 'destination':destination, 'departureSymbol':departureSymbol, 'destinationSymbol':destinationSymbol};
		Global.routeListThis.addNewData(newListItem);
		Global.routeListThis.$.virtualList.refresh();
		Global.checkRouteSchedule(nam, newListItem.departureSymbol, newListItem.destinationSymbol, this.scheduleUpdate, (Global.routeDataList.length-1));
	},
	buttonCancel: function() {
		this.close();
	},
	checkboxClicked: function(inSender) {
		if (inSender.getChecked()) {
			//Global.log("Checkbox checked");
			createReturn = true;
		} else {
			//Global.log("Checkbox unchecked");
			createReturn = false;
		}
	},
	// because popups are lazily created, initialize properties that effect components 
	// in componentsReady rather than create.
	componentsReady: function() {
		this.inherited(arguments);
		//Global.log("componentsReady");

		var stateListArr = [];
		var toStateListArr = [];
		for (i in Global.addressList) {
			stateListArr.push({caption:Global.addressList[i].state, value: i});
		}
	
		this.$.fromStateListSelector.setItems(stateListArr);
		this.$.fromStateListSelector.render();
		this.$.toStateListSelector.setItems(stateListArr);
		this.$.toStateListSelector.render();
		
		this.$.routeNameText.forceFocusEnableKeyboard();
	},
	setupFromStationList: function(stationArray) {
		//Global.log("Setup from station");
		Global.fromStations = stationArray;
		
		if (stationArray.length > 0) {
			Global.routeThis.$.fromStationListSelector.setDisabled(false);
		} else {
			Global.routeThis.$.fromStationListSelector.setDisabled(true);
			Global.routeThis.$.fromStationListSelector.setLabel('Departure Station');
		}
		
		var menuArr = [];
		for (i in stationArray) {
			menuArr.push({'caption':stationArray[i].caption, value:i});
		}
		
		Global.routeThis.$.fromStationListSelector.setItems(menuArr);
		if (menuArr.length > 0) {
		Global.log("Setup From Station List " + menuArr.length);
			Global.routeThis.$.fromStationListSelector.setValue(0);
			Global.routeThis.fromStationChanged(Global.routeThis, 0, 0);
		}
		
		Global.routeThis.$.fromStationListSelector.render();
	},
	setupToStationList: function(stationArray) {
		//Global.log("Setup to station");
		Global.toStations = stationArray;
		if (stationArray.length > 0) {
			Global.routeThis.$.toStationListSelector.setDisabled(false);
		} else {
			Global.routeThis.$.toStationListSelector.setDisabled(true);
			Global.routeThis.$.toStationListSelector.setLabel('Destination Station');
		}
		
		var menuArr = [];
		for (i in stationArray) {
			menuArr.push({'caption':stationArray[i].caption, value:i});
			//Global.log("Setup setupToStationList "+ stationArray[i].caption);
		}
		
		Global.routeThis.$.toStationListSelector.setItems(menuArr);
		if (menuArr.length > 0) {
			Global.routeThis.$.toStationListSelector.setValue(0);
			Global.routeThis.toStationChanged(Global.routeThis, 0, 0);
		}
		Global.routeThis.$.toStationListSelector.render();
	}
});
