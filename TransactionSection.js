define("UsrTransactionsSection", ["ServiceHelper", "ProcessModuleUtilities"], function (ServiceHelper, ProcessModuleUtilities) {
	return {
		entitySchemaName: "UsrTransactions",
		attributes: {
			"IsUsrServiceNotBusy": {
				"dataValueType": this.Terrasoft.DataValueType.BOOLEAN,
				"value": true
			},
			"IsCloseAllOpenTransactionsTimeAvailable": {
				"dataValueType": this.Terrasoft.DataValueType.BOOLEAN,
			},
		},
		methods: {
			init: function () {
				this.callParent(arguments);
				this.decideCloseAllOpenTransactionsTimeAvailability();
			},
			getSectionActions: function () {
				var actionMenuItems = this.callParent(arguments);
				actionMenuItems.addItem(this.getButtonMenuItem({
					Type: "Terrasoft.MenuSeparator"
				}));
				actionMenuItems.addItem(this.getButtonMenuItem({
					"Caption": { bindTo: "Resources.Strings.UpdateCurrencyRatesActionCaption" },
					"Click": { bindTo: "updateCurrencyRates" },
					"Enabled": { bindTo: "IsUsrServiceNotBusy" }
				}));
				return actionMenuItems;
			},
			subscribeToMsgs: function () {
				Terrasoft.ServerChannel.on(Terrasoft.EventName.ON_MESSAGE, this.onMyProcessMessage, this);
			},
			unsubscribeFromMsgs: function () {
				Terrasoft.ServerChannel.un(Terrasoft.EventName.ON_MESSAGE, this.onMyProcessMessage, this);
			},
			onMyProcessMessage: function (scope, message) {
				if (this.Ext.isEmpty(message) === false) {
					var sender = message.Header.Sender;
					if (sender === "UpdatingCurrencyRates" || sender === "ClosingAllOpenTransactions") {
						this.showInformationDialog(message.Body);
						this.unsubscribeFromMsgs();
						if (message.Body === "All open transactions have been successfully closed.") {
							this.reloadGridData();
						}
					}
				}
			},
			updateCurrencyRates: function () {
				this.$IsUsrServiceNotBusy = false;
				this.subscribeToMsgs();
				ServiceHelper.callService("UsrCustomConfigurationService", "UpdateCurrencyRates",
					function () {
						this.$IsUsrServiceNotBusy = true;
					}, null, this);
			},
			decideCloseAllOpenTransactionsTimeAvailability: function () {
				var mainScope = this;
				var timeNow = new Date();
				if (timeNow.getHours() < 15) {
					// make available later today at 15:00
					this.$IsCloseAllOpenTransactionsTimeAvailable = false;
					var msBeforeAvailable = new Date().setHours(15, 0, 0, 0) - timeNow;
					// set interval after which closing open transactions will become available
					var closeAllOpenTransactionsAvailableInterval = setInterval(function () {
						clearInterval(closeAllOpenTransactionsAvailableInterval);
						mainScope.decideCloseAllOpenTransactionsTimeAvailability();
					}, msBeforeAvailable);
				}
				else {
					// make not available later today at midnight
					this.$IsCloseAllOpenTransactionsTimeAvailable = true;
					var msBeforeNotAvailable = new Date().setHours(24, 0, 0, 0) - timeNow;
					// set interval after which closing open transactions will become not available
					var closeAllOpenTransactionsNotAvailableInterval = setInterval(function () {
						clearInterval(closeAllOpenTransactionsNotAvailableInterval);
						mainScope.decideCloseAllOpenTransactionsTimeAvailability();
					}, msBeforeNotAvailable);
				}
			},
			closeAllOpenTransactions: function () {
				this.subscribeToMsgs();
				var args = {
					// UsrProcess is a prefix for CloseAllOpenTransactions defined in business rules (c# code).
					sysProcessName: "UsrProcessCloseAllOpenTransactions"
				};
				ProcessModuleUtilities.executeProcess(args);
			}
		},
		details: /**SCHEMA_DETAILS*/{}/**SCHEMA_DETAILS*/,
		diff: /**SCHEMA_DIFF*/[
			{
				"operation": "insert",
				"parentName": "ActionButtonsContainer",
				"propertyName": "items",
				"name": "CloseAllOpenTransactionsButton",
				"values": {
					itemType: Terrasoft.ViewItemType.BUTTON,
					caption: { bindTo: "Resources.Strings.CloseAllOpenTransactionsButtonCaption" },
					click: { bindTo: "closeAllOpenTransactions" },
					enabled: { bindTo: "IsCloseAllOpenTransactionsTimeAvailable" }
				},
				"layout": {
					"column": 1,
					"row": 1,
					"colSpan": 1
				}
			},
		]/**SCHEMA_DIFF*/
	};
});
