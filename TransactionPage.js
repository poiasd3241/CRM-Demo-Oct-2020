define("UsrTransactions1Page", ["BusinessRuleModule"],
	function (BusinessRuleModule) {
		return {
			entitySchemaName: "UsrTransactions",
			rules: {
				"UsrContact": {
					"FiltrationUsrContactByUsrContragent": {
						"ruleType": BusinessRuleModule.enums.RuleType.FILTRATION,
						// Будет выполняться обратная фильтрация.
						"autocomplete": true,
						// Будет выполняться очистка значения при изменении значения колонки [UsrContragent].
						"autoClean": true,
						// Путь к колонке для фильтрации в справочной схеме [Contact],
						// на которую ссылается колонка [UsrContact] модели представления страницы редактирования.
						"baseAttributePatch": "Account",
						// Тип операции сравнения в фильтре.
						"comparisonType": Terrasoft.ComparisonType.EQUAL,
						// В качестве значения при сравнении выступает колонка (атрибут) модели представления.
						"type": BusinessRuleModule.enums.ValueType.ATTRIBUTE,
						// Имя колонки модели представления страницы редактирования,
						// по значению которой будет выполняться фильтрация.
						"attribute": "UsrContragent"
					}
				}
			},
			attributes: {
				"UsrComment": {
					"dependencies": [
						{
							"columns": ["UsrDirection"],
							"methodName": "onUsrDirectionChanged"
						}
					],
				},
				"IsTransactionOutgoing": {
					"dataValueType": this.Terrasoft.DataValueType.BOOLEAN,
				},
				"IsTransactionNew": {
					"dataValueType": this.Terrasoft.DataValueType.BOOLEAN,
				},
			},
			methods: {
				onEntityInitialized: function () {
					this.callParent(arguments);
					this.onUsrDirectionChanged();
					this.$IsTransactionNew = this.isAddMode();
				},
				getActions: function () {
					var actionMenuItems = this.callParent(arguments);
					actionMenuItems.addItem(this.getButtonMenuItem({
						Type: "Terrasoft.MenuSeparator"
					}));
					actionMenuItems.addItem(this.getButtonMenuItem({
						"Caption": { bindTo: "Resources.Strings.AddTransactionDetailRecordCaption" },
						"Tag": "addTransactionDetailRecord"
					}));
					return actionMenuItems;
				},
				onUsrDirectionChanged: function () {
					var TransactionDirection = this.$UsrDirection;
					if (TransactionDirection) {
						this.$IsTransactionOutgoing = TransactionDirection.value.toUpperCase() === "BD24A629-5F1D-420F-9127-77DFDE62FD84";
					}
					else {
						this.$IsTransactionOutgoing = false;
					}
				},
				addTransactionDetailRecord: function () {
					if (this.$UsrContragent.value.toUpperCase() === "E308B781-3C5B-4ECB-89EF-5C1ED4DA488E") {
						// Contact is from our company
						this.showInformationDialog("Данный контакт - сотрудник нашей компании");
						return;
					}
					var insert = Ext.create("Terrasoft.InsertQuery", {
						rootSchemaName: "UsrTransactionMsgsDetail"
					});
					// UsrMsgType Email Id
					insert.setParameterValue("UsrType", "569BD8F0-C6E4-4346-B6BA-42B86C24688C", Terrasoft.DataValueType.GUID);
					// Current transaction Id
					insert.setParameterValue("UsrTransaction", this.$Id, Terrasoft.DataValueType.GUID);
					insert.setParameterValue("UsrNumber", this.$UsrNumber, Terrasoft.DataValueType.TEXT);
					insert.setParameterValue("UsrMsg", this.$UsrComment, Terrasoft.DataValueType.TEXT);
					insert.setParameterValue("UsrDate", new Date(), Terrasoft.DataValueType.DATE);
					insert.execute(function (response) {
						if (response.success) {
							this.updateDetail({ detail: "UsrTransactionMsgs" });
						}
						else {
							window.console.log(response);
							this.showInformationDialog("Ошибка записи в деталь");
						}
					}, this);
				}
			},
			details: /**SCHEMA_DETAILS*/{
				"Files": {
					"schemaName": "FileDetailV2",
					"entitySchemaName": "UsrTransactionsFile",
					"filter": {
						"masterColumn": "Id",
						"detailColumn": "UsrTransactions"
					}
				},
				"UsrTransactionMsgs": {
					"schemaName": "UsrTransactionMsgsDetailSchema",
					"entitySchemaName": "UsrTransactionMsgsDetail",
					"filter": {
						"detailColumn": "UsrTransaction",
						"masterColumn": "Id"
					}
				}
			}/**SCHEMA_DETAILS*/,
			modules: /**SCHEMA_MODULES*/{}/**SCHEMA_MODULES*/,
			businessRules: /**SCHEMA_BUSINESS_RULES*/{}/**SCHEMA_BUSINESS_RULES*/,
			dataModels: /**SCHEMA_DATA_MODELS*/{}/**SCHEMA_DATA_MODELS*/,
			diff: /**SCHEMA_DIFF*/[
				{
					"operation": "insert",
					"name": "UsrName",
					"values": {
						"layout": {
							"colSpan": 24,
							"rowSpan": 1,
							"column": 0,
							"row": 0,
							"layoutName": "ProfileContainer"
						},
						"enabled": {
							"bindTo": "IsTransactionNew"
						}
					},
					"parentName": "ProfileContainer",
					"propertyName": "items",
					"index": 0
				},
				{
					"operation": "insert",
					"name": "UsrNumber",
					"values": {
						"layout": {
							"colSpan": 24,
							"rowSpan": 1,
							"column": 0,
							"row": 1,
							"layoutName": "ProfileContainer"
						},
						"enabled": false
					},
					"parentName": "ProfileContainer",
					"propertyName": "items",
					"index": 1
				},
				{
					"operation": "insert",
					"name": "UsrContact",
					"values": {
						"layout": {
							"colSpan": 24,
							"rowSpan": 1,
							"column": 0,
							"row": 2,
							"layoutName": "ProfileContainer"
						},
						"enabled": true,
						"contentType": 5
					},
					"parentName": "ProfileContainer",
					"propertyName": "items",
					"index": 2
				},
				{
					"operation": "insert",
					"name": "UsrContragent",
					"values": {
						"layout": {
							"colSpan": 24,
							"rowSpan": 1,
							"column": 0,
							"row": 3,
							"layoutName": "ProfileContainer"
						},
						"enabled": true,
						"contentType": 5
					},
					"parentName": "ProfileContainer",
					"propertyName": "items",
					"index": 3
				},
				{
					"operation": "insert",
					"name": "UsrSum",
					"values": {
						"layout": {
							"colSpan": 24,
							"rowSpan": 1,
							"column": 0,
							"row": 4,
							"layoutName": "ProfileContainer"
						},
						"enabled": true
					},
					"parentName": "ProfileContainer",
					"propertyName": "items",
					"index": 4
				},
				{
					"operation": "insert",
					"name": "UsrCurrency",
					"values": {
						"layout": {
							"colSpan": 24,
							"rowSpan": 1,
							"column": 0,
							"row": 5,
							"layoutName": "ProfileContainer"
						},
						"enabled": true,
						"contentType": 5
					},
					"parentName": "ProfileContainer",
					"propertyName": "items",
					"index": 5
				},
				{
					"operation": "insert",
					"name": "UsrDate",
					"values": {
						"layout": {
							"colSpan": 24,
							"rowSpan": 1,
							"column": 0,
							"row": 6,
							"layoutName": "ProfileContainer"
						},
						"enabled": true
					},
					"parentName": "ProfileContainer",
					"propertyName": "items",
					"index": 6
				},
				{
					"operation": "insert",
					"name": "UsrDirection",
					"values": {
						"layout": {
							"colSpan": 24,
							"rowSpan": 1,
							"column": 0,
							"row": 7,
							"layoutName": "ProfileContainer"
						},
						"enabled": true,
						"contentType": 5
					},
					"parentName": "ProfileContainer",
					"propertyName": "items",
					"index": 7
				},
				{
					"operation": "insert",
					"name": "UsrComment",
					"values": {
						"layout": {
							"colSpan": 24,
							"rowSpan": 1,
							"column": 0,
							"row": 8,
							"layoutName": "ProfileContainer"
						},
						"enabled": true,
						"visible": {
							"bindTo": "IsTransactionOutgoing"
						}
					},
					"parentName": "ProfileContainer",
					"propertyName": "items",
					"index": 8
				},
				{
					"operation": "insert",
					"name": "UsrType",
					"values": {
						"layout": {
							"colSpan": 24,
							"rowSpan": 1,
							"column": 0,
							"row": 9,
							"layoutName": "ProfileContainer"
						},
						"enabled": false,
						"contentType": 5
					},
					"parentName": "ProfileContainer",
					"propertyName": "items",
					"index": 9
				},
				{
					"operation": "insert",
					"name": "UsrCloseDate",
					"values": {
						"layout": {
							"colSpan": 24,
							"rowSpan": 1,
							"column": 0,
							"row": 10,
							"layoutName": "ProfileContainer"
						},
						"enabled": false
					},
					"parentName": "ProfileContainer",
					"propertyName": "items",
					"index": 10
				},
				{
					"operation": "insert",
					"name": "NotesAndFilesTab",
					"values": {
						"caption": {
							"bindTo": "Resources.Strings.NotesAndFilesTabCaption"
						},
						"items": [],
						"order": 0
					},
					"parentName": "Tabs",
					"propertyName": "tabs",
					"index": 0
				},
				{
					"operation": "insert",
					"name": "Files",
					"values": {
						"itemType": 2
					},
					"parentName": "NotesAndFilesTab",
					"propertyName": "items",
					"index": 0
				},
				{
					"operation": "insert",
					"name": "NotesControlGroup",
					"values": {
						"itemType": 15,
						"caption": {
							"bindTo": "Resources.Strings.NotesGroupCaption"
						},
						"items": []
					},
					"parentName": "NotesAndFilesTab",
					"propertyName": "items",
					"index": 1
				},
				{
					"operation": "insert",
					"name": "Notes",
					"values": {
						"bindTo": "UsrNotes",
						"dataValueType": 1,
						"contentType": 4,
						"layout": {
							"column": 0,
							"row": 0,
							"colSpan": 24
						},
						"labelConfig": {
							"visible": false
						},
						"controlConfig": {
							"imageLoaded": {
								"bindTo": "insertImagesToNotes"
							},
							"images": {
								"bindTo": "NotesImagesCollection"
							}
						}
					},
					"parentName": "NotesControlGroup",
					"propertyName": "items",
					"index": 0
				},
				{
					"operation": "insert",
					"name": "UsrTransactionMsgs",
					"values": {
						"itemType": 2,
						"markerValue": "added-detail"
					},
					"parentName": "NotesAndFilesTab",
					"propertyName": "items",
					"index": 2
				},
				{
					"operation": "merge",
					"name": "ESNTab",
					"values": {
						"order": 1
					}
				}
			]/**SCHEMA_DIFF*/
		};
	});