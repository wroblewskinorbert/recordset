/*jslint browser: true, devel: true, debug: true, nomen: true*/
var $, Proxy, rec, google, map, trasyPunktyWybrana, tw, odc, trasy, tra, trasyPunkty, odcinkiWgKey1, unescape;

function defineProp(obj, property, getFunction, setFunction, enumerable, configurable) {
	'use strict';
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

function Records(table, idName, autoLoad, where, orderBy) {
	'use strict';
	var that = this,
		records = [],
		pToId = [],
		recordsById = {
			"-1": -1
		},
		position = -1,
		oldId = [],
		oldPosition = [],
		changedProperty = $.Callbacks('memory unique'),
		firstLoad = true;
	pToId[-1] = -1;
	this.changedProperty = changedProperty;
	this.startFunction = function () {};
	this.Record = function (originalRecord, order) {
		order = order || pToId.length;
		var complex = {
			id: originalRecord[that.idName],
			originalPosition: order,
			position: order,
			originalRecord: originalRecord,
			record: this,
			dirties: {}
		};
		if (firstLoad) {
			that.stworzPrototypRecordu(originalRecord);
			firstLoad = false;
		}
		pToId.splice(order, 0, complex.id);
		recordsById[complex.id] = complex;
		//        that.positionToId[order] = complex.id;
		that.idToPosition[complex.id] = order;
		that.byId[complex.id] = complex.record;
		that.recordsOrder[order] = complex.record;
		defineProp(this, that.idName, function () {
			return complex.id;
		}, function (data) {
			that.id = data;
		}, false);
		defineProp(this, '_parent', function () {
			return complex;
		});
		that.startFunction.call(that, complex.record);
	};
	that.Record.prototype = {};
	that.Record.defaultValues = {};
	this.stworzPrototypRecordu = function (rec) {
		var x, thatRecord = this,
			temp;

		function zawartoscPrototypu(name) {
			defineProp(that.Record.prototype, name, function () {
				if (recordsById[this[that.idName]].originalRecord.hasOwnProperty(name)) {
					return recordsById[this[that.idName]].originalRecord[name];
				}
				if (that.Record.defaultValues.hasOwnProperty(name)) {
					return that.Record.defaultValues[name];
				}
				return null;
			}, function (data) {
				var comp = recordsById[this[that.idName]],
					or = comp.originalRecord;
				or[name] = data;
				that.columns[name]["-dirty"] = true;
				comp.dirties[name] = true;
				if (that.updatable) {
					that.update();
				}
				changedProperty.fire(or, name, data);
			}, false);
		}
		for (x in rec) {
			if (rec.hasOwnProperty(x)) {
				zawartoscPrototypu(x);
			}
		}
	};
	this.idChanged = $.Callbacks('memory unique');
	this.byId = [];
	this.records = [];
	this.positionToId = [];
	this.recordsOrder = {};
	this.idToPosition = [];
	this.columns = [];
	if (typeof table === 'string') {
		this.table = table;
		if (idName) {
			this.idName = idName;
		}
		if (autoLoad === false) {
			this.autoLoad = autoLoad;
		}
		if (where) {
			this.where = where;
		}
		if (orderBy) {
			this.orderBy = orderBy;
		}
	} else if (table && table.table) {
		$.extend(this, table);
	}
	this.originalWhere = this.where;
	this.originalOrderBy = this.orderBy;
	defineProp(that, "length", function () {
		return pToId.length;
	}, function (data) {}, false, true);
	defineProp(that, "position", function () {
		return position;
	}, function (data) {
		if (pToId[data] || data === -1) {
			position = data;
			if (that.columns.length) {
				that.columns.clearDirties();
			}
			that.idChanged.fire();
			return;
		} else {
			debugger;
			console.warn("Nie ma takiej pozycji!!!");
			return;
		}
	});
	defineProp(that, "id", function () {
		return pToId[position];
	}, function (data) {
		if (data === pToId[position]) {
			return;
		}
		if (recordsById[data]) {
			oldId.push(pToId[position]);
			oldPosition.push(position);
			that.position = recordsById[data].position;
			return;
		} else {
			console.warn("Nie ma takiego indexu!!!");
			return;
		}
	});
	defineProp(that, "record", function () {
		return recordsById[pToId[position]].record;
	});
	this.clear = function () {
		records.length = 0;
		recordsById = {
			"-1": -1
		};
		pToId.length = 0;
		this.idToPosition.length = 0;
		this.positionToId.length = 0;
		//        this.record = {};
		this.byId = {};
	};
	this.fillByRecords = function (response) {
		var len = response.length,
			i = 0,
			row,
			idName = that.idName;
		this.clear();
		records = response;
		position = 0;
		if (!records.length) {
			console.warn("zbiór pusty!");
			position = -1;
			//            return;
		}
		records[-1] = $.extend({}, that.Record.defaultValues);
		that.columns = Object.getOwnPropertyNames(records[position]);
		that.originalColumns = that.columns.slice();
		that.columns.clearDirties = function () {
			this.forEach(function (ele, ind, arr) {
				delete arr[ele]['-dirty'];
			});
		};

		function columnsToRecorsProperty(name, ind, columns) {
			columns[name] = {
				html: ["", ""],
				old: [],
				typeOf: typeof records[position][name],
				filter: ""
			};
		}
		that.columns.forEach(columnsToRecorsProperty);
		records.forEach(function (record, ind, arr) {
			that.byId[record[that.idName]] = new that.Record(record, ind, arr);
		});
		that.addNew();
	};
	this.positionUndo = function () {
		if (oldId.length) {
			this.id = oldId.pop();
		}
	};
	this.addNew = function (originRec) {
		var newRec,
			newRecord;
		originRec = originRec || {};
		newRec = $.extend({}, that.Record.defaultValues, originRec);
		newRec[that.idName] = -1;
		newRecord = new that.Record(newRec, -1);
		//      return newRecord;
	};
	this.getCopy = function (deep) {
		var res;
		deep = deep || true;
		res = $.extend(deep, {}, recordsById[pToId[position]].originalRecord);
		return res;
	};
	this.getArray = function () {
		var t = [];
		recordsById.forEach(function (ele, ind, arr) {
			t.push(ele.record);
		});
		return t;
	};
	this.getRow = function () {
		return recordsById[pToId[position]].originalRecord;
	};
	this.setRecord = function (data) {
		var keys = Object.getOwnPropertyNames(data),
			idOfRecord = data[that.idName];
		if (that.id === -1) {
			//            data = new this.Record(data);
			records[-1].id = idOfRecord;
		} else {
			that.id = idOfRecord;
		}
		keys.forEach(function (ele, ind, arr) {
			if (recordsById[pToId[position]].originalRecord[ele] !== data[ele]) {
				recordsById[pToId[position]].originalRecord[ele] = data[ele];
				delete recordsById[pToId[position]]._parent.dirties[ele];
				//                records[position][ele] = data[ele];
			}
		});
		return data;
	};
	this.makeIdToPosition = function () {
		var keys = Object.getOwnPropertyNames(recordsById);
		that.idToPosition.length = 0;
		that.positionToId.length = 0;
		keys.forEach(function (ele, ind, arr) {
			ele.position = null;
		});
		pToId.forEach(function (ele, ind, arr) {
			recordsById[ele].position = ind;
			that.idToPosition[ele] = ind;
			that.positionToId[ind] = ele;
		});
	};

	this.deleteRecord = function () {
		var that = this,
			deletedPosition = that.position,
			x;
		that.action = 'delete';
		//		debugger;
		this.get().deferred.done(function (res, succ) {
			if (succ === "success") {
				pToId.splice(deletedPosition, 1);
				delete that.idToPosition[pToId[position]];
				delete that.positionToId[deletedPosition];
				delete recordsById[pToId[position]];
				// todo - usunąć z rekord z naszego zbioru
				that.makeIdToPosition();
				if (deletedPosition < that.length) {
					that.position = deletedPosition;
				} else if (deletedPosition > 0) {
					that.position = deletedPosition - 1;
				} else {
					that.id = -1;
				}
				console.log(res);
			}
			return;
		});
	};
	Object.defineProperty(this, 'async', {
		get: function () {
			var res = {
				state: $.ajaxSetup().async
			};
			defineProp(res, 'tru', function () {
				$.ajaxSetup({
					async: true
				});
			});
			defineProp(res, 'fal', function () {
				$.ajaxSetup({
					async: false
				});
			});
			return res;
		}
	});
	if (this.autoLoad) {
		this.loadAll();
	}
}
Records.prototype.idName = 'id';
Records.prototype.updatable = false;
Records.prototype.serverPath = 'http://localhost/recordset/js/ajax.php';
Records.prototype.synchro = false;
Records.prototype.autoLoad = true;
Records.prototype.table = 'firmy';
Records.prototype.orderBy = Records.prototype.idName;
Records.prototype.where = ' 1=1 ';
Records.prototype.data = 0;
Records.prototype.action = 'select';
Records.prototype.response = null;
Records.prototype.deferred = {};
Records.parameters = function () {
	'use strict';
	return {
		id: this.prototype.idName,
		updatable: this.prototype.updatable,
		serverPath: this.serverPath,
		synchro: this.prototype.synchro,
		autoLoad: this.prototype.autoLoad,
		table: this.prototype.table,
		orderBy: this.prototype.orderBy,
		where: this.prototype.where
	};
};
Records.prototype.parameters = function () {
	'use strict';
	var that = this,
		para = {
			table: this.table,
			condition: ((this.where === "") ? " 1=1 " : " " + this.where) + ((this.orderBy === "") ? "" : " ORDER BY " + this.orderBy),
			action: that.action
		};
	defineProp(para, 'data', function () {
		if (that.action === 'select' || that.action === 'delete' || that.action === 'requery') {
			return that.data;
		}
		var res = that.getCopy(true);
		delete res[that.idName];
		that.columns.forEach(function (ele, ind, arr) {
			if (!res._parent.dirties[ele]) {
				delete res[ele];
			} else if (typeof res[ele] === 'string') {
				res[ele] = res[ele].replace(/\'/g, "''");
			}
		});
		res = JSON.stringify(res);
		return res;
	}, false, true);
	return para;
};
Records.prototype.get = function () {
	'use strict';
	var paraObj = this.parameters(),
		that = this,
		data,
		deferred;
	if (this.action === 'update' || this.action === 'delete') {
		paraObj.condition = this.idName + "='" + this.id + "'";
	}
	if (this.action === 'insert') {
		paraObj.condition = that.idName;
	}
	if (this.action === 'requery') {
		paraObj.action = 'select';
		paraObj.condition = " WHERE " + this.idName + "='" + this.id + "'";
	}
	this.response = null;
	that.deferred = $.get(that.serverPath, paraObj).done(function (data) {
		if (that.columns.length) {
			that.columns.clearDirties();
		}
		that.response = data;
	});
	return that;
};
Records.prototype.loadAll = function () {
	'use strict';
	var that = this;
	this.action = 'select';
	this.where = this.originalWhere;
	this.orderBy = this.originalOrderBy;
	this.data = 0;
	this.get().deferred.done(function (records) {
		that.fillByRecords(records);
	});
};
Records.prototype.loadOrder = function () {
	'use strict';
	var that = this,
		idToPositionOld = this.idToPosition,
		positionToIdOld = this.positionToId;
	that.idToPosition = {};
	that.positionToId = {};
	this.action = 'select';
	// domyślne ustawienia - czyli select i data ===0
	this.data = '"' + this.idName + '"';
	this.get().deferred.done(function () {
		that.loadedOrder = that.response;
		that.loadedOrder.forEach(function (ele, ind, arr) { /////////////////////////to do!
		}, that);
	});
};
Records.prototype.update = function () {
	'use strict';
	var that = this,
		actualPosition = this.position,
		actualId = this.id;
	that.action = 'update';
	this.get().deferred.done(function (res) {
		if (res[0][that.idName] === that.id) {
			that.setRecord(res[0]);
		}
		console.log(res[0]);
	});
};
Records.prototype.insert = function () {
	'use strict';
	var that = this;
	if (this.id !== -1) {
		console.warn('Nie byłeś na nowym rekordzie');
		return;
	}
	that.action = 'insert';
	this.get().deferred.done(function (res, succ) {
		that.setRecord(res);
		console.log(res);
	});
};
Records.prototype.requery = function () {
	'use strict';
	var that = this,
		tempWhere = that.where,
		tempOrderBy = that.orderBy;
	that.action = 'requery';
	that.data = 0;
	this.get().deferred.done(function (res, succ) {
		that.setRecord(res[0]);
		console.log(res);
		that.where = tempWhere;
		that.orderBy = tempOrderBy;
	});
};
Records.prototype.next = function () {
	'use strict';
	this.position += 1;
	return this;
};
Records.prototype.previous = function () {
	'use strict';
	this.position -= 1;
	return this;
};
Records.prototype.first = function () {
	'use strict';
	this.position = 0;
	return this;
};
Records.prototype.last = function () {
	'use strict';
	this.position = this.length - 1;
	return this;
};


$(function () {
	'use strict';
	rec = new Records('firmy', 'id', false);
	//	console.log(rec.async.fal);

	function zmianaDannychFirmy(rec, name, temp) {
		//		console.log(rec[name], temp);
	}
	rec.changedProperty.add(zmianaDannychFirmy);
	rec.startFunction = function (row) {
		//	debugger
		if (row.wspN === null) {
			row.wspN = 48;
		}
		if (row.wspE === null) {
			row.wspE = 16;
		}
		row.mvc = new google.maps.MVCObject();
		row.mvc.set('position', new google.maps.LatLng(row.wspN, row.wspE));
		row.marker = new google.maps.Marker({
			map: map,
			title: row.nazwa
		});
		row.marker.bindTo('position', row.mvc);
	};
	window.map = new google.maps.Map(document.getElementById('mapCanvas'), {
		zoom: 7,
		center: {
			lat: 52,
			lng: 21
		}
	});
	var map = window.map,
		miasta,
		prac,
		impetPracownicy;
	//debugger;
	rec.loadAll();
	miasta = window.miasta = new Records('plMiejscowosci', 'id', true, '1=1', 'nazwa');
	prac = window.prac = new Records('firmypracownicy');
	odc = new Records('odcinki', 'key1', false);
	impetPracownicy = window.impetPracownicy = new Records('impetPracownicy', 'id2');
	$.when(miasta.deferred, prac.deferred, rec.deferred, impetPracownicy.deferred).done(function () {
		console.timeEnd('nora');
	});
});
/*
trasyPunkty = new Records('trasyPunktyView', 'id', true, '1=1', ' kiedy desc');
trasyPunktyWybrana = new Records('trasyPunktyView', 'id', false, '1=1', ' kolejnosc asc');

function Wyjazd(parent) {
    'use strict';
    Records.call(this, 'trasyPunktyView', 'id', true, 'id=' + parent._trasaId, ' kolejnosc asc');
}
Wyjazd.prototype = Object.create(Records.prototype);
defineProp(Wyjazd.prototype, 'firma', function () {
    'use strict';
    return rec.record[this.firmaId];
});
defineProp(Wyjazd.prototype, 'positionOfFirma', function () {
    'use strict';
    return this.firma.mvc.get('position');
});

function Trasy(nameOfTable) {
    'use strict';
    var that = this;

    function zmianaWyjazdu() {
        var wyjazd = that.record.wyjazd;
        if (!wyjazd) {
            wyjazd = new Wyjazd(that);
            that.record.wyjazd = wyjazd;
            wyjazd.deferred.done(function () {});
        }
    }
    defineProp(this, 'wyjazd', function () {
        return that.record.wyjazd;
    });
    nameOfTable = nameOfTable || 'trasyView';
    Records.call(this, nameOfTable, 'id', true, '1=1', ' kiedy desc');
    this.odcinkiWgKey1 = [];
    this.pytanieOSciezke = [];
    this.deferred.done(function (data) {
        this.idChanged(zmianaWyjazdu);
    });
}
Trasy.prototype = Object.create(Records.prototype);
Trasy.prototype.constructor = Trasy;
Trasy.prototype.toKeys = function (pos) {
    'use strict';
    var a = pos.toUrlValue().split(','),
        b = Number(a[1]).toFixed(6);
    a = Number(a[0]).toFixed(6);
    return a + ',' + b;
};
defineProp(trasyPunktyWybrana, 'where', function () {
    'use strict';
    return ' trasaId = ' + trasy.id;
});
tw = trasyPunktyWybrana;
defineProp(trasyPunktyWybrana, 'firma', function () {
    'use strict';
    rec.id = tw._firmaId;
    return rec.getRow();
});
defineProp(tw, 'posit', function () {
    'use strict';
    return this.firma.p.get('position');
});
defineProp(tw, 'key', function () {
    'use strict';
    return "'" + this.toKeys(tw.posit) + "'";
});
defineProp(tw, 'keys', function () {
    'use strict';
    var x;
    odc.where = ' key1 = ' + tw.key + ' AND key2= ';
    tw.next();
    odc.where += tw.key;
    return odc.where;
});
*/
/*
//trasy.odcinkiWgKey1 = [];
trasy.wczytajZapisaneSciezki = function () {
	'use strict';
	var x, a, b;
	odc.where = "";
	odc.orderBy = "";
	tw.first();
	for (x = 0; x < tw.length - 3; x += 1) {
		a = trasy.odcinkiWgKey1[tw.key.replace(/\'/g, "")];
		tw.next();
		b = tw.key;
		tw.previous();
		if (a && a[b]) {
			continue;
		}
		odc.where += tw.keys;
		if (x < tw.length - 4) {
			odc.where += ' OR ';
		}
	}
	return $.post(odc.serverPath, odc.parameters()).done(function (data) {
		trasy.data = data;
	});
};
//trasy.pytanie = [];
trasy.wszystkieDrogi = [];
trasy.odcinkiJeszczeProste = [];
trasy.wyznaczDroge = function () {
	'use strict';
	var punkty, firmy, pozycja, x, a, b, key1, key2, mvc;
	tra = trasy.getRow();
	punkty = tw.getArray();
	punkty.sort(function (a, b) {
		return a.kolejnosc - b.kolejnosc;
	});
	if (trasy.wszystkieDrogi[trasy.id]) {
		return;
		// chyba tak
	}
	trasy.wszystkieDrogi[trasy.id] = {};
	trasy.wszystkieDrogi[trasy.id].poly = tra.poly = new google.maps.Polyline({
		map: map
	});
	trasy.wszystkieDrogi[trasy.id].path = tra.path = tra.poly.getPath();
	firmy = [];
	pozycja = [];
	punkty.forEach(function (ele, ind, tab) {
		firmy.push(rec.record[ele.firmaId]._parent.getRow());
	});
	firmy.forEach(function (ele, ind, arr) {
		pozycja.push(ele["--position"]);
	});
	tra.paths = tra.poly.latLngs;
	for (x = 0; x < pozycja.length - 1; x += 1) {
		mvc = new google.maps.MVCArray();
		mvc.push(pozycja[x]);
		mvc.push(pozycja[x + 1]);
		tra.paths.setAt(x, mvc);
		key1 = toKeys(pozycja[x]);
		key2 = toKeys(pozycja[x + 1]);
		b = trasy.odcinkiWgKey1[key1] = trasy.odcinkiWgKey1[key1] || {};
		if (b[key2]) {
			console.warn('o Jezu!');
			a = b[key2];
			a.wyznacz = false;
			mvc.clear();
			mvc.j = a.mvc.getArray();
			//			a.mvc.getArray().forEach(function (ele, ind) {
			//				mvc.push(ele);
			//			});
		} else {
			a = b[key2] = {
				'key2': key2,
				'key1': key1,
				mvc: mvc,
				wyznacz: true
			};
			trasy.odcinkiJeszczeProste.push(a);
			trasy.pytanie.push("key1='" + a.key1 + "'," + "key2='" + a.key2 + "'");
		}
	}
	defineProp(trasy, 'poly', function () {
		return trasy.wszystkieDrogi[trasy.id].poly;
	});
	trasy.wczytajZapisaneSciezki().done(function (data) {
		data.forEach(function (ele, ind, arr) {
			a = trasy.odcinkiWgKey1[ele.key1];
			if (a) {
				b = a[ele.key2];
				if (b) {
					b.mvc.clear();
					a = google.maps.geometry.encoding.decodePath(unescape(ele.data));
					b.mvc.j = a;
					b.wyznacz = false;
				}
			}
		});
	});
};
trasy.deferred.done(function (data, suc) {
	'use strict';
	trasy.position = 41;
	trasyPunktyWybrana.loadAll();
});
rec.showIconOfMarkers = function (quest) {
	'use strict';
	var fir;
	fir = rec.getArray();
	fir.forEach(function (ele) {
		ele.marker.setVisible(quest);
	});
};
trasy.odcinkiJeszczeProste.wyrzucSkonczone = function () {
	'use strict';
	var t = this.slice(),
		that = this;
	this.length = 0;
	t.forEach(function (ele, ind) {
		if (ele.wyznacz) {
			that.push(ele);
		}
	});
};
//rec.showIconOfMarkers(false);
var directionsService = new google.maps.DirectionsService();

function keyToPosition(key) {
	'use strict';
	var position;
	key = key.split(',');
	position = new google.maps.LatLng(key[0], key[1]);
	return position;
}

trasy.odcinkiJeszczeProste.makeArrayOfKeys = function () {
	'use strict';
	var tab = [],
		prevKey = null;
	this.forEach(function (ele, ind, arr) {
		if (prevKey !== ele.key1) {
			tab.push(ele.key1);
		}
		tab.push(ele.key2);
		prevKey = ele.key2;
	});
	return tab;
};

trasy.calculateRoute = function (fromIndex, toIndex, tab) {
	'use strict';
	//	debugger;
	var x, y, waypoints = [],
		request;
	if (fromIndex >= toIndex - 1 || toIndex - fromIndex > 9) {
		return;
	}
	request = {
		origin: keyToPosition(tab[fromIndex]),
		destination: keyToPosition(tab[toIndex]),
		travelMode: google.maps.TravelMode.DRIVING,
		unitSystem: google.maps.UnitSystem.METRIC
	};
	for (x = fromIndex + 1; x < toIndex; x += 1) {
		waypoints.push({
			location: keyToPosition(tab[x]),
			stopover: true
		});
	}
	if (waypoints.length) {
		request.waypoints = waypoints;
	}
	directionsService.route(request, function (result, status) {
		var a, b, x, legs;
		if (status === google.maps.DirectionsStatus.OK) {
			legs = result.routes[0].legs;
			legs.forEach(function (ele, ind) {
				ele.mypath = ele.steps.reduce(function (a, b) {
					return a.concat(b.path);
				}, []);
			});
			for (x = fromIndex; x < toIndex - 1; x += 1) {
				a = trasy.odcinkiWgKey1[tab[x]];
				b = a && a[tab[x + 1]];
				if ((a) && (b) && b.wyznacz) {
					b.mvc.clear();
					b.mvc.j = legs[x - fromIndex].mypath;
					b.wyznacz = false;
					odc.addNew();

				}
			}
		}
	});
};*/
//var tablicaZPozycjami = trasy.odcinkiJeszczeProste.makeArrayOfKeys();
defineProp(this, 're', function () {
	'use strict';
	return this.rec.record;
});