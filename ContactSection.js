define("ContactSectionV2", [], function () {
    return {
        entitySchemaName: "Contact",
        methods: {
            onShowContactFullNameAgeClick: function () {
                var activeRow = this.$ActiveRow;
                if (activeRow) {
                    var gridData = this.$GridData;
                    var contact = gridData.get(activeRow);
                    var contactId = contact.$Id;

                    var esq = this.Ext.create("Terrasoft.EntitySchemaQuery", {
                        rootSchemaName: "Contact"
                    });
                    esq.addColumn("Name", "Name");
                    esq.addColumn("Age", "Age");
                    esq.getEntity(contactId, function (response) {
                        if (response.success) {
                            this.showInformationDialog(
                                "Name: " + response.entity.$Name +
                                "\n" +
                                "Age: " + response.entity.$Age);
                        }
                        else {
                            window.console.log(response);
                            this.showInformationDialog("Ошибка запроса имени и возраста контакта.");
                        }
                    }, this);
                }
            }
        },
        diff: /**SCHEMA_DIFF*/[
            {
                "operation": "insert",
                "parentName": "CombinedModeActionButtonsCardLeftContainer",
                "propertyName": "items",
                "name": "ShowContactFullNameAgeButton",
                "values": {
                    itemType: Terrasoft.ViewItemType.BUTTON,
                    caption: { bindTo: "Resources.Strings.ShowFullNameAgeForSelectedContactButtonCaption" },
                    click: { bindTo: "onShowContactFullNameAgeClick" },
                    enabled: true
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
