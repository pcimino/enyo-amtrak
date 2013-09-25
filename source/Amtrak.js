/* Copyright 2010-2011 Trans Lunar Designs, Inc. */

enyo.kind({
	name: "AmtrakCommuter",
	kind: enyo.VFlexBox,
	published: {

	},
	create: function() {
		this.inherited(arguments);
		Global.amtrakThis = this;
		this.render();
	},
	render: function() {
		this.inherited(arguments);
	},
	rendered: function() {
		this.inherited(arguments);

		Global.loadRouteList();
		Global.loadPreferences();

		if (Global.routeDataList.length == 0) {
			this.popMessage("Please add a Route to get started.");
		} else {
			Global.routeListThis.$.virtualList.refresh();
			setTimeout(function() {
				Global.amtrakThis.checkAllSchedules();
			},
			500);
		}
	},
    components: [
	{kind: "HFlexBox", components: [{kind: "Spinner", name: "ScheduleSpinner"},{kind: "Header", name:"AmtrakHeader", content: "As of: " + Global.dateStr(new Date())}]},
	
	{kind: "PopupDialog", name: "HelpPopup"},
	{kind: "RouteDialog", name: "RoutePopup"},
	{kind: "DateDialog", name: "DatePopup"},
	{
		name: "openAppService",
		kind: "PalmService",
		service: "palm://com.palm.applicationManager/",
		method: "open"
	},
	{
		name: "launchAppService",
		kind: "PalmService",
		service: "palm://com.palm.applicationManager/",
		method: "launch"
	},
	{
		kind: "ApplicationEvents",
		onOpenAppMenu: "openAppMenu",
		onCloseAppMenu: "closeAppMenu"
	},
	{
		kind: "AppMenu",
		automatic: false,
		components: [
		{
			kind: "EditMenu"
		},
		{
			caption: "Add a Route",
			onclick: "addRoute"
		},
		{
			caption: "Help",
			onclick: "openPopup",
			popup: "popupHelp"
		}
		]
	},
	{
		kind: "Popup",
		name: "popupHelp",
		width: "500px",
		layoutKind: "VFlexLayout",
		pack: "center",
		align: "center",
		components: [
			{kind: "Image",
				src: "images/LogoColor_162x143.png"
			},
			{kind: "Button",
				caption: "Email Support@TransLunarDesigns.com",
				onclick: "buttonClick"
			},
			{kind: "HFlexBox", components: [
				{kind: "Button", caption: "User manual", onclick: "buttonClickLoadHelp"},
				{kind: "Spacer"},
				{kind: "Button",
					caption: "Cancel",
					popupHandler: "Cancel"
				}]
			}
		]
	},
	{kind: "SelectPopup",
		dataList: Global.addressList
	},
	{kind: "RouteList", flex:1, name: "VirtualRouteList"},            
	{kind: "Toolbar",
		name: "ButtonToolbar",
		components: [
			{kind: "Spacer"},
			{caption: "Add Route", onclick: "addRoute"},
			{kind: "Spacer"},
			{caption: "Update", onclick: "checkAllSchedules"},
			{kind: "Spacer"},
			{kind: "Image", src: "images/Clock.png", onclick: "changeDate"},
			{kind: "Spacer"}
		]}
	],
	addRoute: function() {
		this.openPopup({popup: "RoutePopup"});
	},
	changeDate: function() {
		this.openPopup({popup: "DatePopup"});
	},
	openPopup: function(inSender) {
		var p = this.$[inSender.popup];
		if (p) {
			p.openAtCenter();
		}
	},
	dialogOpened: function() {
		// focuses the input and enables automatic keyboard mode
		this.$.input.forceFocusEnableKeyboard();
	},
	buttonClickLoadHelp: function() {
		this.$.openAppService.call({
			id: 'com.palm.app.browser',
			params: {
				target: Global.helpSite
			}
		});
	},
	buttonClick: function() {
		this.$.openAppService.call({
			id: 'com.palm.app.email',
			params: {
				summary: "Amtrak Commuter question/comment",
				text: "",
				recipients: [{
					type: "email",
					role: 1,
					value: "support@translunardesigns.com",
					contactDisplay: "Trans Lunar Designs"
				}]
			}
		});
	},
	openAppMenu: function() {
		var menu = this.myAppMenu || this.$.appMenu;
		menu.open();
	},
	closeAppMenu: function() {
		var menu = this.myAppMenu || this.$.appMenu;
		menu.close();
	},
	// popup helper
	pop: function(inSender) {
		this.popMessage(inSender.message);
	},
    popMessage: function(message) {
		//this.$.message = message;
        this.$.HelpPopup.openAtCenter();
		this.$.HelpPopup.setMessage(message);
    },
	checkAllSchedules: function() {
		Global.counter = Global.routeDataList.length;
		if (Global.counter >= -1) {
			//this.$.ScheduleSpinner.show();
			this.checkNextSchedule();
		} else {
			this.$.ScheduleSpinner.hide();
		}
	},
	checkNextSchedule: function() {
		Global.counter--;
		if (Global.counter >= 0) {
			var item = Global.routeDataList[Global.counter];
			//Global.log("Checking " + JSON.stringify(item));
			Global.checkRouteSchedule(item.caption, item.departureSymbol, item.destinationSymbol, Global.routeListThis.scheduleUpdate, Global.counter);
		}
	}
});
