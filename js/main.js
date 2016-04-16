var nbsp = '&nbsp;'
var wysokoscDivData = 27;
var impet = {},
	nora, $;

$(document).ready(function () {
	var defineProp = nora.defineProp, Recordset = nora.Recordset;
	impet.firmy = new Recordset('firmy');
	impet.firmy._serverLoad();
	impet.telefony = new Recordset('FirmyNumeryTelefonow');
	impet.telefony._serverLoad();
	impet.pracownicy = new Recordset('impetPracownicy');
	impet.pracownicy._serverLoad();
	impet.wojewodztwa = new Recordset('plWojewództwa');
	impet.wojewodztwa._serverLoad();
	impet.powiaty = new Recordset('plPowiaty');
	impet.powiaty._serverLoad();
	impet.gminy = new Recordset('plGminy');
	impet.gminy._serverLoad();
	impet.miejscowosci = new Recordset('plMiejscowosci');
	impet.miejscowosci._serverLoad();
	impet.firmyPracownicy = new Recordset('firmyPracownicy');
	impet.firmyPracownicy._serverLoad();
	impet.firmyPracownicy._wypiszRekord = function () {
		return '<span id="pracwonik' + this._current.id + '" class="firmaPracownik">' + this.imie.value + ' ' + this.nazwisko.value + '</span><br />';
	};
	impet.telefony._server.deferred.done(function () {
		impet.telefony._wypiszRekord = function () {
			var telString = "";
			var nrWidoczny = this._current.numer;
			if (this._current['podstawowy'] == 1) {
				nrWidoczny = '<b>' + nrWidoczny + '</b>';
			}
			telString += '<a href="callto:+48' + this._current.numer + '" title="' + this._current.typ + '">' + nrWidoczny + '</a></br>';
			return telString;
		};

	})
	impet.materialyRozdaneLista = new Recordset('MrktgMatRozdLista');
	impet.materialyRozdaneLista._serverLoad();
	$.when(impet.materialyRozdaneLista._server.deferred).done(
		function () {
			impet.materialyRozdane = new Recordset('MrktgMatRozd');
			impet.materialyRozdane._serverLoad();
			impet.materialyRozdane._server.deferred.done(function () {
				impet.materialyRozdane._bind('co', impet.materialyRozdaneLista, 'materialId', 'nazwa');
			});
		}
	);


	$.when(impet.powiaty._server.deferred, impet.wojewodztwa._server.deferred).done(function () {
		impet.powiaty._bind('wojewodztwo', impet.wojewodztwa, 'wojewodztwoId');
	});
	$.when(impet.powiaty._server.deferred, impet.gminy._server.deferred).done(function () {
		impet.gminy._bind('powiat', impet.powiaty, 'powiatId');
	});
	$.when(impet.miejscowosci._server.deferred, impet.gminy._server.deferred).done(function () {
		impet.miejscowosci._bind('gmina', impet.gminy, 'gminaId');
	});

	$.when(impet.miejscowosci._server.deferred, impet.firmy._server.deferred, impet.pracownicy._server.deferred, impet.firmyPracownicy._server.deferred).done(function () {
		impet.fc = impet.firmy._current;
		//firmy._server.updatable = true;
		impet.firmy._bind('miejscowosc', impet.miejscowosci, 'miejscowoscId');
		impet.firmy._bind('miejscowoscNazwa', impet.miejscowosci, 'miejscowoscId', 'nazwa');
		defineProp(impet.firmy.uwagi, 'html', function () {
			return "<div style='height:25px; overflow:hidden;'>" + this.value + "</div>";
		});
		defineProp(impet.firmy.miejscowosc, 'html', function () {
			return this.value.nazwa;
		});
		defineProp(impet.firmy.ocena, 'html', function () {
			return "<div style='height:100%; width:" + ((this.value !== null) ? (this.value * 100 / 6).toFixed(0) : "100") + "%; background-color:" + ((this.value !== null) ? "green" : "grey") + ";' >" + ((this.value !== null) ? (this.value) : (-1)) + "</div>";
		});
		defineProp(impet.firmy.priorytet, 'html', function () {
			return "<div style='height:100%; width:" + ((this.value !== null) ? (this.value * 100 / 6).toFixed(0) : "100") + "%; background-color:" + ((this.value !== null) ? "red" : "grey") + ";' >" + ((this.value !== null) ? (this.value) : (-1)) + "</div>";
		});

		impet.firmy.kod.columnStyle = 'overflow:hidden; width:54px;';
		impet.firmy.uwagi.columnStyle = 'overflow:hidden; width:400px;';
		impet.firmy.email.columnStyle = 'overflow:hidden; width:200px;';
		impet.firmy.www.columnStyle = 'overflow:hidden; width:100px;';
		impet.firmy.nazwa.columnStyle = 'overflow:hidden; width:250px;';
		impet.firmy.ocena.columnStyle = 'overflow:hidden; width:40px;';
		impet.firmy.priorytet.columnStyle = 'overflow:hidden; width:40px;';
		impet.firmy.miejscowoscNazwa.columnStyle = 'overflow:hidden; width:170px;';
		impet.firmy.ulica.columnStyle = ' width:180px;'
		impet.firmy.miejscowoscId.columnStyle = 'display:none;';
		impet.firmy.miejscowosc.columnStyle = 'display:none;';
		/*
				interface.add('firmaFaktury', 'faktury');
				interface.add('firmaUwagi', 'uwagi');
				interface.add('firmaZdarzenia', 'zdarzenia');
				interface.add('firmaPodsumowanie', 'podsumowanie');
				interface.add('firmaNazwa', 'nazwa');
				interface.add('firmaUlica', 'ulica');
				interface.add('firmaKod', 'kod');
				interface.add('firmaMiejscowosc', 'miejscowoscNazwa');
				interface.add('firmaTelefony', 'telefony');
				interface.add('firmaPracownicy', 'pracownicy');
				interface.add('firmaMaile', 'maile');
				//		interface.add('',''); 
				firmy._wyswietlFirme = function () {
						var that = firmy;
						interface.faktury = nbsp;
						interface.uwagi = nbsp;
						interface.zdarzenia = nbsp;
						interface.podsumowanie = nbsp;
						interface.pracownicy = nbsp;
						interface.telefony = nbsp;
						interface.maile = nbsp;
						for (var interf in interface) {
							if (fc[interf]) {
								interface[interf] = fc[interf];
							}
						}
						if (fc.khId) {
							firmy._tabelaFaktury = new SpisFaktur(fc.khId, 20, SpisFaktur.prototype.callback);
							impet.podsumowanieFirmy(fc.khId);
						}
						$('#firmaUwagi').scrollTop(0);
						$('#firmaZdarzenia').scrollTop(0);
						//		firmy._zdarzenia = new Zdarzenia(fc.id, 20, Zdarzenia.prototype.callback);
						interface.zdarzenia = "";
						interface.telefony = impet.telefony._wypiszWszystkieRekordy();

						//wypiszTelefony(fc.id);
						interface.pracownicy = firmyPracownicy._wypiszWszystkieRekordy();
					}
					//wypiszPracownikow(fc.id);
		*/
		function filterRestOfRecords() {
			impet.telefony._clearFilter();
			impet.telefony._filter('firmaId', '==' + impet.firmy._current.id);
			impet.firmyPracownicy._clearFilter();
			impet.firmyPracownicy._filter('firmaId', '==' + impet.firmy._current.id);
		}
		impet.firmy._positionChanged.add(filterRestOfRecords);
		/*
				firmy._positionChanged.add(firmy._wyswietlFirme);
				zdarzenia = new Recordset('zdarzenia', 'zdId', 'zdFirmaId = ' + firmy._id, ' zdDataZak desc ');
				zdarzenia._serverLoad();
				$.when(pracownicy._server.deferred, firmy._server.deferred, zdarzenia._server.deferred).done(function () {
					zdarzenia._bind('kto', pracownicy, 'zdWykonawcaId');
					defineProp(zdarzenia, 'firma', function () {
							if (zdarzenia._current.zdFirmaId = firmy._current.id) {
								return firmy._current;
							} else {
								console.warn("niezgodnosc id firmy i id zdarzenia");
								return null;
							}

						})
						//zdarzenia._bind('firma',firmy,'zdFirmaId');

				})
				zdarzenia._wypiszZdarzenia= function () {
						var that = this;
						var zdarzeniaDiv = $('<div style="width: 90%; position:relative;"></div>');
						var length = zdarzenia._length;
						zdarzenia._position = 0;
						var element = zdarzenia._current;
						for (var x = 0; x < length; x++) {
							var thatDiv = '<div id="zdarzenieOpis' + element[element._parent._idName] + '" class="opisZdarzeniaRamka">' +
								'<div name="dataAndWhat" class="opisZdarzeniaDataSymbol"></div>' +
								'<div name="whoAndFinishd" class="opisZdarzeniaInicjalyTick"></div>' +
								'<div name="opisZdarzenia" class="opisZdarzenia">&nbsp;</div></div>';
							thatDiv = $(thatDiv);
							switch (element.zdTyp) {
							case 1:

							case 0:
								element.typ = tablicaZnakow.telefon;
								break;
							case 10:
								element.typ = tablicaZnakow.wyjazd + tablicaZnakow.klepsydra;
								break;
							case 11:
								element.typ = tablicaZnakow.wyjazd + tablicaZnakow.zaliczone;
								break;
							case 12:
								element.typ = tablicaZnakow.wyjazd + tablicaZnakow.nieZaliczone;
								break;
							case 13:
								element.typ = tablicaZnakow.wyjazd + tablicaZnakow.niewiadomo;
								break;
							case 14:
								element.typ = tablicaZnakow.niewiadomo;
							}
							thatDiv.attr('title', element.zdDataZak.toJSON().slice(0, 4));
							thatDiv.find('[name=dataAndWhat]').append((element.zdDataZak.toJSON().slice(5, 10)) + ' ' + element.typ);
							var zdZakonczone = "";
							if (element.zdZakonczone) {
								zdZakonczone = tablicaZnakow.finished;
							}
							var iniKolor = element.kto.inicialyKolor;
							thatDiv.find('[name=whoAndFinishd]').append($(iniKolor + ' ' + zdZakonczone));
							thatDiv.find('[name=opisZdarzenia]').html(element.zdOpis);
							that.html = thatDiv.html();
							thatDiv.appendTo('#firmaZdarzenia');
							zdarzenia._next;
						}
					}
				
				zdarzenia._loadForCurrentFrmId = function () {
					zdarzenia._requeryAll();
					zdarzenia._server.deferred.done(function(){zdarzenia._wypiszZdarzenia()});
				}
				firmy._positionChanged.add(zdarzenia._loadForCurrentFrmId);
				zdarzenia._server.deferred.done(function () {
					Object.defineProperty(zdarzenia._server, 'where', {
						get: function () {
							return 'zdFirmaId = ' + firmy._id;
						}
					});

				});
				console.log('Wczytano firmy');
		*/
		impet.miejscowosci.id.columnStyle = 'overflow:hidden; width:54px;';
		impet.miejscowosci.nazwa.columnStyle = 'overflow:hidden; width:200px;';
		impet.miejscowosci.wspN.columnStyle = 'overflow:hidden; width:130px;';
		impet.miejscowosci.wspE.columnStyle = 'overflow:hidden; width:130px;';

		impet.firmy._div.columns = ['nazwa', 'ocena', 'priorytet', 'miejscowoscNazwa', 'ulica', 'uwagi'];
		impet.miejscowosci._div.columns = ['id', 'nazwa', 'wspN', 'wspE'];

		impet.firmy._firmyOtwartoTabele = function () {
			var that = this;
			impet.fd = impet.firmy.$divTabela;
			impet.fd.on('contextmenu', '.divTabelaNazwa', function (e) {
				e.preventDefault(true);
				e.stopPropagation();
				$(that._indexArray[that._id].$div).removeClass('current');
				that._history.push({
					records: that._records,
					indexArray: that._indexArray
				});
				that._records.setRecords(that._records);
				that._sort('nazwa', that.nazwa.sorted == 1 ? false : true);
				that.nazwa.sorted = -that.nazwa.sorted;
			});
			impet.fd.on('contextmenu', '.divTabelaMiejscowoscNazwa', function (e) {
				e.preventDefault(true);
				e.stopPropagation();
				$(that._indexArray[that._id].$div).removeClass('current');
				that._history.push({
					records: that._records,
					indexArray: that._indexArray
				});
				that._records.setRecords(that._records);
				that._sort('miejscowoscNazwa', that.miejscowoscNazwa.sorted == 1 ? false : true);
				that.miejscowoscNazwa.sorted = -that.miejscowoscNazwa.sorted;
			});
			impet.fd.on('contextmenu', '.divTabelaUlica', function (e) {
				e.preventDefault(true);
				e.stopPropagation();
				$(that._indexArray[that._id].$div).removeClass('current');
				that._history.push({
					records: that._records,
					indexArray: that._indexArray
				});
				that._records.setRecords(that._records);
				that._sort('ulica', that.ulica.sorted == 1 ? false : true);
				that.ulica.sorted = -that.ulica.sorted;
			});

		}
		impet.firmy._openTable(impet.firmy._firmyOtwartoTabele);
		/*
				firmy.dodajMarker = function (x, jaki, size) {
					function zamianaPriorytetuNaKolor(priorytet) {
						if (priorytet === null)
							priorytet = -1;
						priorytet++;
						tabKolorow = ['cccccc', 'ff2233', 'd02233', 'a04455', '8a9933', '68bb53', '40dd00', '05ff44'];
						return tabKolorow[priorytet];
					}
					switch (jaki) {
					case 1:

						this._records[x].marker = new google.maps.Marker({
							map: map,
							position: new google.maps.LatLng(this._current.wspN, this._current.wspE)
						});
						return;
						break;
					case 2:
						this._records[x].marker = new google.maps.Marker({
							map: map,
							position: new google.maps.LatLng(this._current.wspN, this._current.wspE),
							icon: MarkerGenerator.takeIkonaZLiterkaUrl
						});
						break;
					case 3:
						//			MarkerGenerator.kolorWypelnienia=MarkerGenerator.losowyKolor;
						//			MarkerGenerator.kolorObrysu=MarkerGenerator.losowyKolor;
						this._records[x].marker = new google.maps.Marker({
							map: map,

							position: new google.maps.LatLng(this._current.wspN, this._current.wspE),
							icon: MarkerGenerator.takeIkonaZLiterkaICieniemUrl
						});
						break;
					case 4:
						MarkerGenerator.kolorWypelnienia = zamianaPriorytetuNaKolor(this._records[x].priorytet);
						//MarkerGenerator.kolorObrysu=MarkerGenerator.losowyKolor;
						var faktor = 7 * ((this._records[x].ocena === null ? -1 : this._records[x].ocena) + 4);
						var icon = {
							url: MarkerGenerator.takeIkonaZLiterkaICieniemUrl,
							scaledSize: new google.maps.Size(faktor * size / 10, faktor * size / 10)
						}
						if (!this._records[x].marker) {
							this._records[x].marker = new google.maps.Marker({
								map: map,
								position: new google.maps.LatLng(this._current.wspN, this._current.wspE),
								icon: icon
							})
						} else {
							this._records[x].marker.set('icon', icon);
						};
						break;

					default:
						MarkerGenerator.tekst = this._current.nazwa;
						MarkerGenerator.skala = ((this._current.ocena + 2) / 9).toFixed(1);
						this._records[x].marker = new google.maps.Marker({
							map: map,
							position: new google.maps.LatLng(this._current.wspN, this._current.wspE),
							icon: MarkerGenerator.takeIkonaZnapisemUrl
						});
						break;
					}
				};
				Firmy.markeryWczytajWszystkie = function (jakie, size) {
					if (!size) {
						size = localStorage['size'];
						if (!size) {
							size = 10;
							$('#ogranicznikZoomu').val(10);
						}
					}
					localStorage['size'] = size;
					var tmp = firmy.___position;
					firmy._records.forEach(function (ele, ind) {
						firmy.___position = ind;
						firmy.dodajMarker(ind, jakie, size);

					})
					firmy.___position = tmp;
				}
				Firmy.markeryUsunWszystkie = function () {
					var tmp = firmy.___position;
					firmy._records.forEach(function (ele, ind) {
						firmy.___position = ind;
						firmy._records[ind].marker.set('map', null);
						delete firmy._records[ind].marker;
					})
					firmy.___position = tmp;
				}
				Firmy.markeryPrzelaczWidocznosc = function () {
					var tmpMap = map;
					var tmp = firmy.___position;
					if (firmy._records[0].marker && firmy._records[0].marker.get('map')) {
						tmpMap = null;
					}
					firmy._records.forEach(function (ele, ind) {
						firmy.___position = ind;
						firmy._records[ind].marker.set('map', tmpMap)
					})
					firmy.___position = tmp;
				}

				gm = google.maps;


				$('#ogranicznikZoomu').on('change', function (e) {
						var value = $(this).val();
						Firmy.markeryWczytajWszystkie(4, value);
					})
					
					*/


		//		$.when(firmyPracownicy._server.deferred).done(function(){
		//		//		debugger;
		//
		//		})
		//defineProp(firmy._div)

		//	firmy.nazwa.filter = 'tes';
		//	firmy.ocena.filter = '==5||==6||==4||==0||==null';
		/*

	firmy.ulica.filter=".*mie";
firmy.ulica.filter="";

firmy._history.push({records:firmy._records, htmlTable:firmy.$table.detach()});firmy._records=firmy._filterRecordset(); firmy._openTable();

firmy._records=firmy._history.pop();
firmy._htmlTable=firmy._records.htmlTable;
firmy._records=firmy._records.records;
firmy.$table.empty().append(firmy._htmlTable);


*/
	});


	impet.ustaweinia = new Recordset('ustawienia');
	impet.ustaweinia._serverLoad();

	{
		var tablicaZnakow = {
			telefon: '<span style="font-size:1.6em;">☎</span>',
			telefonBialy: '<span style="font-size:1.6em;">☏</span>',
			zaliczone: '<span style="font-size:1.6em;color:green;">✔</span>',
			nieZaliczone: '<span style="font-size:1.6em;color:red;">✖</span>',
			niewiadomo: '<span style="font-size:1.6em;color:blue;">?</span>',
			list: '<span style="font-size:1.6em;">✉</span>',
			klepsydra: '<span style="font-size:1.6em;">⌛</span>',
			zegarek: '<span style="font-size:1.6em;">⌚</span>',
			olowek: '<span style="font-size:1.6em;">✏</span>',
			pioro: '<span style="font-size:1.6em;">✒</span>',
			wyjazd: "<img width='24' src='data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAACAAAAAgCAIAAAGLH901AAAABnRSTlMA/wD/AP83WBt9AAAACXBIWXMAAA7DAAAOwwHHb6hkAAAC7klEQVR4nKVWTUhUURQ+waxa9UdEyEwoJRUoZbWosIKiAiOFINRdBCatwoTUokKnRSjVwnKiFi20TWAxUgsJzGhTKwfaFEZBGESREkS76bvv3Ll/77437+XHY97MPffc8/edcydTLpepggy/Bhvpa6ny48pcIOlaIfcUypTx6EAuJGRA6mB5esTW4f2dY9TcZauwxvi5QMBHjhykD6+sHRm1kU/XAseG6yPjwmr6syj1LAFWgR+faF2tLWDM3KVTw7YAhzy5KFbFUePddLSXBuq0GGELwewY4WGcL1JDixEHY21Orkp3o+JgPOig1iHhpD8+B1zMd48pP6914hQUlr7FKpSmaPSEtXJzv/isaRCckcVHWLvb6e9vUcP3L/x24J7OBk7F7twuyjXRng4rLRRk9PmQLJR2CWebFAFUrEd6xDNbEJyyYkDKj/UJmoWhuFWlDmHEpRW8enqZzk4kU0CgYBaApN36lUBhR5tUWJNNYAHOKKIi/eAIt3mkArIJ6nK9ucBVLMAZpj9VCqw61aPQv4l+fnEXocPt4lG48dmyU7DrJMmHymd3ChqXii5BVI21S3wGulg1awz0DNpyQNoBW02AyG8nRN9pBYZi68NO8blylSwwAsUDgvC5iVrUdSkMDCe4Z0KVxVJAlzrcZJh1TN0PaZE6ZgZS/WxAsIwCcp7Mu2NjuQY2bov7uSwD6MR7bdJ3Br6jNxFH96Q15FMbCB9tIspMCgNQwyDAcJ28JGeyCRC7fdTtihQG4P6jM27fmoBJtBAeVPv0nZSXGwXu98xYK4rsaBm+1b34TxYlh5xfZnGqZsMB4lB96zHAL3AAdxJfs0425t/oifz9o7iTgcUFWloIFOc8BfcYADAB1RD0AjypaaT6Q7T1MNXti9w2dZ1e3tZWU9QAOjxzi9fiCttyldZvlkM5nQEGLoLWfFwEwOv7+nt1A8jM9uOiNuEmCkP9Y/AbwP+d2r20oZ6yTZHT0QsM1+lhP/H+AYvTHj4n1sS+AAAAAElFTkSuQmCC'>",
			finished: '<span style="font-size:1.6em;color:blue;">☑</span>'
		}

//		MarkerGenerator = {
//			kolorObrysu: '3344aa',
//			kolorWypelnienia: '5599cc',
//			tekst: "Moje pierwsze maleństwo|No i prawdziwe szaleństwo|Super",
//			// przedzielany |
//			grubosc: '_',
//			wielkoscCzcionki: '11',
//			wyrownanie: 'h',
//			wyrownaniePomoc: {
//				'l': 'do lewej',
//				'h': 'do środkaq',
//				'r': 'do prawej'
//			},
//			skala: '0.5',
//			rotacja: '-45',
//			generuj: function (map, position) {
//				return new google.maps.Marker({
//					map: map,
//					position: position,
//					icon: MarkerGenerator.url
//				});
//			},
//			zCieniem: '_withshadow',
//			literka: '®'
//		}
//		defineProp(MarkerGenerator, "takeIkonaZnapisemUrl", function () {
//			var url = 'https://chart.googleapis.com/chart?chst=d_map_spin&chld=' + MarkerGenerator.skala + '|' + MarkerGenerator.rotacja + '|' + MarkerGenerator.kolorWypelnienia + '|' + MarkerGenerator.wielkoscCzcionki +
//				'|' + MarkerGenerator.grubosc + '|' + MarkerGenerator.tekst.replace(/\s/g, '+');
//			return url;
//		});
//		defineProp(MarkerGenerator, "takeNapisUrl", function () {
//			var url = 'https://chart.googleapis.com/chart?chst=d_text_outline&chld=' + MarkerGenerator.kolorWypelnienia + '|' + MarkerGenerator.wielkoscCzcionki + '|' + MarkerGenerator.wyrownanie + '|' + MarkerGenerator.kolorObrysu +
//				'|' + MarkerGenerator.grubosc + '|' + MarkerGenerator.tekst.replace(/\s/g, '+');
//			return url;
//		});
//		defineProp(MarkerGenerator, "takeIkonaZLiterkaUrl", function () {
//			var url = 'https://chart.googleapis.com/chart?chst=d_map_pin_letter&chld=' + MarkerGenerator.literka + '|' + MarkerGenerator.kolorWypelnienia + '|' + MarkerGenerator.kolorObrysu
//			return url;
//		});
//		defineProp(MarkerGenerator, "takeIkonaZLiterkaICieniemUrl", function () {
//			var url = 'https://chart.googleapis.com/chart?chst=d_map_pin_letter_withshadow&chld=' + MarkerGenerator.literka + '|' + MarkerGenerator.kolorWypelnienia + '|' + MarkerGenerator.kolorObrysu
//			return url;
//		});
//		defineProp(MarkerGenerator, "losowyKolor", function () {
//			return ('00000' + Math.floor(Math.random() * 256 * 256 * 256).toString(16).substr(0, 6)).substr(-6);
//		}); {
//			function MapLabel(opt_options) {
//				this.set('fontFamily', 'sans-serif');
//				this.set('fontSize', 12);
//				this.set('fontColor', '#000000');
//				this.set('strokeWeight', 4);
//				this.set('strokeColor', '#ffffff');
//				this.set('align', 'center');
//
//				this.set('zIndex', 1e3);
//
//				this.setValues(opt_options);
//			}
//			
//			
//			MapLabel.prototype = new google.maps.OverlayView;
//			window['MapLabel'] = MapLabel;
//			/** @inheritDoc */
//			MapLabel.prototype.changed = function (prop) {
//				switch (prop) {
//				case 'fontFamily':
//				case 'fontSize':
//				case 'fontColor':
//				case 'strokeWeight':
//				case 'strokeColor':
//				case 'align':
//				case 'text':
//					return this.drawCanvas_();
//				case 'maxZoom':
//				case 'minZoom':
//				case 'position':
//					return this.draw();
//				}
//			};
//			/**
//			 * Draws the label to the canvas 2d context.
//			 * @private
//			 */
//			MapLabel.prototype.drawCanvas_ = function () {
//				var canvas = this.canvas_;
//				if (!canvas)
//					return;
//
//				var style = canvas.style;
//				style.zIndex = /** @type number */ (this.get('zIndex'));
//
//				var ctx = canvas.getContext('2d');
//				ctx.clearRect(0, 0, canvas.width, canvas.height);
//				ctx.strokeStyle = this.get('strokeColor');
//				ctx.fillStyle = this.get('fontColor');
//				ctx.font = this.get('fontSize') + 'px ' + this.get('fontFamily');
//
//				var strokeWeight = Number(this.get('strokeWeight'));
//
//				var text = this.get('text');
//				if (text) {
//					if (strokeWeight) {
//						ctx.lineWidth = strokeWeight;
//						ctx.strokeText(text, strokeWeight, strokeWeight);
//					}
//
//					ctx.fillText(text, strokeWeight, strokeWeight);
//
//					var textMeasure = ctx.measureText(text);
//					var textWidth = textMeasure.width + strokeWeight;
//					style.marginLeft = this.getMarginLeft_(textWidth) + 'px';
//					// Bring actual text top in line with desired latitude.
//					// Cheaper than calculating height of text.
//					style.marginTop = '-0.4em';
//				}
//			};
//			/**
//			 * @inheritDoc
//			 */
//			MapLabel.prototype.onAdd = function () {
//				var canvas = this.canvas_ = document.createElement('canvas');
//				var style = canvas.style;
//				style.position = 'absolute';
//
//				var ctx = canvas.getContext('2d');
//				ctx.lineJoin = 'round';
//				ctx.textBaseline = 'top';
//
//				this.drawCanvas_();
//
//				var panes = this.getPanes();
//				if (panes) {
//					panes.mapPane.appendChild(canvas);
//				}
//			};
//			MapLabel.prototype['onAdd'] = MapLabel.prototype.onAdd;
//			/**
//			 * Gets the appropriate margin-left for the canvas.
//			 * @private
//			 * @param {number} textWidth  the width of the text, in pixels.
//			 * @return {number} the margin-left, in pixels.
//			 */
//			MapLabel.prototype.getMarginLeft_ = function (textWidth) {
//				switch (this.get('align')) {
//				case 'left':
//					return 0;
//				case 'right':
//					return -textWidth;
//				}
//				return textWidth / -2;
//			};
//			/**
//			 * @inheritDoc
//			 */
//			MapLabel.prototype.draw = function () {
//				var projection = this.getProjection();
//
//				if (!projection) {
//					// The map projection is not ready yet so do nothing
//					return;
//				}
//
//				if (!this.canvas_) {
//					// onAdd has not been called yet.
//					return;
//				}
//
//				var latLng = /** @type {google.maps.LatLng} */ (this.get('position'));
//				if (!latLng) {
//					return;
//				}
//				var pos = projection.fromLatLngToDivPixel(latLng);
//
//				var style = this.canvas_.style;
//
//				style['top'] = pos.y + 'px';
//				style['left'] = pos.x + 'px';
//
//				style['visibility'] = this.getVisible_();
//			};
//			MapLabel.prototype['draw'] = MapLabel.prototype.draw;
//			/**
//			 * Get the visibility of the label.
//			 * @private
//			 * @return {string} blank string if visible, 'hidden' if invisible.
//			 */
//			MapLabel.prototype.getVisible_ = function () {
//				var minZoom = /** @type number */ (this.get('minZoom'));
//				var maxZoom = /** @type number */ (this.get('maxZoom'));
//
//				if (minZoom === undefined && maxZoom === undefined) {
//					return '';
//				}
//
//				var map = this.getMap();
//				if (!map) {
//					return '';
//				}
//
//				var mapZoom = map.getZoom();
//				if (mapZoom < minZoom || mapZoom > maxZoom) {
//					return 'hidden';
//				}
//				return '';
//			};
//			/**
//			 * @inheritDoc
//			 */
//			MapLabel.prototype.onRemove = function () {
//				var canvas = this.canvas_;
//				if (canvas && canvas.parentNode) {
//					canvas.parentNode.removeChild(canvas);
//				}
//			};
//			MapLabel.prototype['onRemove'] = MapLabel.prototype.onRemove;
//		}
	}
});