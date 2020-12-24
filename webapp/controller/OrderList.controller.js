sap.ui.define([
	"./BaseController",
	"sap/ui/model/Filter",
	"sap/ui/model/FilterOperator",
	"sap/m/MessageToast",
	"sap/m/MessageBox"
], function (BaseController, Filter, FilterOperator, MessageToast, MessageBox) {
	"use strict";

	return BaseController.extend("com.sun.sd.packinglist.controller.OrderList", {

		/* =========================================================== */
		/* lifecycle methods                                           */
		/* =========================================================== */

		/*
		 * Controller initialize event
		 * @public
		 */
		onInit: function () {
			this.getRouter().getRoute("OrderList").attachMatched(this._onPatternMatched, this);
			this.i18nBundle = this.getOwnerComponent().getModel("i18n").getResourceBundle();
		},

		onInitSmartFilter: function () {
			var oSmartFilter = this.getView().byId("idSmartListFilterBar"),
				oJSONData = {};
			if (this._startupParameters.OrderNo) {
				oJSONData.VbelnVa = this._startupParameters.OrderNo[0];
				oSmartFilter.setFilterData(oJSONData);
				this.byId("smartTablePacking").rebindTable();
			}

		},
		onChangeDestination: function (oEvent) {
			let iDest = oEvent.getSource().getProperty("value"),
				oViewModel = this.getModel("viewModel");
			let aDest = oViewModel.getProperty("/Destinations");
			for (var i = 0; i < aDest.length; i++) {
				if (aDest[i].VarisYeri === iDest) {
					var sNewDest = aDest[i].VarisYeriTxt;
				}
			}
			var sSelectedIndex = this.byId("tablePacking").getSelectedIndex();
			var sPath = this.byId("tablePacking").getContextByIndex(sSelectedIndex).sPath,
				oTableModel = this.byId("tablePacking").getModel();
			var d = oTableModel.getProperty(sPath);
			d.VarisYeriTxt = sNewDest;
			oTableModel.setProperty(sPath + "/VarisYeriTxt", sNewDest)

		},
		/* =========================================================== */
		/* Internal methods */
		/* =========================================================== */

		/*
		 * Pattern matched
		 * @private
		 * @params {sap.ui.base.Event} oEvent - Event object
		 */
		_onPatternMatched: function (oEvent) {
			//use orderNo
			this._startupParameters = this._getMyComponent().getComponentData().startupParameters;
			this.getModel().metadataLoaded().then(function () {
				this._readAuthorization();
			}.bind(this));
			this.getModel("viewModel").setProperty("/footerMode", "orderList");
			this.byId("smartTablePacking").rebindTable();
		},
		_getVarisYeri: function (sTeslimatNo) {
			var oModel = this.getView().getModel(),
				oViewModel = this.getModel("viewModel");
			var filters = new Array();
			var filterOrderNumber = new sap.ui.model.Filter("IvTeslimat", sap.ui.model.FilterOperator.EQ, sTeslimatNo);
			filters.push(filterOrderNumber);
			oViewModel.setProperty("/dialogbusy", true);
			oModel.read("/VhVarisYeriSet", {
				filters: filters,
				success: function (oData) {
					oViewModel.setProperty("/Destinations", oData.results);
				},
				error: function (oError) {
					try {
						var errMessage = JSON.parse(oError.responseText);
						errMessage = errMessage.error.message.value;
					} catch (e) {
						errMessage = oError.message;
					}
					sap.m.MessageBox.alert(errMessage, {
						icon: sap.m.MessageBox.Icon.ERROR,
						title: "Hata Oluştu!"
					});
					sap.ui.core.BusyIndicator.hide(0);
				}
			});
		},
		_readAuthorization: function () {
			var oModel = this.getView().getModel(),
				oViewModel = this.getModel("viewModel"),
				oParams = {};
			oParams.method = "GET";
			oParams.success = function (oData, oResponse) {
				oViewModel.setProperty("/exportAuth", oData.ExportAuth.IhracatciYetki);
				oViewModel.setProperty("/FasonYetki", oData.ExportAuth.FasonYetki);
			};
			oParams.error = function (oError) {};
			oModel.callFunction("/ExportAuth", oParams);
		},
		/*
		 * Check smart filter item initially 
		 * @public
		 * @returns {boolean}
		 */
		_checkSmartFilterItem: function () {
			let oSmartFilterData = this.byId("idSmartListFilterBar").getFilterData();

			return oSmartFilterData.VbelnVa ? true : false;
		},

		/*
		 * query with VhOrders 
		 * @private
		 * @returns {Promise} Fields
		 */
		_queryWithOrder: function () {
			let sPath = `/VhOrdersSet`,
				oModel = this.getModel(),
				oViewModel = this.getModel("viewModel"),
				oValue = this.byId("idSmartListFilterBar").getFilterData().VbelnVa,
				fnPromise = (fnResolve, fnReject) => {
					let mParameters = {
						filters: [
							new Filter("Vbeln", "EQ", oValue)
						],
						success: fnResolve,
						error: fnReject
					};

					oModel.read(sPath, mParameters);
				};

			oViewModel.setProperty("/busy", true);
			return new Promise(fnPromise);
		},

		/*
		 * query with VhSubOrders 
		 * @private
		 * @params {String} sOrderNo - selection order no
		 * @returns {Promise} Fields
		 */
		_queryWithSubOrder: async function (sOrderNo) {
			let sPath = `/VhSubOrdersSet`,
				oModel = this.getModel(),
				oViewModel = this.getModel("viewModel"),
				oSubOrderHeader = oViewModel.getProperty("/subOrderHeader"),
				fnPromise = (fnResolve, fnReject) => {
					let mParameters = {
						filters: [
							new Filter("Vbeln", FilterOperator.EQ, oSubOrderHeader.VbelnVa),
							new Filter("Order", FilterOperator.EQ, sOrderNo)
						],
						success: fnResolve,
						error: fnReject
					};

					oModel.read(sPath, mParameters);
				};

			oViewModel.setProperty("/busy", true);
			return new Promise(fnPromise);
		},
		_updateDelivery: function (oEditline) {
			var oUrlParameters = {};
			var oModel = this.getModel();
			oUrlParameters.VbelnVl = oEditline.VbelnVl;
			oUrlParameters.Inco1 = oEditline.Inco1;
			// oUrlParameters.Volum = oEditline.Volum;
			oUrlParameters.VarisYeri = oEditline.VarisYeri;
			oUrlParameters.Zzservistipi = oEditline.Zzservistipi;
			oUrlParameters.Zzrezervasyon = oEditline.Zzrezervasyon;
			oUrlParameters.Vsart = oEditline.Vsart;
			oUrlParameters.YuklemeYeri = oEditline.YuklemeYeri;
			oUrlParameters.Zzeksikmiktar = oEditline.Zzeksikmiktar;
			sap.ui.core.BusyIndicator.show(0);
			return new Promise((fnResolve, fnReject) => {
				let oParams = {
						success: fnResolve,
						error: fnReject
					},
					sPath = oModel.createKey("/ChangeDeliverySet", {
						VbelnVl: oUrlParameters.VbelnVl
					});

				oModel.update(sPath, oUrlParameters, oParams);
			});

		},
		_getMyComponent: function () {
			"use strict";
			var sComponentId = sap.ui.core.Component.getOwnerIdFor(this.getView());
			return sap.ui.component(sComponentId);
		},
		/* =========================================================== */
		/* Event handlers */
		/* =========================================================== */

		onEditLinePress: function (oEvent) {
			let sSelectedIndex = this.byId("tablePacking").getSelectedIndex();
			if (sSelectedIndex < 0) {
				MessageBox.error(this.i18nBundle.getText("selectALine"));
				return;
			}
			let sPath = this.byId("tablePacking").getContextByIndex(this.byId("tablePacking").getSelectedIndex()).sPath,
				oTableModel = this.byId("tablePacking").getModel(),
				sTeslimatNo = oTableModel.getProperty(sPath + "/VbelnVl"),
				sBelgeDurumu = oTableModel.getProperty(sPath + "/Zzbelgedurumu");
			// gPath = sPath;
			// gSelectedIndex = sSelectedIndex;
			if (sBelgeDurumu === "04" || sBelgeDurumu === "07") {
				oTableModel.setProperty(sPath + "/EditLine", true);
				this._getVarisYeri(sTeslimatNo);
			} else {
				MessageBox.error(this.i18nBundle.getText("onlyEditCompletedDelivery"));
				return;
			}

		},

		//KKapudere Goods Movement
		onOutLinePress: function (oEvent) {
			sap.ui.core.BusyIndicator.show();
			let sSelectedIndex = this.byId("tablePacking").getSelectedIndex();
			if (sSelectedIndex < 0) {
				MessageBox.error(this.i18nBundle.getText("selectALine"));
				sap.ui.core.BusyIndicator.hide();
				return;
			}
			let sPath = this.byId("tablePacking").getContextByIndex(this.byId("tablePacking").getSelectedIndex()).sPath,
				oTableModel = this.byId("tablePacking").getModel(),
				sCekiNo = oTableModel.getProperty(sPath + "/VbelnVl");
			let sStyle = oTableModel.getProperty(sPath + "/PaketlemeSekli");
			let sStatu = oTableModel.getProperty(sPath + "/Zzbelgedurumu");
			if (sStatu !== "07") {
				MessageBox.error(this.i18nBundle.getText("statuIncomp"));
				sap.ui.core.BusyIndicator.hide();
				return;
			}
			var sFilters = [(new Filter("IvTeslimat", FilterOperator.EQ, sCekiNo))];
			sFilters.push(new Filter("IvPaketlemeSekli", FilterOperator.EQ, sStyle))

			var that = this;
			this.getView().getModel().read("/GoodsHeaderSet", {
				urlParameters: {
					$expand: "BoxHangerSet,BoxPackSet,DifferentSizeSet"
				},
				filters: sFilters,
				success: (oData) => {
					debugger;
					sap.ui.core.BusyIndicator.hide();
					if (oData.results[0].BoxHangerSet.results.length !== 0 || oData.results[0].BoxPackSet.results.length !== 0) {
						let sBoxNo = oData.results[0].EvBaslangicKoliNo;
						let sPackData = oData.results[0].BoxPackSet.results;
						let sHangerData = oData.results[0].BoxHangerSet.results;
						let sSizeData = oData.results[0].DifferentSizeSet.results;

						if (oData.results[0].IvPaketlemeSekli === "K") {
							that.getModel("controlViewModel").setProperty("/rows", sPackData);
							that.onPackDesign(sPackData, sSizeData, sBoxNo);
						} else {
							that.getModel("controlViewModel").setProperty("/rows", sHangerData);
							that.onHangerDesign(sHangerData, sSizeData, sBoxNo);
						}
						jQuery.sap.delayedCall(100, this, () => {
							sap.ui.core.BusyIndicator.hide();
							that.getRouter().navTo("goodsMovement", {
								vbeln: oData.results[0].IvTeslimat
							});
						});
					} else {
						MessageBox.information(that.i18nBundle.getText("notFoundMovement"));
						return;
					}

				},
				error: function (e) {
					sap.ui.core.BusyIndicator.hide();
				}
			})
		},

		onPackDesign: function (sPack, sSize, sBoxNo) {
			debugger;
			var aSizes = [...new Set(sSize.map(oSize => oSize.Size))];
			var aColumns = [];
			var aColumnsDefault = [];
			var oContext = this.getModel("viewModel");
			// static columns
			var oRow = {};
			var aRows = [];

			for (let i = 0; i < sPack.length; i++) {
				let flagBoxs;
				aColumns = this._staticColumnsForPack();
				if (oRow.KoliNo === parseInt(sPack[i].KoliNo, 10).toString()) {
					oRow["dynamicColumn-" + sPack[i].FshScStxt] = parseInt(sPack[i].KoliIciAdedi, 10);
					let j = i - 1;
					oRow["dynamicColumn-" + sPack[j].FshScStxt] = parseInt(sPack[j].KoliIciAdedi, 10);
					oRow.KoliNo = parseInt(sPack[i].KoliNo, 10).toString();
					if (parseInt(sPack[i].KoliIciAdedi, 10) !== 0) {
						oRow.KoliIciAdedi = parseInt(sPack[i].KoliIciAdedi, 10) + parseInt(sPack[j].KoliIciAdedi, 10);
					}
					oRow.VbelnVl = sPack[i].VbelnVl;
					oRow.Mode = "W";
					oRow.Barcode = "";
					flagBoxs = "X";

				} else if (flagBoxs !== "X") {
					oRow = {};
					oRow["dynamicColumn-" + sPack[i].FshScStxt] = parseInt(sPack[i].KoliIciAdedi, 10);
					oRow.KoliNo = parseInt(sPack[i].KoliNo, 10).toString();
					oRow.KoliIciAdedi = parseInt(sPack[i].KoliIciAdedi, 10);
					oRow.VbelnVl = sPack[i].VbelnVl;
					oRow.Mode = "W";
					oRow.Barcode = "";
					aRows.push(oRow);
				} else {
					aRows.push(oRow);
					flagBoxs = "";

				}
			}

			// dynamic columns
			for (var i = 0; i < aSizes.length; i++) {
				aColumns.push({
					label: aSizes[i].toString(),
					valuePath: "dynamicColumn-" + aSizes[i].toString(),
					type: "Text",
					editable: "false"
				});
			}

			sBoxNo = this.i18nBundle.getText("BoxNo", sBoxNo);
			this.getModel("movementViewModel").setProperty("/defaultData", sBoxNo);
			this.getModel("movementViewModel").setProperty("/columns", aColumns);
			this.getModel("movementViewModel").setProperty("/rows", aRows);
			this.getModel("movementViewModel").setProperty("/sizes", aSizes);
			this.getModel("movementViewModel").setProperty("/type", "K");
		},

		_staticColumnsForPack: function (sPack) {
			var aColumns = [];
			aColumns.push({
				label: "Çekme no",
				valuePath: "VbelnVl",
				editable: false
			});
			aColumns.push({
				label: "Koli no",
				valuePath: "KoliNo",
				editable: false
			});
			aColumns.push({
				label: "Koli içi adet",
				valuePath: "KoliIciAdedi",
				editable: false
			});

			return aColumns;
		},

		onHangerDesign: function (sHanger, sSize, sBoxNo) {
			debugger;
			var aSizes = [...new Set(sSize.map(oSize => oSize.Size))];
			var aColumns = [];
			var aColumnsDefault = [];
			var oContext = this.getModel("viewModel");
			// static columns
			var oRow = {};
			var aRows = [];

			for (var i = 0; i < sHanger.length; i++) {
				aColumns = this._staticColumnsForHanger();
				aRows.push({
					VbelnVl: sHanger[i].VbelnVl,
					AskiSayisi: parseInt(sHanger[i].AskiSayisi, 10),
					Mode: "W",
					Barcode: ""
				});

			}

			// dynamic columns
			for (var i = 0; i < aSizes.length; i++) {
				aColumns.push({
					label: aSizes[i].toString(),
					valuePath: "dynamicColumn-" + aSizes[i].toString(),
					type: "Text",
					editable: "false"
				});
			}
			sBoxNo = this.i18nBundle.getText("BoxNo", sBoxNo);
			this.getModel("movementViewModel").setProperty("/defaultData", sBoxNo);
			this.getModel("movementViewModel").setProperty("/columns", aColumns);
			this.getModel("movementViewModel").setProperty("/rows", aRows);
			this.getModel("movementViewModel").setProperty("/sizes", aSizes);
			this.getModel("movementViewModel").setProperty("/type", "A");
		},

		_staticColumnsForHanger: function (sPack) {
			var aColumns = [];
			aColumns.push({
				label: "Çeki list no",
				valuePath: "VbelnVl",
				editable: false
			});
			aColumns.push({
				label: "Askı Sayısı",
				valuePath: "AskiSayisi",
				editable: false
			});
			return aColumns;
		},

		//KKapudere Goods Movement

		onButtonDeliverySavePress: function () {
			let sSelectedIndex = this.byId("tablePacking").getSelectedIndex();

			if (sSelectedIndex < 0) {
				MessageBox.error(this.i18nBundle.getText("selectALine"));
				return;
			}
			let sPath = this.byId("tablePacking").getContextByIndex(sSelectedIndex).sPath,
				oTableModel = this.byId("tablePacking").getModel(),
				sBelgeDurumu = oTableModel.getProperty(sPath + "/EditLine");
			if (!sBelgeDurumu) {
				MessageBox.error(this.i18nBundle.getText("pressEditMode"));
				return;
			}
			let fnSuccess = (oData) => {
					MessageToast.show(this.i18nBundle.getText("successfullyEdited"));
					sap.ui.core.BusyIndicator.hide();
					this.byId("tablePacking").getModel().setProperty(this.byId("tablePacking").getContextByIndex(this.byId("tablePacking").getSelectedIndex())
						.sPath + "/EditLine", false);
				},
				fnError = err => {
					sap.ui.core.BusyIndicator.hide();
				},
				fnFinally = () => {};
			this._updateDelivery(oTableModel.getProperty(sPath))
				.then(fnSuccess)
				.catch(fnError)
				.finally(fnFinally);

		},

		/*
		 * Selection row changed with all smart tables
		 * @public
		 * @param {sap.ui.base.Event} oEvent - Event object
		 */
		onButtonDetailPress: function (oEvent) {
			let oViewModel = this.getModel("viewModel"),
				oRowContext = oEvent.getSource().getBindingContext(),
				oRouter = this.getRouter();

			if (!oRowContext) {
				return;
			}

			jQuery.sap.delayedCall(100, this, () => {
				sap.ui.core.BusyIndicator.show(0);
				oRouter.navTo("orderDetail", {
					orderId: oRowContext.getProperty("VbelnVl"),
					orderStatus:  oRowContext.getProperty("Zzoncekistatu")
				});
			});
			if (oViewModel.getProperty("/exportAuth") === true) {

				oViewModel.setProperty("/FasonAuthority", false);
			} else {
				oViewModel.setProperty("/FasonAuthority", false);
				if (oRowContext.getProperty("Zzbelgedurumu") === "03" || oRowContext.getProperty("Zzbelgedurumu") === "06") {
					oViewModel.setProperty("/FasonAuthority", true);
				}
			}

			// oViewModel.setProperty("/onCekiStatu", oRowContext.getProperty("Zzoncekistatu"));
			oViewModel.setProperty("/confirmAuthority", oRowContext.getProperty("Yetki"));
			oViewModel.setProperty("/cekmeTuru", oRowContext.getProperty("CekmeTuru"));
			oViewModel.setProperty("/answerPacking/Teslimat", oRowContext.getProperty("VbelnVl"));
			oViewModel.setProperty("/answerPacking/CekmeTuru", oRowContext.getProperty("CekmeTuru"));
			oViewModel.setProperty("/orderStatus", oRowContext.getProperty("Zzbelgedurumu"));
			oViewModel.setProperty("/editMode", false);

		},
		/*
		 * Before routing create packing  
		 * @public
		 * @param {sap.ui.base.Event} oEvent - Event object
		 */
		onCreatePacking: async function (oEvent) {
			let oViewModel = this.getModel("viewModel"),
				fnSuccess = (oData) => {
					oViewModel.setProperty("/subOrderHeader", oData.results[0]);
					oViewModel.setProperty("/order", oData.results);
				},
				fnError = err => {},
				fnFinally = () => {
					oViewModel.setProperty("/busy", false);
				};

			if (!this._checkSmartFilterItem()) {
				MessageBox.error("Belge oluşturabilmek için müşteri ana siparişi filtresi dolu olmalıdır");
				return;

			}

			await this._queryWithOrder()
				.then(fnSuccess)
				.catch(fnError)
				.finally(fnFinally);

			oViewModel.setProperty("/subOrder", []);
			oViewModel.setProperty("/selectedSubOrders", []);
			this.openDialog("dialogSubOrder", "com.sun.sd.packinglist.view.fragment.dialog.SubOrder").then((oDialog) => {});
		},

		/*
		 * Dialog Orders selected item
		 * @public
		 * @param {sap.ui.base.Event} oEvent - Event object
		 */
		onChangeOrder: async function (oEvent) {
			let oSelectedItem = oEvent.getSource().getSelectedItem().getKey(),
				oViewModel = this.getModel("viewModel"),
				fnSuccess = (oData) => {
					oViewModel.setProperty("/subOrder", oData.results);
				},
				fnError = err => {},
				fnFinally = () => {
					oViewModel.setProperty("/busy", false);
				};

			await this._queryWithSubOrder(oSelectedItem)
				.then(fnSuccess)
				.catch(fnError)
				.finally(fnFinally);
		},

		/*
		 * Nav to detail page
		 * @public
		 * @param {String} sCekmeTuru - Çekme Türü '01'- '02'
		 */
		onSendPackingPress: function (sCekmeTuru) {
			let oSide = {},
				aSide = [],
				oViewModel = this.getModel("viewModel"),
				oResourceBundle = this.getResourceBundle(),
				oModel = this.getModel(),
				aSubOrderKeys = oViewModel.getProperty("/selectedSubOrders"),
				sVbeln = oViewModel.getProperty("/subOrderHeader/VbelnVa"),
				oRouter = this.getRouter(),
				sPackageType = "",
				sSubOrderDetail = "",
				aSubOrder = [],
				bNotEqual = false;

			if (aSubOrderKeys.length === 0) {
				MessageToast.show(oResourceBundle.getText("message.subOrder"))
				return;
			}

			aSubOrderKeys.forEach(oSubOrderKeys => {
				let sPath = oModel.createKey("/VhSubOrdersSet", {
					Vbeln: sVbeln,
					Posnr: oSubOrderKeys
				});
				aSubOrder.push(oModel.getProperty(sPath));
			});

			aSubOrder.forEach(oSubOrder => {
				let oPackageType = aSubOrder.find(oFind => oFind.Zzpaketlemesekli !== oSubOrder.Zzpaketlemesekli);
				let oCountryType = aSubOrder.find(oFind => oFind.Ulke !== oSubOrder.Ulke);
				let oSubOrderDetail = aSubOrder.find(oFind => oFind.Zzaltsiparisdetay !== oSubOrder.Zzaltsiparisdetay);

				if (oPackageType || oSubOrderDetail || oCountryType) {
					bNotEqual = true;
				}
			});

			if (bNotEqual) {
				MessageToast.show(oResourceBundle.getText("message.packageAndSubOrder"))
				return;
			}

			aSubOrder.forEach(oSubOrder => {
				oSide.Vbeln = oSubOrder.Vbeln;
				oSide.Posnr = oSubOrder.Posnr;
				oSide.Lgort = oSubOrder.Lgort;
				oSide.CekmeTuru = sCekmeTuru;
				aSide.push(oSide);
				oSide = {};
				sPackageType = oSubOrder.Zzpaketlemesekli;
				sSubOrderDetail = oSubOrder.Zzaltsiparisdetay;
			});

			oViewModel.setProperty("/to_SdDocument", aSide);
			oViewModel.setProperty("/cekmeTuru", sCekmeTuru);
			oViewModel.setProperty("/editMode", true);
			oViewModel.setProperty("/packageType", sPackageType);
			oViewModel.setProperty("/subOrderDetail", sSubOrderDetail);
			oViewModel.setProperty("/weight", []);

			//  GAYDIN	sCekmeTuru === 01 ise  ZSD_023_FM_PAKET_BITIR_KONTROL isminde bir rfc çağır 

			if (sCekmeTuru === "01") {
							var oDeepEntity = {},
					oParams = {},
					that = this,

					aSdDocument = oViewModel.getProperty("/to_SdDocument");

				oDeepEntity.IvLgort = (aSdDocument.length > 0 ? aSdDocument.find(item => item.Vbeln !== "").Lgort : "");
				oDeepEntity.to_SdDocument = [];
				oDeepEntity.to_SdDocument = oViewModel.getProperty("/to_SdDocument");
				sap.ui.core.BusyIndicator.show(0);
				oParams = {
					success: function (oSuccess) {

						sap.ui.core.BusyIndicator.hide();
						oRouter.navTo("orderDetail", {});
					
					}.bind(that),
					error: function (oError) {
						sap.ui.core.BusyIndicator.hide();
					}
				};
				oModel.create("/FinishPackControlSet", oDeepEntity, oParams);
			} else {
				oRouter.navTo("orderDetail", {});
			}

		},

		/*
		 * Read reject text and open fragment
		 * @public
		 * @param {sap.ui.base.Event} oEvent -Event object
		 */
		onDisplayRejectReasonPress: async function (oEvent) {
			let oRowContext = oEvent.getSource().getBindingContext(),
				sDelivery = oRowContext.getProperty("VbelnVl"),
				oViewModel = this.getModel("viewModel"),
				fnSuccess = (oData) => {
					oViewModel.setProperty("/answerPacking", oData);
					oViewModel.setProperty("/answerPackingEnableMode", false);
				},
				fnError = err => {},
				fnFinally = () => {
					oViewModel.setProperty("/busy", false);
				};

			await this._readRejectReason(sDelivery)
				.then(fnSuccess)
				.catch(fnError)
				.finally(fnFinally);

			this.openDialog("dialogAnswerPacking", "com.sun.sd.packinglist.view.fragment.dialog.AnswerPacking").then((oDialog) => {});
		},

		_readRejectReason: async function (sDelivery) {
			let oModel = this.getModel(),
				sPath = oModel.createKey(`/ConfirmationSet`, {
					Teslimat: sDelivery
				}),
				oViewModel = this.getModel("viewModel"),
				fnPromise = (fnResolve, fnReject) => {
					let mParameters = {
						success: fnResolve,
						error: fnReject
					};

					oModel.read(sPath, mParameters);
				};

			oViewModel.setProperty("/busy", true);
			return new Promise(fnPromise);
		}

	});
});