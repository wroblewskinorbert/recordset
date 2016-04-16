var console, $, window, setTimeout, XMLHttpRequest, wysokoscDivData = 27;
(function () {
	var ifLog = true;

	function defineProp(obj, property, getFunction, setFunction, enumerable, configurable) {
		enumerable = (enumerable === false) ? false : true;
		configurable = (configurable === false) ? false : true;
		var arg = {
			enumerable: enumerable,
			configurable: configurable
		};
		if (getFunction) {
			arg.get = getFunction;
		}
		if (setFunction) {
			arg.set = setFunction;
		}
		Object.defineProperty(obj, property, arg);
	}
	var interface = {
		add: function (name, nick) {
			nick = nick || name;
			defineProp(this, nick, function () {
				return $('#' + name).html();
			}, function (data) {
				$('#' + name).html(data);
			});
		}
	};

	function log() {
		'use strict';
		if (!ifLog)
			return;
		console.log.apply(console, arguments);
	}
	if (!Date.prototype.toJSONold) {
		Date.prototype.toJSONold = Date.prototype.toJSON;
		Date.prototype.toJSON = function () {
			var d = new Date(this);
			d.setHours(d.getHours() + 1);
			var data = Date.prototype.toJSONold.call(d);
			data = data.replace(/[TZ]/g, ' ');
			return data;
		};
	}

	function MySort(alphabet) {
		return function (a, b) {
			a = a.toLowerCase().trim();
			b = b.toLowerCase().trim();
			var index_a = alphabet.indexOf(a[0]),
				index_b = alphabet.indexOf(b[0]);
			if (index_a === index_b) {
				if (a.length > 1 && b.length > 1) {
					return porownajKolejneLiterki(a.substr(1), b.substr(1));
				}
				if (a.length == 1 && b.length > 1) {
					return -1;
				}
				if (b.length == 1 && a.length > 1) {
					return 1;
				}
				return 0;
			} else {
				return index_a - index_b;
			}
		};

		function porownajKolejneLiterki(a, b) {
			var index_a = alphabet.indexOf(a[0]),
				index_b = alphabet.indexOf(b[0]);
			if (index_a === index_b) {
				if (a.length > 1 && b.length > 1) {
					return porownajKolejneLiterki(a.substr(1), b.substr(1));
				}
				if (a.length == 1 && b.length > 1) {
					return -1;
				}
				if (b.length == 1 && a.length > 1) {
					return 1;
				}
				return 0;
			} else {
				return index_a - index_b;
			}
		}
	}
	var polishSorter = MySort('*!@_.()#^&%-=+01234567989aąbcćdeęfghijklłmnńoópqrsśtuvwxyzźż');

	function Recordset(table, idName, where, orderBy) {
		var that = this;
		this._records = new this._Records();
		this._records._parent = that;
		this._records._Record = this._Record = function (record) {
			$.extend(true, this, record);
		};
		this._Record.prototype = {};
		if (!idName) {
			idName = "id";
		}
		where = where || ' 1=1 ';
		orderBy = ' order by ' + (orderBy || idName);
		that._server = {
			cached: true,
			table: table,
			orderBy: orderBy,
			where: where,
			updatable: false,
			response: null,
			recordsOrginal: [],
			serverPath: 'http://localhost/ajax.php',
			synchro: false,
			deferred: {}
		};
		defineProp(that._server, 'parameterObject', function () {
			var obj = {
				table: that._server.table,
				condition: that._server.where + that._server.orderBy,
				action: 'select',
				data: 0
			};
			return obj;
		});
		this._idName = idName;
		this._recordsets = [];
		this._fields = [];
		this._filterParsed = [];
		this._indexArray = [];
		this.___newRecord = {};
		this._sorted = 1;
		this._history = [];
		this._htmlTable = "";
		this._div = {
			columns: [],
			$getDiv: function (czyWymazacZawartosc) {
				if (that._indexArray[that._id].$div && !czyWymazacZawartosc)
					return that._indexArray[that._id].$div;
				var divText = $('<div name="' + that._id + '" class="divTabelaRow ' + that._server.table + 'Class">');
				for (var x = 0; x < this.columns.length; x++) {
					divText.append(that[this.columns[x]].div);
				}
				that._indexArray[that._id].$div = divText;
				return divText;
			},
			wypelnijDiv: function (limit, fromPosition) {
				if (!that.$divTabela)
					return;
				that.$divTabela.empty();
				fromPosition = (typeof fromPosition !== 'undefined' ? fromPosition : this.fromPosition);
				var prevPos = that.___position;
				that.___position = fromPosition;
				limit = (typeof limit !== 'undefined') ? limit : this.limit;
				var toPosition = limit + fromPosition;
				if (toPosition > that._length) {
					toPosition = that._length;
				}
				for (;
					(that.___position < toPosition); that.___position++) {
					that.$divTabela.append(this.$getDiv());
				}
				that.___position = prevPos;
			},
			limit: 38,
			fromPosition: 0,
			focus: true,
			obliczLimit: function () {
				this.limit = Math.ceil(that.$divTabela.height() / wysokoscDivData);
			}
		};
		this._fieldChanged = function (nameOfField, value) {
			if (that._server.updatable) {
				that._update();
			}
		};
		this._positionChanged = $.Callbacks('memory unique');
		this._beforePositionChanged = $.Callbacks('memory unique');
	}

	Recordset.prototype._serverGet = function (paraObj) {
		var that = this;
		that._server.response = null;
		that._server.deferred = $.get(that._server.serverPath, paraObj).done(function (data) {
			that._server.response = data;
		});
		return that._server.deferred;
	};
	Recordset.prototype._serverGetSynchro = function (paraObj) {
		var that = this;
		that._server.response = null;
		var xhr = new XMLHttpRequest();
		xhr.open('GET', that._server.serverPath + '?table=' + paraObj.table + '&action=' + paraObj.action + '&data=' + encodeURIComponent(paraObj.data) + '&condition=' + encodeURIComponent(paraObj.condition) + '&random=' + parseInt(Math.random() * 10000000000), false);
		xhr.send();
		console.log(xhr.status);
		console.log(xhr.statusText);
		var data = $.parseJSON(xhr.response);
		that._server.response = data;
		return that._server.response;
	};
	Recordset.prototype._serverLoad = function () {
		var that = this;
		if (that._server.synchro) {
			that._serverGetSynchro(that._server.parameterObject);
			prepareDataAfterLoad();
		} else {
			that._serverGet(that._server.parameterObject).done(prepareDataAfterLoad);
		}

		function prepareDataAfterLoad() {
			that._server.recordsOrginal = that._server.response;
			that._records.setArray(that._server.response);
			that._current = Object.create(Object.create({}, {
				_parent: {
					value: that,
					enumerable: false,
					configurable: true,
					writeable: false
				}
			}));
			var rec = that._server.recordsOrginal[0];
			var keys = Object.getOwnPropertyNames(rec);
			for (var key in keys) {
				var kolumna = keys[key];
				that.___newRecord[kolumna] = null;
				that._addProperty(kolumna);
			}
		}
	};
	Recordset.prototype._requery = function () {
		var that = this;
		var obj = that._server.parameterObject;
		obj.condition = this._idName + ' = ' + this._id;
		if (that._server.synchro) {
			that._serverGetSynchro(obj);
			that._server.recordsOrginal[that._position] = that._server.response[0];
			that._records.originalRecords[that._position] = that._records[that._position] = new that._Record(that._server.response[0]);
			return that._records.originalRecords[that._position];
		} else {
			return that._serverGet(obj).done(function () {
				that._server.recordsOrginal[that._position] = that._server.response[0];
				that._records.originalRecords[that._position] = that._records[that._position] = new that._Record(that._server.response[0]);
			});
		}
	};
	Recordset.prototype._requeryAll = function () {
		var that = this;
		if (that._server.synchro) {
			that._serverGetSynchro(that._server.parameterObject);
			log('Wykonano requery All synchro');
			that._server.recordsOrginal = that._server.response;
			that._records.setArray(that._server.response);
		} else {
			return that._serverGet(that._server.parameterObject).done(function () {
				log('Wykonano requery All');
				that._server.recordsOrginal = that._server.response;
				that._records.setArray(that._server.response);
			});
		}
	};
	Recordset.prototype._update = function () {
		var that = this;
		that._server.response = null;
		var copyOfRec = {};
		var keys = Object.getOwnPropertyNames(this._records[0]);
		keys.forEach(function (ele, ind) {
			copyOfRec[ele] = that._current[ele];
			if (typeof copyOfRec[ele] === "string") {
				copyOfRec[ele] = copyOfRec[ele].replace(/\'/g, "''");
			}
		});
		delete copyOfRec[this._idName];
		var obj = that._server.parameterObject;
		obj.action = 'update';
		obj.condition = this._idName + "='" + this._id + "'";
		obj.data = JSON.stringify(copyOfRec);
		if (that._server.synchro) {
			that._serverGetSynchro(obj);
			log(that._server.response);
		} else {
			return that._serverGet(obj).done(function () {
				log(that._server.response);
			});
		}
	};
	Recordset.prototype._insert = function (record) {
		var that = this;
		that._server.response = null;
		delete record[that._idName];
		for (var x in record) {
			if (typeof record[x] === 'string')
				record[x] = record[x].replace(/\'/g, "''");
		}
		var obj = that._server.parameterObject;
		obj.action = 'insert';
		obj.condition = that._idName;
		obj.data = JSON.stringify(record);
		if (that._server.synchro) {
			that._serverGetSynchro(obj);
			afterGotId(that._server.response);
			log(that._server.response);
		} else {
			return that._serverGet(obj).done(function () {
				afterGotId(that._server.response);
				log(that._server.response);
			});
		}

		function afterGotId(record) {
			record = new that._Record(record);
			that._addRecord(record);
		}

	};

	Recordset.prototype._addRecord = function (record) {
		var that = this;
		//		record = new that._Record(record);
		that._records.push(record);
		that._records.originalRecords.push(record);
		that._index();
		that._last;
	};

	Recordset.prototype._addProperty = function (kolumna) {
		var that = this,
			pole = that._records[that.___position][kolumna];

		if ((pole && pole.date) || (typeof pole === 'string' && /\d\d\d\d.\d\d.\d\d.\d\d/g.test(pole))) {
			defineProp(that._current, kolumna, function () {
				if (that._records[that.___position] && that._records[that.___position][kolumna] !== null) {
					if (Date.prototype.isPrototypeOf(that._records[that.___position][kolumna])) {
						return that._records[that.___position][kolumna];
					}
					if (typeof that._records[that.___position][kolumna] === 'string') {
						that._records[that.___position][kolumna] = new Date(that._records[that.___position][kolumna]);
						return that._records[that.___position][kolumna];
					} else {
						that._records[that.___position][kolumna] = new Date(that._records[that.___position][kolumna].date);
						return that._records[that.___position][kolumna];
					}
				}
				console.warn("błąd");
				return null;
			}, function (value) {
				if (that._records[that.___position]) {
					if (!that._records[that.___position][kolumna]) {
						that._records[that.___position][kolumna] = {
							timezone: "UTC",
							timezone_type: 3
						};
					}
					that._records[that.___position][kolumna].date = value.toJSON();
					that._fieldChanged.call(this, kolumna, value);
				} else {
					console.warn("błąd");

				}
			});
		} else {
			defineProp(that._current, kolumna, function () {
				if (that._records[that.___position] && that._records[that.___position][kolumna] !== undefined) {
					return that._records[that.___position][kolumna];
				} else {
					console.warn("błąd");
					return null;
				}
			}, function (value) {
				if (that._records[that.___position] && that._records[that.___position][kolumna] !== undefined) {
					that._records[that.___position][kolumna] = value;
					that._fieldChanged.call(this, kolumna, value);
				} else {
					console.warn("błąd");
				}
			});
		}
		new Field(kolumna, that);
	};
	Field.prototype.filterString = function () {
		var filterText = this.filter;
		var that = this;
		if (filterText === "") {
			return true;
		}
		var thisField = 'that._current[\'' + this.name + '\']';
		if (this.type == 'string') {
			if (filterText[0] !== "/") {
				filterText = '/^\\s*' + filterText + '.*/igm.test(' + thisField + ')';
			} else {
				//                    firmy._filter('nazwa','/^([a]+)$/igm')  z literą a
				// przyklad  '/^([^m]+)$/igm'        - bez litery m
				filterText = filterText + '.test(' + thisField + ')';
			}
		} else {
			filterText = filterText.replace(/==/g, thisField + '===').replace(/>=/g, thisField + '>=').replace(/<=/g, thisField + '<=').replace(/>/g, thisField + '>').replace(/</g, thisField + '<');
		}
		this.parent._filterParsed.push('(' + filterText + ')');
		return filterText;
	};
	Recordset.prototype._filterRecordset = function () {
		var odfiltruj;
		//	console.time('Filtrowanie');
		var that = this;
		this._filterParsed = [];
		this._fields.forEach(function (ele, ind, arr) {
			ele.filterString();
		});
		var warunek = this._filterParsed.join('&&');
		if (warunek === "") {
			warunek = true;
		}
		eval("function odfiltruj(){	var result= " + warunek + "; return result;	}");
		var oldPosition = this.___position;
		this.___position = 0;
		var filteredRecords = [];
		var length = this._length;
		while (this.___position < length) {
			if (odfiltruj()) {
				filteredRecords.push(this._records[this.___position]);
			}
			this.___position++;
		}
		this.___position = oldPosition;
		//	console.timeEnd('Filtrowanie');
		return filteredRecords;
	};
	Recordset.prototype._filter = function (column, filtr) {
		this[column].filter = filtr;
		this._records.setRecords(this._filterRecordset());
		this._div.wypelnijDiv();
	};
	Recordset.prototype._clearFilter = function () {
		var keys = Object.getOwnPropertyNames(this._current);
		for (var key in keys) {
			var tmp = this[keys[key]];
			if (tmp.filter)
				tmp.filter = '';
		}
		this._records.recoverRecords();
		this._div.wypelnijDiv();
	};
	Recordset.prototype._Records = function () {
		Array.apply(this, arguments);
		/// ????????????? a co z z orginalRecords?
		this.originalRecords = [];
	};
	Recordset.prototype._Records.prototype = Object.create(Array.prototype);
	Recordset.prototype._Records.prototype.clear = function () {
		this._parent._beforePositionChanged.fire();
		while (this.length > 0) {
			this.pop();
		}
	};
	Recordset.prototype._Records.prototype.recoverRecords = function () {
		var that = this;
		this.clear();
		this.originalRecords.forEach(function (ele) {
			that.push(ele);
		});
		this._parent._index();
		this._parent._position = 0;
	};
	Recordset.prototype._Records.prototype.setArray = function (arr) {
		var that = this;
		this.clear();
		this.originalRecords = [];
		arr.forEach(function (ele, ind, array) {
			var rec = new that._Record(ele);
			that.push(rec);
			that.originalRecords.push(rec);
		});
		this._parent._indexArray = [];
		this._parent._index();
		this._parent._position = 0;

	};
	Recordset.prototype._Records.prototype.setRecords = function (arr) {
		var that = this;
		var arrCopy = [];
		arr.forEach(function (ele) {
			arrCopy.push(ele);
		});
		this.clear();

		arrCopy.forEach(function (ele, ind, array) {
			that.push(ele);
		});
		this._parent._index();
		this._parent._position = 0;
	};

	Recordset.prototype._makeTable = function (limit) {
		limit = limit || 0;
		var prePosition = this.___position;
		this.___position = 0;
		var thead = "<thead>";
		for (var x in this._current) {
			thead += "<th style='" + this[x].headerStyle + "'>" + x + "</th>";
		}
		thead += "</thead>";
		var tbody = "<tbody>";
		var length = limit ? limit : this._records.length;

		for (this.___position;
			(this.___position < length); this.___position++) {
			tbody += "<tr name='" + this[this._idName].value + "'>";
			for (var y in this._current)
				tbody += "<td style='" + this[y].dataStyle + "'>" + this[y].html + "</td>";
			tbody += "</tr>";
		}
		this._htmlTable = $("<table border=1 style='border-collapse:collapse; table-layout: fixed; font-size:9px;'>" + thead + tbody + "</table>");
		this.___position = prePosition;
		return this._htmlTable;
	};

	Recordset.prototype._addMoreRows = function (fromPosition, quantity) {
		var prePosition = this.___position;
		this.___position = fromPosition;
		var tbody = "";
		var length = this._records.length - fromPosition > quantity ? fromPosition + quantity : this._records.length;


		for (this.___position;
			(this.___position < length); this.___position++) {
			tbody += "<tr name='" + this[this._idName].value + "'>";
			for (var y in this._current)
				tbody += "<td style='" + this[y].dataStyle + "'>" + this[y].html + "</td>";
			tbody += "</tr>";
		}
		this.___position = prePosition;
		$('tbody', this._htmlTable).append(tbody);
	};

	Recordset.prototype._findId = function (myId) {
		var posit = 0,
			result = null,
			_length = this._length;
		for (posit; posit < _length; posit++) {
			if (this._records[posit][this._idName] === myId) {
				result = posit;
				break;
			}
		}
		return result;
	};

	function Field(fieldName, parent, reference) {
		var that = this;
		this.parent = parent;
		parent[fieldName] = this;
		this.toString = function () {
			return this.value.toString();
		};
		this.valueOf = function () {
			return this.value.valueOf();
		};
		Object.defineProperty(this, 'value', {
			get: function () {
				return parent._current[fieldName];
			},
			set: function (val) {
				parent._current[fieldName] = val;
			},
			enumerable: true,
			configurable: true
		});
		defineProp(this, "html", function () {
			return this.value;
		});
		this.columnStyle = '';
		this.name = fieldName;
		this.order = null;
		this.filter = "";
		this.sorted = 1;
		this.reference = true;
		if (!reference) {
			this.type = typeof this.value;
			this.reference = false;
		}
		switch (this.type) {
		case 'string':
			this.sortFunction = function (a, b, reverse) {
				reverse = reverse || 1;
				var result = polishSorter(a[that.name], b[that.name]);
				if (result !== 0)
					return result * reverse;
				return that.parent._indexArray[a[that.parent._idName]][that._idName] - that.parent._indexArray[b[that.parent._idName]][that._idName];
			};
			break;
		case 'number':

			this.sortFunction = function (a, b, reverse) {
				reverse = reverse || 1;
				var result = a[that.name] - b[that.name];
				if (result !== 0)
					return result * reverse;
				return that.parent._indexArray[a[that.parent._idName]][that._idName] - that.parent._indexArray[b[that.parent._idName]][that._idName];
			};
			break;
		}

		parent._fields.push(this);
		defineProp(this, 'dataStyle', function () {
			return this.columnStyle;
		});
		defineProp(this, 'headerStyle', function () {
			return this.columnStyle;
		});
		defineProp(this, "div", function () {
			return $('<div class="divTabela' + fieldName[0].toUpperCase() + fieldName.substr(1) + '" style="' + this.dataStyle + '">' + this.html + '</div>');
		});
	}

	Recordset.prototype._sort = function (column, reverse) {
		reverse = reverse || false;
		reverse = reverse ? -1 : 1;
		var that = this;
		that._beforePositionChanged.fire();
		if (!this[column].reference) {
			this._records.sort(function (a, b) {
				return that[column].sortFunction(a, b, reverse);
			});
		} else {
			var records = [];
			this._records.forEach(function (ele) {
				records.push(ele);
			});
			records.sort(function (a, b) {
				var tmpPos = that.___position;
				that.___position = Number(that._indexArray[a[that._idName]][that._idName]);
				var aa = that[column].value;
				that.___position = Number(that._indexArray[b[that._idName]][that._idName]);
				var bb = that[column].value;
				that.___position = tmpPos;
				var result;
				if (typeof aa == 'string') {
					result = polishSorter(aa, bb) * reverse;
				} else {
					result = (aa - bb) * reverse;
				}
				if (result !== 0)
					return result;
				return that._indexArray[a[that._idName]][that._idName] - that._indexArray[b[that._idName]][that._idName];

			});
			this._records.setRecords(records);
		}
		this._index();
		this._div.wypelnijDiv();
		this._position = 0;
	};

	{

		Recordset.prototype._index = function (indexName) {
			indexName = indexName || this._idName;
			//if (!$.isArray(this._records)) return;
			var length = this._records.length;
			for (var x = 0; x < length; x++) {
				var recordId = this._records[x][this._idName];
				this._indexArray[recordId] = this._indexArray[recordId] || {
					record: this._records[x]
				};
				this._indexArray[recordId][indexName] = x;
			}
		};

		Recordset.prototype.___position = 0;

		defineProp(Recordset.prototype, '_length', function () {
			return this._records.length;
		}, function (data) {
			this._records.length = data;
		});

		defineProp(Recordset.prototype, '_position', function () {
			return this.___position;
		}, function (poz) {
			if ((poz >= this._records.length || poz < 0) && poz !== 0) {
				console.warn('Przekroczono granice rekordsetu. Nie ma takiej pozycji ' + poz);
				return;
			}
			this._beforePositionChanged.fire();
			this.___position = poz;
			this._positionChanged.fire();
		});

		defineProp(Recordset.prototype, '_id', function () {
			if (this._position === -1)
				return null;
			return this._current[this._idName];
		}, function (sid) {
			if (this._indexArray && this._indexArray[sid] && this._indexArray[sid][this._idName] !== undefined) {
				this._position = Number(this._indexArray[sid][this._idName]);
				if (Number(this._indexArray[sid].record[this._idName]) == this._id)
					return;
			}
			var pos = this._findId(sid);
			if (pos !== null) {
				this._position = pos;
				return;
			}
			this._position = -1;
			console.warn('Nie znaleziono elementu o ' + this._idName + ' = ' + sid);
			return;
		});

		defineProp(Recordset.prototype, '_next', function () {
			if (this.___position < this._length - 1) {
				this._position++;
			}
			return this._current;
		}, function (offset) {
			var tmpPos = this.___position + offset;
			if (tmpPos < 0) {
				tmpPos = 0;
			} else if (tmpPos >= this._length) {
				tmpPos = this._length - 1;
			}
			this._position = tmpPos;
		});

		defineProp(Recordset.prototype, '_previous', function () {
			if (this.___position > 0) {
				this._position--;
			}
			return this._current;
		}, function (offset) {
			var tmpPos = this.___position - offset;
			if (tmpPos < 0) {
				tmpPos = 0;
			} else if (tmpPos >= this._length) {
				tmpPos = this._length - 1;
			}
			this._position = tmpPos;
		});

		defineProp(Recordset.prototype, '_first', function () {
			this._position = 0;
			return this._current;
		});

		defineProp(Recordset.prototype, '_last', function () {
			this._position = this._length - 1;
			return this._current;
		});

		defineProp(Recordset.prototype, '_newRecord', function () {
			var obj = new this._records._Record(this.___newRecord);
			return obj;
		});
	}

	Recordset.prototype._bind = function (name, bindedRecordset, idInMyRecordset, nameOfField) {
		Object.defineProperty(this._current, name, {
			get: function () {
				var n = name;
				if (this._parent._length === 0) {
					console.warn('Recordset nie ma rekordów!');
					return null;
				}
				bindedRecordset._id = this[idInMyRecordset];
				if (bindedRecordset._length === 0 || this[idInMyRecordset] != bindedRecordset._id) {
					console.warn('Nie dobrze - powiązany recordset nie ma rekordów lub właściwego rekordu!');
					return null;
				}
				if (nameOfField)
					return bindedRecordset._current[nameOfField];
				else
					return bindedRecordset._current;
			},
			enumerable: true,
			configurable: true
		});
		var field = new Field(name, this, true);
		//		field.reference = true;
	};

	Recordset.prototype._wypiszRekord = function () {
		return "<p>" + this._current[this._idName] + "</p>";
	};

	Recordset.prototype._wypiszWszystkieRekordy = function () {
		this._position = 0;
		var result = "";
		for (var x = 0; x < this._length; x++) {
			result += this._wypiszRekord();
			this._next;
		}
		return result;

	};

	Recordset.prototype._openTable = function (tableDiv) {
		var that = this;
		that.$divTabela = $(tableDiv);
		that._div.obliczLimit();
		that._div.wypelnijDiv();
		that.$divTabela.on('click', '.divTabelaRow', kliknietoRekord);
		$('body').on('keydown', function (e) {
			if (that._div.focus) {
				if (e.which == '38') {
					// up
					that._previous;
				} else if (e.which == '40') {
					// down
					that._next;
				} else if (e.which == '34') {
					if (e.ctrlKey) {
						that._last;
						return;
					}
					//page down
					that._next = that._div.limit - 1;
				} else if (e.which == '33') {
					if (e.ctrlKey) {
						that._first;
						return;
					}

					//page up
					that._previous = that._div.limit - 1;
				}
			}
		});
		that.$divTabela.on('wheel', function (e) {
			var delta = e.originalEvent.deltaY;
			if (delta > 0 && that._div.fromPosition + 1 < that._length) {
				that._div.fromPosition += 1;
				that._div.wypelnijDiv();
			} else if (delta < 0 && that._div.fromPosition > 0) {
				that._div.fromPosition--;
				that._div.wypelnijDiv();
			}
		});
		$(that._indexArray[that._id].$div).addClass('current');
		that.$divTabela.addClass('focusin');
		that._focus = that.$divTabela;
		that._slider = that.$divTabela.parent().find('#divTabelaSlider');
		that._slider.slider({
			orientation: 'vertical',
			range: 'max',
			min: 1,
			max: that._length,
			value: that._position,
			slide: function (event, ui) {
				that._div.fromPosition = that._length - ui.value;
				that._div.wypelnijDiv(); {
					log(ui.value);
				}
			}
		});
		that._beforePositionChanged.add(beforeClick);
		that._positionChanged.add(afterClick);

		function beforeClick() {
			$(that._indexArray[that._id].$div).removeClass('current');
		}

		function afterClick() {
			if (that._div.fromPosition > that._position) {
				that._div.fromPosition = that._position;
			} else if (that._div.fromPosition + that._div.limit - 1 <= that._position) {
				that._div.fromPosition = that._position - that._div.limit + 2;
			}
			that._div.wypelnijDiv();
			$(that._indexArray[that._id].$div).addClass('current');
			that._slider.slider('option', 'value', that._length - that._position);
		}

		function kliknietoRekord(e) {
			var id = $(this).attr('name');
			that._id = id;
		}

	};
	window.nora = window.nora || {};
	window.nora.Recordset = Recordset;
	window.nora.defineProp = defineProp;
})();