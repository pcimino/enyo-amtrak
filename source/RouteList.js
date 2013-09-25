	enyo.kind({
		name: "RouteList",
		kind: enyo.VFlexBox,
		components: [
			{kind: "VirtualList", width:'100%', height: '100%', onSetupRow: "setupRow", components: [
				{kind: "SwipeableItem", onConfirm: "deleteItem", layoutKind: "HFlexLayout", components: [
					{kind:'DividerDrawer', onclick:'selectDrawer', onOpenAnimationComplete:'drawerChange', name: "itemName", flex: 1, components: [
						{kind: "Divider", name: 'train1', caption:'', flex:1, onclick: "showMenu", showing:false, icon: "images/question.png"},
						{name: 'leave1', flex: 1, onclick: "showMenu", showing:false},
						{name: 'arrive1', flex: 1, onclick: "showMenu", showing:false},
						
						{kind: "Divider", name: 'train2', caption:'', flex: 1, onclick: "showMenu", showing:false, icon: "images/question.png"},
						{name: 'leave2', flex: 1, onclick: "showMenu", showing:false},
						{name: 'arrive2', flex: 1, onclick: "showMenu", showing:false},
						
						{kind: "Divider", name: 'train3', caption:'', flex: 1, onclick: "showMenu", showing:false, icon: "images/question.png"},
						{name: 'leave3', flex: 1, onclick: "showMenu", showing:false},
						{name: 'arrive3', flex: 1, onclick: "showMenu", showing:false},
						
						{kind: "Divider", name: 'train4', caption:'', flex: 1, onclick: "showMenu", showing:false, icon: "images/question.png"},
						{name: 'leave4', flex: 1, onclick: "showMenu", showing:false},
						{name: 'arrive4', flex: 1, onclick: "showMenu", showing:false},
						
						{kind: "Divider", name: 'train5', caption:'', flex: 1, onclick: "showMenu", showing:false, icon: "images/question.png"},
						{name: 'leave5', flex: 1, onclick: "showMenu", showing:false},
						{name: 'arrive5', flex: 1, onclick: "showMenu", showing:false},
					]},
					{kind: enyo.Spinner, name: "scheduleViewSpinner", align: "right"}
				]}
			]
		},
		{name: "selectionMenu", kind: "Menu", className: "selection-submenu", components: [ 
			{caption: "Update Schedule", onclick: "optionSelected", option: "update"},
			{kind: "Divider", caption:''},
			{caption: "Delete", onclick: "optionSelected", option: "delete"},
			{caption: "Cancel", onclick: "optionSelected", option: "cancel"}
		]}
	],
	create: function() {
		this.inherited(arguments);
		Global.routeListThis = this;
	},
	setupRow: function(inSender, inIndex) {
		if (inIndex < Global.routeDataList.length) {
			if (inIndex < 0) return false;
			var record = Global.routeDataList[inIndex];
			var recCount = 0;
			for (qq in Global.routeScheduleResults) {
				if (Global.routeScheduleResults[qq].routeName == Global.routeDataList[inIndex].caption) {
					if (recCount == 0) {
						this.setSchedule(Global.routeScheduleResults[qq], record.departureSymbol, record.destinationSymbol, this.$.itemName, this.$.train1, this.$.leave1, this.$.arrive1);
					} else if (recCount == 1) {
						this.setSchedule(Global.routeScheduleResults[qq], record.departureSymbol, record.destinationSymbol, this.$.itemName, this.$.train2, this.$.leave2, this.$.arrive2);
					} else if (recCount == 2) {
						this.setSchedule(Global.routeScheduleResults[qq], record.departureSymbol, record.destinationSymbol, this.$.itemName, this.$.train3, this.$.leave3, this.$.arrive3);
					} else if (recCount == 3) {
						this.setSchedule(Global.routeScheduleResults[qq], record.departureSymbol, record.destinationSymbol, this.$.itemName, this.$.train4, this.$.leave4, this.$.arrive4);
					} else if (recCount == 4) {
						this.setSchedule(Global.routeScheduleResults[qq], record.departureSymbol, record.destinationSymbol, this.$.itemName, this.$.train5, this.$.leave5, this.$.arrive5);
					}
					recCount++;
				}
			}

			this.$.itemName.setCaption(record.caption);

			return true;
		}
	},
	setSchedule: function(rowData, depart, destination, itemName, train, leave, arrive) {
		var iconName = 'images/yellow.png';
		if (rowData.statusCode == 3) {
			iconName = 'images/red.png';
			train.setShowing(true);
			train.setIcon(iconName);
			train.setCaption(rowData.destinationStatus);
			return;
		} else if (rowData.statusCode == 2) {
			iconName = 'images/red.png';
		} else if (rowData.statusCode == 1) {
			iconName = 'images/yellow.png';
		} else if (rowData.statusCode == 0) {
			iconName = 'images/green.png';
		}
		train.setShowing(true);
		train.setIcon(iconName);
		leave.setShowing(true);
		arrive.setShowing(true);

		train.setCaption(rowData.train + " " + rowData.service + " " + depart + " to " + destination);
		leave.setContent(rowData.departTime + " " + rowData.departDay + " " + rowData.departStatus);
		arrive.setContent(rowData.destinationTime + " " + rowData.destinationDay + " " + rowData.destinationStatus);
	},
	addNewData: function(newRouteListItem) {
		if (newRouteListItem) {
			//Global.log("Add new Item");
			//Global.log("Found " + newRouteListItem.caption);
			Global.routeDataList.push(newRouteListItem);
			Global.saveRouteList();
			//this.SpinnerLarge.show();
		};
	},
	scheduleUpdate: function() {
		Global.log("Update Schedule");
		Global.routeListThis.$.virtualList.refresh();
		if (Global.counter >= -1) {
			Global.amtrakThis.checkNextSchedule();
		}
		if (Global.counter < 0) {
			Global.amtrakThis.$.ScheduleSpinner.hide();
		}
	},
	deleteItem: function(inSender, inIndex) {
		// remove data
		if (Global.inProcessSched || (Global.counter >= 0)) {
			Global.amtrakThis.popMessage('Please wait until processing is complete before deleting Routes.');
		} else {
			Global.routeDataList.splice(inIndex, 1);
			Global.saveRouteList();
			this.$.virtualList.refresh();
		}
	},
	showMenu: function(inSender, inEvent) {
		Global.log("The user clicked on item number: " + inEvent.rowIndex);
        this.$.selectionMenu.openAroundControl(inSender);
		this.selectedRow = inEvent.rowIndex;
		Global.log("inSender " + inSender.toString() + ":" + inSender.name);
    },
	selectDrawer: function(inSender, inEvent) {
		Global.selectedRow = inEvent.rowIndex;
		var record = Global.routeDataList[Global.selectedRow];
		Global.checkRouteSchedule(record.departureSymbol, record.destinationSymbol, this.scheduleUpdate, Global.selectedRow);
    },
	drawerChange: function(inSender, inEvent) {
		this.$.virtualList.refresh();
	},
    optionSelected: function(inSender) {
		if (inSender.option == 'delete') {
			this.deleteItem(inSender, this.selectedRow);
		} else if (inSender.option == 'update') {
			var record = Global.routeDataList[this.selectedRow];
			Global.checkRouteSchedule(record.departureSymbol, record.destinationSymbol, this.scheduleUpdate, this.selectedRow);
		}
    },
});