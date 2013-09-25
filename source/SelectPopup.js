var tempArr = [false, false, false, false, false, false, false, false, false, false, false, false];

enyo.kind({
	kind: "VFlexBox",
	name: "InternalVFlex",
	create: function() {
		this.inherited(arguments);
		// ... or I can do tasks after, my $ hash is ready now
		this.createComponent({content:"Future version will allow customization of", style: "font-size:14px;"});
		this.createComponent({content:"available buttons on the main screen.", style: "font-size:14px;"});
		for (x in Global.gDataList) {
			if (x > 0) {
			tempArr[x] = Global.gDataList[x].selected;
			this.createComponent({
				kind: "HFlexBox",
				components: [
				{
					kind: "CheckBox",
					name: "checkBox_" + x,
					onChange: "checkboxClicked",
					checked: Global.gDataList[x].selected,
					style: "margin-right:10px;",
					disabled: false
				},
				{
					content: Global.gDataList[x].caption
				}
				]
			});
			}
		}
	},
	checkboxClicked: function(inSender) {
		var ind = inSender.name.split("_");
		//enyo.log("DEBUG Clicked " + ind[1]);
		if (inSender.getChecked()) {
			tempArr[ind[1]] = true;
		} else {
			tempArr[ind[1]] = false;
		}
	}
});

enyo.kind({
	kind: "Popup",
	name: "SelectPopup",
	layoutKind: "VFlexLayout",
	pack: "center",
	align: "center",
	components: [
	{
		content: "Choose Services",
		className: "text"
	},
	{
	kind: "VFlexBox",
	components: [
		{
			kind: "InternalVFlex"
		},
		{
			kind: "Group",
			caption: "",
			style: "border: 0",
			components: [
			{
				kind: "HFlexBox",
				components: [
				{
					kind: "Button",
					caption: "Save",
					onclick: "buttonSave",
					disabled: false,
					width:"35%"
				},
								{
					caption: "",
					width:"5%"
				},
		       {
					kind: "Button",
					caption: "Cancel",
					onclick: "buttonCancel",
					width:"35%"
				}
				]
			}
			]
		}
	]
	}
	],
	js_traverse: function(jsonObject) {
		var type = typeof jsonObject;
		if (type == "object") {
			for (var key in jsonObject) {
				enyo.log("key: ", key);
				js_traverse(jsonObject[key]);
			}
		} else {
			enyo.log(jsonObject);
		}
	},
	buttonSave: function() {
		for (x in Global.gDataList) {
			//enyo.log("DEBUG Setup :" + x + ":" + tempArr[x] + ":" + Global.gDataList[x].caption);
			Global.gDataList[x].selected = tempArr[x];
		}
		localStorage.setItem(Global.addressListKey, JSON.stringify(Global.gDataList));
		Global.gportalThis.setupToolbarButtons();
		this.close();
	},
	buttonCancel: function() {
		this.close();
	}
});