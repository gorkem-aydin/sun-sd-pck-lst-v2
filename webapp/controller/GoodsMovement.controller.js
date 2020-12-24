sap.ui.define([
	"./BaseController",
	"sap/ui/model/json/JSONModel",
	"../model/formatter",
	"sap/ui/model/Filter",
	"sap/ui/model/FilterOperator",
	"sap/ui/table/Column",
	"sap/m/Label",
	"sap/m/Input",
	"sap/m/MessageBox",
	"sap/m/MessageToast",
	"sap/m/MessagePopover",
	"sap/m/MessagePopoverItem",
	"sap/m/Dialog",
	"sap/m/Button",
	"sap/m/Text",
], function (BaseController, JSONModel, formatter, Filter, FilterOperator, Column, Label, Input, MessageBox, MessageToast, MessagePopover,
	MessagePopoverItem, Dialog, Button, Text) {
	"use strict";

	return BaseController.extend("com.sun.sd.packinglist.controller.GoodsMovement", {

		formatter: formatter,

		onInit: function () {
			var oMessageManager = sap.ui.getCore().getMessageManager();
			this._oModel = this.getOwnerComponent().getModel();
			this._oViewModel = this.getOwnerComponent().getModel("movementViewModel");
			this.i18nBundle = this.getOwnerComponent().getModel("i18n").getResourceBundle();
			this.getRouter().getRoute("goodsMovement").attachPatternMatched(this._onOrderDetailMatched, this);
			var oGoodsModel = new JSONModel();
			oGoodsModel.setDefaultBindingMode(sap.ui.model.BindingMode.TwoWay);
			this.setModel(oGoodsModel, "goodsModel");
			this.getView().setModel(oMessageManager.getMessageModel(), "message");
			oMessageManager.registerObject(this.getView(), true);
			this.getView().setModel(new JSONModel({
				"info": 'Mal çıkışı yapabilmek için ' + '<strong>girilen barkodların tamamı</strong> doğru olmalıdır '
			}));
		},

		_sizeTableColumnMovement: function (sId, oContext) {
			sap.ui.core.BusyIndicator.hide();
			// dynamic table 
			return new sap.ui.table.Column({
				label: new sap.m.Label({
					text: oContext.getProperty("label"),
					design: sap.m.LabelDesign.Bold
				}),
				template: new sap.m.Text({
					text: {
						model: "movementViewModel",
						path: oContext.getProperty("valuePath")
					},
					editable: false
				}),
				autoResizable: true,
				minWidth: 100,
				hAlign: sap.ui.core.TextAlign.Center
			});
		},

		onButtonBarcodeRead: function (oEvent) {
			debugger;
			sap.ui.core.BusyIndicator.show();
			var sInfo = {};
			var oMovementModel = this.getModel("goodsModel");
			var sSelectedIndex = this.byId("tableGoodsMovement").getSelectedIndex();
			if (sSelectedIndex < 0) {
				MessageBox.error(this.i18nBundle.getText("selectALine"));
				sap.ui.core.BusyIndicator.hide();
				return;
			}
			if (this.getModel("movementViewModel").getData().type === "K") {
				sInfo.VbelnVl = this.getModel("movementViewModel").getData().rows[sSelectedIndex].VbelnVl;
				sInfo.No = this.getModel("movementViewModel").getData().rows[sSelectedIndex].KoliNo;
			} else {
				sInfo.VbelnVl = this.getModel("movementViewModel").getData().rows[sSelectedIndex].VbelnVl;
				sInfo.No = this.getModel("movementViewModel").getData().rows[sSelectedIndex].AskiSayisi;
			}
			oMovementModel.setProperty("/orderId", sInfo.VbelnVl);
			oMovementModel.setProperty("/No", sInfo.No);
			var oDialog = this.byId("dlgAddBarcode");
			if (!oDialog) {
				// Create dialog via fragment factory
				oDialog = sap.ui.xmlfragment(this.oView.getId(), "com.sun.sd.packinglist.view.fragment.dialog.BarcodeRead", this);
				this.oView.addDependent(oDialog);
			}
			this.byId("inpBarcode").setValue("");
			this.byId("inpBarcode").onsapenter = function () {
				sap.ui.core.BusyIndicator.show();
				this.onEnterPress();
			}.bind(this);
			sap.ui.core.BusyIndicator.hide();
			oDialog.open();
		},

		onEnterPress: function () {
			debugger;
			sap.ui.core.BusyIndicator.show();
			var sInfo = {};
			var oBoxLine = {};
			var oDeepEntity = {},
				oParams = {},
				that = this;
			oDeepEntity.BoxPackSet = [];
			oDeepEntity.BoxHangerSet = [];
			oDeepEntity.DifferentSizeSet = [];
			var sSelectedIndex = this.byId("tableGoodsMovement").getSelectedIndex();
			let aRows = this.getModel("controlViewModel").getData().rows;
			var bNo = this.byId("inpBarcode").getValue();
			var regex = /[0-9]+/g;
			var bNo = regex.exec(bNo);
			if (!bNo) {
				MessageBox.error(this.i18nBundle.getText("barcodeControl"));
				sap.ui.core.BusyIndicator.hide();
				return;
			}
			if (this.getModel("movementViewModel").getData().type === "K") {
				sInfo.VbelnVl = this.getModel("movementViewModel").getData().rows[sSelectedIndex].VbelnVl;
				sInfo.No = this.getModel("movementViewModel").getData().rows[sSelectedIndex].KoliNo;
				for (var i = 0; i < aRows.length; i++) {
					aRows[i].KoliNo = parseInt(aRows[i].KoliNo, 10).toString();
					if (aRows[i].KoliNo === sInfo.No && aRows[i].VbelnVl === sInfo.VbelnVl) {
						oBoxLine = {};
						oBoxLine.VbelnVl = aRows[i].VbelnVl;
						oBoxLine.KoliNo = aRows[i].KoliNo;
						oBoxLine.KoliIciAdedi = aRows[i].KoliIciAdedi;
						oBoxLine.FshScStxt = aRows[i].FshScStxt;
						oDeepEntity.BoxPackSet.push(oBoxLine);
					}
				}
			} else {
				sInfo.VbelnVl = this.getModel("movementViewModel").getData().rows[sSelectedIndex].VbelnVl;
				sInfo.No = this.getModel("movementViewModel").getData().rows[sSelectedIndex].AskiSayisi;
				for (var i = 0; i < aRows.length; i++) {
					aRows[i].AskiSayisi = parseInt(aRows[i].AskiSayisi, 10).toString();
					if (aRows[i].AskiSayisi === sInfo.No && aRows[i].VbelnVl === sInfo.VbelnVl) {
						oBoxLine = {};
						oBoxLine.VbelnVl = aRows[i].VbelnVl;
						oBoxLine.AskiSayisi = aRows[i].AskiSayisi;
						oBoxLine.FshScStxt = aRows[i].FshScStxt;
						oDeepEntity.BoxHangerSet.push(oBoxLine);
					}
				}

			}
			oDeepEntity.IvExidv = bNo[0];
			oParams = {
				success: function (oSuccess) {
					sap.ui.core.BusyIndicator.hide();
					var sIndex = this.byId("tableGoodsMovement").getSelectedIndex();
					this.getModel("movementViewModel").getData().rows[sIndex].Barcode = oSuccess.IvExidv;
					this.getModel("movementViewModel").getData().rows[sIndex].Mode = "S";
					this.getModel("movementViewModel").refresh(true);
					this.byId("dlgAddBarcode").close();
					MessageToast.show(this.i18nBundle.getText("succBarcode"));
				}.bind(that),
				error: function (oError) {
					sap.ui.core.BusyIndicator.hide();
					var sIndex = this.byId("tableGoodsMovement").getSelectedIndex();
					this.getModel("movementViewModel").getData().rows[sIndex].Mode = "E";
					this.getModel("movementViewModel").getData().rows[sIndex].Barcode = "";
					this.getModel("movementViewModel").refresh(true);
				}.bind(that)
			};
			this._oModel.create("/GoodsHeaderSet", oDeepEntity, oParams);
		},

		onActionGoodsMovm: function (oEvent) {
			debugger;
			sap.ui.core.BusyIndicator.show();
			var sInfo = {};
			var oBoxLine = {};
			var oDeepEntity = {},
				oParams = {},
				that = this;
			var sRows = this.getModel("movementViewModel").getData().rows;
			let aRows = this.getModel("controlViewModel").getData().rows;
			for (var i = 0; i < sRows.length; i++) {
				if (this.getModel("movementViewModel").getData().rows[i].Mode !== "S") {
					MessageBox.error(this.i18nBundle.getText("goodsOutControl"));
					sap.ui.core.BusyIndicator.hide();
					return;
				}
			}
			oDeepEntity.BoxPackSet = [];
			oDeepEntity.BoxHangerSet = [];
			oDeepEntity.DifferentSizeSet = [];
			if (this.getModel("movementViewModel").getData().type === "K") {
				for (var i = 0; i < aRows.length; i++) {
						aRows[i].KoliNo = parseInt(aRows[i].KoliNo, 10).toString();
					for (var j = 0; j < sRows.length; j++) {
						if (aRows[i].KoliNo === sRows[j].KoliNo && aRows[i].VbelnVl === sRows[j].VbelnVl) {
							oBoxLine = {};
							oBoxLine.VbelnVl = aRows[i].VbelnVl;
							oBoxLine.KoliNo = aRows[i].KoliNo;
							oBoxLine.KoliIciAdedi = aRows[i].KoliIciAdedi;
							oBoxLine.FshScStxt = aRows[i].FshScStxt;
							oBoxLine.Exidv = sRows[j].Barcode;
							oDeepEntity.BoxPackSet.push(oBoxLine);
						}
					}
				}
			} else {
				for (var i = 0; i < aRows.length; i++) {
						aRows[i].AskiSayisi = parseInt(aRows[i].AskiSayisi, 10).toString();
					for (var j = 0; j < sRows.length; j++) {
						if (aRows[i].AskiSayisi === sRows[j].AskiSayisi && aRows[i].VbelnVl === sRows[j].VbelnVl) {
							oBoxLine = {};
							oBoxLine.VbelnVl = aRows[i].VbelnVl;
							oBoxLine.AskiSayisi = aRows[i].AskiSayisi;
							oBoxLine.FshScStxt = aRows[i].FshScStxt;
							oBoxLine.Exidv = sRows[j].Barcode;
							oDeepEntity.BoxHangerSet.push(oBoxLine);
						}
					}
				}
			}
				oDeepEntity.IvExidv = "S";
				oParams = {
					success: function (oSuccess) {
						sap.ui.core.BusyIndicator.hide();
					    MessageBox.success(this.i18nBundle.getText("goodsOutInfo"));
					}.bind(that),
					error: function (oError) {
						sap.ui.core.BusyIndicator.hide();
					}
				};
				this._oModel.create("/GoodsHeaderSet", oDeepEntity, oParams);
		},
	});
});