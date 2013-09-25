
var createReturn = true;

enyo.kind({
	name: "DateDialog",
	kind: enyo.ModalDialog,
	published: {
	},
	create: function() {
		this.inherited(arguments);
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
			this.$.HeaderHBox.setShowing(false);
		} else {
		this.$.HeaderHBox.setShowing(true);
		}
	},
	components: [		
		{kind: "ApplicationEvents", onWindowRotated: "windowRotated"},
		{kind: "HFlexBox", name:'HeaderHBox', showing:true, components: [
			{kind: "Image", src: "images/icon32.png", style: "padding-right: 10px", width: "50px"},
			{content: "Change Date & Time", flex: 1, className: "enyo-text-ellipsis", style: "text-transform: capitalize;"}
		]},	
		{kind: "VFlexBox", name: "SearchVFlexBox", components: [
			{kind: "DatePicker", name:"scheduleDate", minYear:'2012', className: "picker-hbox"},
			{kind: "HFlexBox", align: "center", tapHighlight: false, components: [
				{kind: "IntegerPicker", className: "picker-hbox", name:'hourPicker', label: "Hour", min: 1, max: 12, value: 5},
				{kind: "Spacer"},
				{kind: "RadioGroup", name:'amPmIndicator', components: [
					{label: "AM"},
					{label: "PM"}
				]},
				{kind: "Spacer"}
			]},
				{kind: "HFlexBox", bgcolor: '555555', components: [
					{kind: "Button", caption: "Set", onclick: "buttonSet"},
					{kind: "Spacer"},
					{kind: "Button", caption: "Reset", onclick: "buttonReset"}
				]}

		]}
	],
	buttonSet: function() {
		var hour = this.$.hourPicker.getValue();
		var am = this.$.amPmIndicator.getValue();
		if (am > 0) {
			hour = hour + 12;
		}
		var bDate = this.$.scheduleDate.getValue();
		Global.dayArg = bDate.getDate();
		Global.monthArg = bDate.getMonth();
		Global.yearArg = bDate.getFullYear();
		Global.hourArg = hour;
		Global.useCurrentTime = false;
		Global.amtrakThis.checkAllSchedules();
		this.close();
	},
	buttonReset: function() {
		Global.useCurrentTime = true;
		Global.dayArg = '';
		Global.monthArg = '';
		Global.yearArg = '';
		Global.hourArg = '';
		Global.minuteArg = '0';
		Global.amtrakThis.checkAllSchedules();
		this.close();
	},
	// because popups are lazily created, initialize properties that effect components 
	// in componentsReady rather than create.
	componentsReady: function() {
		this.inherited(arguments);
		var am = 0;
		var tempDate = new Date();
		var hours = tempDate.getHours();
		if (hours > 10) {
			am = 1;
			if (hours > 11) {
				hours = hours - 12;
			}
		}

		//Global.log("DATE IS " + JSON.stringify(tempDate));
		//Global.log("Hours IS :" + hours + ":" + am );
		
		this.$.hourPicker.setValue(hours);
		this.$.amPmIndicator.setValue(am);
	}

});
