var $, XMLHttpRequest, console, Proxy, rec, google, map, gm, trasyPunktyWybrana, tw, odc, trasy, tra, trasyPunkty, odcinkiWgKey1, unescape;

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
		recordsById = {},
		position = -1,
		id = null,
		oldId = [],
		changedProperty = $.Callbacks('memory unique'),
		firstLoad = true;
	
	this.changedProperty=changedProperty;
	this.startFunction = function () {};
	this.Record = function (originalRecord, order) {
		if(typeof order ==='undefined'){
			order= records.push(originalRecord) -1;
			delete recordsById[-1];
			delete that.positionToId[-1];
			delete that.idToPosition[-1];
			delete that.byId[-1];
			delete that.recordsOrder[-1];
		}
		var complex = {
			id: originalRecord[that.idName],
			orginalOrder: order,
			originalRecord: originalRecord,
			record: this,
			dirties: {}
		};
		if (firstLoad) {
			that.stworzPrototypRecordu(originalRecord);
			firstLoad = false;
		}
		recordsById[complex.id] = complex;
		that.positionToId[order] = complex.id;
		that.idToPosition[complex.id] = order;
		that.byId[complex.id]=complex.record;
		that.recordsOrder[order]=complex.record;
		defineProp(this, that.idName, function () {
			return complex.id;
		}, function (data) {

		}, false);
		that.startFunction.call(that, complex.record);
	};
	that.Record.prototype = {};
	this.stworzPrototypRecordu = function (rec) {
		var x,
			thatRecord = this,
			temp;

		function zawartoscPrototypu(name) {
			defineProp(that.Record.prototype, name,
				function () {
					return recordsById[this[that.idName]].originalRecord[name];
				},
				function (data) {
					var or = recordsById[this[that.idName]].originalRecord,
						temp = or[name];
					recordsById[this[that.idName]].originalRecord[name] = data;
					that.columns[name]["-dirty"] = true;
					if(that.updatable && that.id!==-1 && that.id!==-2){
						that.update();
					}
					changedProperty.fire(recordsById[this[that.idName]].originalRecord, name, temp);
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
	this.positionToId = {};
	this.recordsOrder = {};
	this.idToPosition = {};
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

	defineProp(that, "length", function () {
		//		if (that.positionToId) {
		//			return Object.getOwnPropertyNames(that.positionToId).length - 2;
		//		}
		return records.length;
	}, function (data) {}, false, true);
	defineProp(that, "position", function () {
		if (id === -1) {
			return -1;
		}
		if (id === null) {
			return -2;
		}
		return that.idToPosition[id];
	}, function (data) {
		if (that.positionToId[data] || data === -1 || data === -2) {
			//			position = data;
			switch (data) {
			case (-1):
				id = -1;
				break;
			case (-2):
				id = null;
				break;
			default:
				that.id = that.positionToId[data];
			}
			return;
		} else {
			debugger;
			console.warn("Nie ma takiej pozycji!!!");
			return;
		}
	});
	defineProp(that, "id", function () {
		return id;
	}, function (data) {
		if (data === id) {
			return;
		}
		if (that.idToPosition.hasOwnProperty(data)) {
			oldId.push(id);
			id = data;
			if (that.columns.length) {
				that.columns.clearDirties();
			}
			this.record = recordsById[id].record;
			this.idChanged.fire();
			return;
		} else {
			console.warn("Nie ma takiego indexu!!!");
			return;
		}
	});
	this.clear = function () {
		records = [];
		recordsById = {};
		this.idToPosition = {};
		this.positionToId = [];
		this.record = {};
		this.byId = {};

	};
	this.fillByRecords = function (response) {
		var len = response.length,
			i = 0,
			row,
			idName = that.idName;
		this.clear();
		records = response;

		if (!records.length) {
			console.warn("zbiór pusty!");
			return;
		}
		that.columns = Object.getOwnPropertyNames(records[0]);
		that.columns.clearDirties = function () {
			this.forEach(function (ele, ind, arr) {
				delete arr[ele]['-dirty'];
			});

		};

		function columnsToRecorsProperty(name, ind, columns) {
			columns[name] = {
				html: ["", ""],
				old: [],
				typeOf: typeof records[0][name],
				filter: ""
			};
		}

		that.columns.forEach(columnsToRecorsProperty);
		records.forEach(function (record, ind, arr) {
			that.byId[record[that.idName]] = new that.Record(record, ind);
		});
		that.position = 0;

	};
	this.positionUndo = function(){
		if(oldId.length){
		this.id= oldId.pop();}
	}

	this.addNew = function (originRec) {
		var newRec = {},
			position,
			newRecord = {};
		newRec = originRec || {};
//		position = records.push(newRec) - 1;
		newRec[that.idName] = -1;
		newRecord = new that.Record(newRec, -1);
		that.id=-1;
		return newRecord;
	};
	this.getCopy = function (deep) {
		var res;
		deep = deep || true;
		res = $.extend(deep, {}, recordsById[id].originalRecord);
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
		return recordsById[id].originalRecord;
	};
	this.setRecord = function (data) {
		var keys = Object.getOwnPropertyNames(data),
			idOfRecord = data[that.idName];
		if (that.id === -1) {
			data = new this.Record(data);
			that.id=idOfRecord;
			return data;
		}
		that.id = idOfRecord;
		keys.forEach(function (ele, ind, arr) {
			if (recordsById[id].originalRecord[ele] !== data[ele]) {
				recordsById[id].originalRecord[ele] = data[ele];
				records[that.idToPosition[id]] = data[ele];
			}
		});
		return data;
	};
	this.deleteRecord = function () {
		var that = this,
			deletedPosition = that.position,
			x;
		that.action = 'delete';
		//		debugger;
		this.get().deferred.done(function (res, succ) {
			if (succ === "success") {
				records.splice(deletedPosition, 1);
				delete that.idToPosition[id];
				delete that.positionToId[deletedPosition];
				delete recordsById[id];
				// todo - usunąć z rekord z naszego zbioru
				for (x = deletedPosition; x < that.length; x += 1) {
					that.positionToId[x] = that.positionToId[x + 1];
					that.idToPosition[that.positionToId[x]] = x;
				}
				if (deletedPosition < that.length) {
					that.position = deletedPosition;
				} else if (deletedPosition > 0) {
					that.position = deletedPosition - 1;
				} else {
					that.id = "null";
				}
				console.log(res);
			}
			return;
		});
	};
	Object.defineProperty(this, 'asyn', {
		get: function () {
			var res = {
				state: !that.synchro
			};
			defineProp(res, 'true', function () {
				that.synchro = false;
			});
			defineProp(res, 'false', function () {
				that.synchro = true;
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
Records.prototype.serverPath = 'http://localhost/ajax.php';
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
			condition: ((this.where === "") ? "" : " WHERE " + this.where) + ((this.orderBy === "") ? "" : " ORDER BY " + this.orderBy),
			action: that.action
		};
	defineProp(para, 'data', function () {
		if (that.action === 'select' || that.action === 'delete' || that.action === 'requery') {
			return that.data;
		}
		var res = that.getCopy(true);
		delete res[that.idName];
		that.columns.forEach(function (ele, ind, arr) {
			if (!arr[ele]["-dirty"]) {
				delete res[ele];
			} else if (typeof res[ele] === 'string') {
				res[ele] = res[ele].replace(/\'/g, "''");
			}
		});
		res = JSON.stringify(res);
		if (that.synchro) {
			return encodeURIComponent(res);
		}
		return res;
	}, false, true);
	defineProp(para, 'URI', function () {
		return that.serverPath + '?table=' + para.table + '&action=' + para.action + '&data=' + para.data + '&condition=' + encodeURIComponent(para.condition) + '&random=' + parseInt(Math.random() * 10000000000, 10);
	}, false);
	return para;
};
Records.prototype.get = function () {
	'use strict';
	var paraObj = this.parameters(),
		that = this,
		data,
		xhr,
		deferred = new $.Deferred();
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
	if (!this.synchro) {
		that.deferred = $.get(that.serverPath, paraObj).done(function (data) {
			if (that.columns.length) {
				that.columns.clearDirties();
			}
			that.response = data;
		});
		return that;
	} else {
		xhr = new XMLHttpRequest();
		data = paraObj.URI;
		xhr.open('GET', data, false);
		xhr.send();
// 		console.log(xhr.status);
// 		console.log(xhr.statusText);
		data = $.parseJSON(xhr.response);
		that.response = data;
		that.deferred = deferred.promise();
		deferred.resolve(data, "success");
		that.deferred.done(function (data, status) {
			if (that.columns.length) {
				that.columns.clearDirties();
			}
		});
		return that;
	}
}; 
Records.prototype.loadAll = function () {
	'use strict';
	var that = this;
	delete this.action;
	// domyślne ustawienia - czyli select i data ===0
	delete this.data;
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

rec = new Records('firmy', 'id', false);

function zmianaDannychFirmy(rec, name, temp){
	console.log(rec[name], temp);

}

rec.changedProperty.add(zmianaDannychFirmy);
rec.startFunction = function (row) {
	'use strict';
	//	debugger
	if (row.wspN === null) {
		row.wspN = 48;
	}
	if (row.wspE === null) {
		row.wspE = 16;
	}
	row.mvc = new gm.MVCObject();
	row.mvc.set('position', new google.maps.LatLng(row.wspN, row.wspE));
	row.marker = new google.maps.Marker({
		map: map,
		title: row.nazwa
	});
	row.marker.bindTo('position', row.mvc);
};
//debugger;
rec.loadAll();
this.miasta = new Records('plMiejscowosci', 'id', true, '1=1', 'nazwa');
this.prac = new Records('firmypracownicy');

odc = new Records('odcinki', 'key1', false);
trasyPunkty = new Records('trasyPunktyView', 'id', true, '1=1', ' kiedy desc');
trasyPunktyWybrana = new Records('trasyPunktyView', 'id', false, '1=1', ' kolejnosc asc');
this.impetPracownicy = new Records('impetPracownicy', 'id2');

function Wyjazd(parent) {
	Records.call(this, 'trasyPunktyView', 'id', true, 'id=' + parent._trasaId, ' kolejnosc asc');
}
Wyjazd.prototype = Object.create(Records.prototype);
defineProp(Wyjazd.prototype, 'firma', function () {
	return rec.record[this.firmaId];
});
defineProp(Wyjazd.prototype, 'positionOfFirma', function () {
	return this.firma.mvc.get('position');
});

function Trasy(nameOfTable) {
	var that = this;

	function zmianaWyjazdu() {
		var wyjazd = that.record.wyjazd;
		if (!wyjazd) {
			wyjazd = new Wyjazd(that);
			that.record.wyjazd=wyjazd;
			wyjazd.deferred.done(function () {

			});
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
Trasy.prototype.constructor=Trasy;
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
	return "'" + toKeys(tw.posit) + "'";
});
defineProp(tw, 'keys', function () {
	'use strict';
	var x;
	odc.where = ' key1 = ' + tw.key + ' AND key2= ';
	tw.next();
	odc.where += tw.key;
	return odc.where;
});
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
	trasy.wszystkieDrogi[trasy.id].poly = tra.poly = new gm.Polyline({
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
		mvc = new gm.MVCArray();
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
					a = gm.geometry.encoding.decodePath(unescape(ele.data));
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
		unitSystem: gm.UnitSystem.METRIC
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


defineProp(this, 're', function(){return this.rec.record});