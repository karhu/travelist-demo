(function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);var f=new Error("Cannot find module '"+o+"'");throw f.code="MODULE_NOT_FOUND",f}var l=n[o]={exports:{}};t[o][0].call(l.exports,function(e){var n=t[o][1][e];return s(n?n:e)},l,l.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(require,module,exports){
/// <reference path="./GeoCoding.d.ts"/>
function request_json(url, timeout_ms, cb) {
    var xhr = new XMLHttpRequest();
    xhr.ontimeout = function () { return cb(xhr, false); };
    xhr.onload = function () {
        if (xhr.status == 200) {
            cb(xhr, true);
        }
        else {
            cb(xhr, false);
        }
    };
    xhr.responseType = "json";
    xhr.open("GET", url, true);
    xhr.timeout = timeout_ms;
    xhr.send(null);
}
function search(query, n, cb) {
    var url = "http://ws.geonames.org/searchJSON?maxRows=" + n.toString() + "&username=karhu&q=" + encodeURIComponent(query);
    request_json(url, 2000, function (req, ok) {
        if (!ok)
            return cb([]);
        console.log(req.status);
        console.log(req.statusText);
        console.log(req.response);
        var result = new Array();
        var i = 0;
        req.response['geonames'].forEach(function (o) {
            result.push({
                key: i,
                name: o['name'],
                country: o['countryName'],
                lat: o['lat'],
                lng: o['lng']
            });
            i += 1;
        });
        return cb(result);
    });
}
exports.search = search;

},{}],2:[function(require,module,exports){
var LocalStore = (function () {
    function LocalStore(key) {
        this.key = key;
    }
    LocalStore.prototype.write = function (data) {
        return localStorage.setItem(this.key, JSON.stringify(data));
    };
    LocalStore.prototype.read = function () {
        var store = localStorage.getItem(this.key);
        return (store && JSON.parse(store)) || [];
    };
    return LocalStore;
})();
exports.LocalStore = LocalStore;

},{}],3:[function(require,module,exports){
/// <reference path="./interfaces.d.ts"/>
var LocalStore_1 = require("./LocalStore");
var utils = require("./utils");
var TodoModel = (function () {
    function TodoModel(key) {
        this.callbacks = [];
        this.store = new LocalStore_1.LocalStore(key);
        this.entries = this.store.read();
        this.key = key;
        if (this.entries.length === 0) {
            this.init_store();
        }
        console.log(this.entries);
        this.notify();
    }
    TodoModel.prototype.subscribe = function (callback) {
        this.callbacks.push(callback);
    };
    TodoModel.prototype.all_todos = function () {
        return this.entries;
    };
    TodoModel.prototype.add_todo = function (name, country, image, lat, lng) {
        var _this = this;
        var img = new Image();
        img.onload = function (event) {
            _this.entries = _this.entries.concat({
                id: utils.uuid(),
                name: name,
                country: country,
                image: image,
                lng: lng,
                lat: lat,
                imageWidth: img.width,
                imageHeight: img.height
            });
            _this.notify();
        };
        img.src = image;
    };
    TodoModel.prototype.modify_todo = function (update) {
        var _this = this;
        var dest = this.get_todo(update.id);
        for (var key in update) {
            dest[key] = update[key];
        }
        // recompute image dimensions if the image url has changed
        if (update.image) {
            var img = new Image();
            img.onload = function (event) {
                dest.imageWidth = img.width;
                dest.imageHeight = img.height;
                _this.notify();
            };
            img.src = update.image;
        }
        else {
            this.notify();
        }
    };
    TodoModel.prototype.remove_todo = function (destination) {
        this.entries = this.entries.filter(function (e) {
            return e.id !== destination.id;
        });
        this.notify();
    };
    TodoModel.prototype.get_todo = function (id) {
        var result = {
            id: "",
            name: "",
            country: "",
            image: "",
            lng: 0,
            lat: 0,
            imageWidth: 0,
            imageHeight: 0
        };
        this.entries.forEach(function (e) {
            if (e.id === id)
                result = e;
        });
        return result;
    };
    TodoModel.prototype.notify = function () {
        this.store.write(this.entries);
        this.callbacks.forEach(function (cb) { return cb(); });
    };
    TodoModel.prototype.init_store = function () {
        this.add_todo("Great Sand Dunes National Park", "United States", "http://i.huffpost.com/gen/1845347/thumbs/o-168810212-900.jpg?1", 37.77654, -105.62886);
        this.add_todo("Torres del Paine", "Chile", "https://upload.wikimedia.org/wikipedia/commons/thumb/4/43/Torres_del_Paine_desde_Lago_Grey.JPG/320px-Torres_del_Paine_desde_Lago_Grey.JPG", -51.05032, -72.82949);
        this.add_todo("Matterhorn", "Switzerland", "https://upload.wikimedia.org/wikipedia/commons/6/60/Matterhorn_from_Domh%C3%BCtte_-_2.jpg", 45.97639, 7.65833);
        this.add_todo("San Francisco", "United States", "http://vignette2.wikia.nocookie.net/godzilla/images/9/9a/Golden_Gate_Bridge.jpg/revision/latest?cb=20150831210600", 37.77493, -122.41942);
    };
    return TodoModel;
})();
exports.TodoModel = TodoModel;

},{"./LocalStore":2,"./utils":9}],4:[function(require,module,exports){
/// <reference path="../../typings/react/react-global.d.ts" />
/// <reference path="../interfaces.d.ts"/>
var __extends = (this && this.__extends) || function (d, b) {
    for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p];
    function __() { this.constructor = d; }
    d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
};
var geo = require('../GeoCoding');
var LocationForm = (function (_super) {
    __extends(LocationForm, _super);
    function LocationForm(props) {
        _super.call(this, props);
        this.state = {
            search_results: []
        };
    }
    LocationForm.prototype.isEdit = function () {
        return this.props.locationId != null;
    };
    LocationForm.prototype.componentDidMount = function () {
        this.refs['search_query']['focus']();
        if (this.isEdit()) {
            var loc = this.props.model.get_todo(this.props.locationId);
            this.refs['name']['value'] = loc.name;
            this.refs['country']['value'] = loc.country;
            this.refs['image']['value'] = loc.image;
            this.refs['lng']['value'] = loc.lng;
            this.refs['lat']['value'] = loc.lat;
        }
    };
    LocationForm.prototype.componentDidUpdate = function (prevProps, prevState) {
        this.refs['search_query']['focus']();
        if (this.isEdit()) {
            var loc = this.props.model.get_todo(this.props.locationId);
            this.refs['name']['value'] = loc.name;
            this.refs['country']['value'] = loc.country;
            this.refs['image']['value'] = loc.image;
            this.refs['lng']['value'] = loc.lng;
            this.refs['lat']['value'] = loc.lat;
        }
    };
    LocationForm.prototype.handleSave = function () {
        var name = this.refs['name']['value'];
        var country = this.refs['country']['value'];
        var image = this.refs['image']['value'];
        var lat = +this.refs['lat']['value'];
        var lng = +this.refs['lng']['value'];
        if (this.isEdit()) {
            this.props.model.modify_todo({
                id: this.props.locationId,
                name: name.toString(),
                country: country.toString(),
                image: image.toString(),
                lat: lat,
                lng: lng
            });
        }
        else {
            this.props.model.add_todo(name, country, image, lat, lng);
        }
        this.props.onClose();
    };
    LocationForm.prototype.handleCancel = function () {
        this.props.onClose();
    };
    LocationForm.prototype.handleDelete = function () {
        this.props.model.remove_todo(this.props.model.get_todo(this.props.locationId));
        this.props.onClose();
    };
    LocationForm.prototype.handleGeoSearch = function () {
        var _this = this;
        var query = this.refs['search_query']['value'];
        geo.search(query, 3, function (results) {
            _this.setState({
                search_results: results
            });
        });
    };
    LocationForm.prototype.handleGeoSearchEnterKey = function (event) {
        var ENTER_KEY = 13;
        if (event['keyCode'] !== ENTER_KEY)
            return;
        event.preventDefault();
        this.handleGeoSearch();
    };
    LocationForm.prototype.handleGeoResultSelect = function (idx) {
        var ref = 'georesult' + idx.toString();
        var button = this.refs[ref];
        button['blur']();
        var sr = this.state.search_results[idx];
        this.refs['name']['value'] = sr.name;
        this.refs['country']['value'] = sr.country;
        this.refs['lat']['value'] = sr.lat;
        this.refs['lng']['value'] = sr.lng;
    };
    LocationForm.prototype.render = function () {
        var _this = this;
        var searchBox = (React.createElement("div", {"className": "geocode-search input-group"}, React.createElement("input", {"type": "text", "className": "form-control", "ref": "search_query", "placeholder": "Search for location...", "onKeyDown": function (e) { return _this.handleGeoSearchEnterKey(e); }}), React.createElement("span", {"className": "input-group-btn"}, React.createElement("button", {"className": "btn btn-default", "type": "button", "onClick": function () { return _this.handleGeoSearch(); }}, "Search"))));
        var searchResults = (React.createElement("div", {"className": "list-group"}, this.state.search_results.map(function (item) {
            return (React.createElement("a", {"href": "#/", "type": "button", "className": "list-group-item", "key": item.key, "ref": "georesult" + item.key.toString(), "onClick": function () { return _this.handleGeoResultSelect(item.key); }}, item.name, ", ", item.country));
        })));
        var buttonSave = (React.createElement("button", {"type": "button", "className": "btn btn-success", "onClick": function () { return _this.handleSave(); }}, this.isEdit() ? "Save" : "Add"));
        var buttonCancel = (React.createElement("button", {"type": "button", "className": "btn btn-warning", "onClick": function () { return _this.handleCancel(); }}, "Cancel"));
        var buttonDelete = this.isEdit() ? (React.createElement("button", {"type": "button", "className": "btn btn-danger", "onClick": function () { return _this.handleDelete(); }}, "Delete")) : null;
        var form = (React.createElement("form", {"className": "form-horizontal LocationForm", "role": "form"}, React.createElement("div", {"className": "form-group"}, React.createElement("label", {"className": "control-label col-sm-2", "htmlFor": "name"}, "Name:"), React.createElement("div", {"className": "col-sm-10"}, React.createElement("input", {"type": "text", "className": "form-control", "id": "name", "ref": 'name', "placeholder": "Matterhorn, Taj Mahal, ..."}))), React.createElement("div", {"className": "form-group"}, React.createElement("label", {"className": "control-label col-sm-2", "htmlFor": "country"}, "Country:"), React.createElement("div", {"className": "col-sm-10"}, React.createElement("input", {"type": "text", "className": "form-control", "id": "country", "ref": "country", "placeholder": "USA, Chile, Switzerland, ..."}))), React.createElement("div", {"className": "form-group"}, React.createElement("label", {"className": "control-label col-sm-2", "htmlFor": "lat"}, "Latitude:"), React.createElement("div", {"className": "col-sm-4"}, React.createElement("input", {"type": "text", "className": "form-control", "id": "lat", "ref": "lat", "placeholder": "47.35"})), React.createElement("label", {"className": "control-label col-sm-2", "htmlFor": "lng"}, "Longitude:"), React.createElement("div", {"className": "col-sm-4"}, React.createElement("input", {"type": "text", "className": "form-control", "id": "lng", "ref": "lng", "placeholder": "8.34"}))), React.createElement("div", {"className": "form-group"}, React.createElement("label", {"className": "control-label col-sm-2", "htmlFor": "image"}, "Image:"), React.createElement("div", {"className": "col-sm-10"}, React.createElement("input", {"type": "text", "className": "form-control", "id": "image", "ref": "image", "placeholder": "image/path.png"}))), React.createElement("div", {"className": "form-group"}, React.createElement("div", {"className": "col-sm-offset-2 col-sm-10"}, React.createElement("div", {"className": "btn-toolbar"}, buttonSave, " ", buttonCancel, " ", buttonDelete)))));
        return (React.createElement("div", {"className": "LocationForm"}, React.createElement("div", {"className": "col-md-5"}, searchBox, searchResults), React.createElement("div", {"className": "col-md-7"}, form)));
    };
    return LocationForm;
})(React.Component);
exports.LocationForm = LocationForm;

},{"../GeoCoding":1}],5:[function(require,module,exports){
/// <reference path="../../typings/react/react-global.d.ts" />
/// <reference path="../interfaces.d.ts"/>
var __extends = (this && this.__extends) || function (d, b) {
    for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p];
    function __() { this.constructor = d; }
    d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
};
var LocationList = (function (_super) {
    __extends(LocationList, _super);
    function LocationList(props) {
        _super.call(this, props);
    }
    LocationList.prototype.componentDidMount = function () {
    };
    LocationList.prototype.imageStyle = function (item) {
        var HEIGHT = 130;
        var factor = HEIGHT / item.imageHeight;
        var width = factor * item.imageWidth;
        return {
            width: width.toString() + "px",
            height: HEIGHT.toString() + "px"
        };
    };
    LocationList.prototype.handleLocationSelect = function (key) {
        this.props.onSelect(key);
    };
    LocationList.prototype.render = function () {
        var _this = this;
        var items = this.props.model.all_todos().map(function (item) {
            return (React.createElement("a", {"href": "#/", "type": "button", "className": "destinations-item", "key": item.id, "ref": "location_" + item.id.toString(), "onClick": function () { return _this.handleLocationSelect(item.id); }}, React.createElement("div", {"className": "img-wrap"}, React.createElement("img", {"src": item.image, "style": _this.imageStyle(item)})), React.createElement("div", {"className": "name"}, " ", item.name, " ")));
        });
        return (React.createElement("div", {"className": "destinations"}, items));
    };
    return LocationList;
})(React.Component);
exports.LocationList = LocationList;

},{}],6:[function(require,module,exports){
/// <reference path="../../typings/react/react-global.d.ts" />
/// <reference path="../interfaces.d.ts"/>
/// <reference path="../mapboxgl.d.ts"/>
var __extends = (this && this.__extends) || function (d, b) {
    for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p];
    function __() { this.constructor = d; }
    d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
};
var Map = (function (_super) {
    __extends(Map, _super);
    function Map(props) {
        _super.call(this, props);
        // this.render = template;
        this.state = {};
    }
    Map.prototype.componentDidMount = function () {
        var _this = this;
        this.createMap();
        this.props.model.subscribe(function () { return _this.updateMarkers(); });
    };
    Map.prototype.createMap = function () {
        var _this = this;
        mapboxgl.accessToken = 'pk.eyJ1Ijoia2FyaHUiLCJhIjoiY2lrN2NtOHRrMDA3OXZya3NweGZucm1raCJ9.JHaXnqxYQs4e2Pu-3R0wAg';
        this.map = new mapboxgl.Map({
            container: 'map',
            // style: 'mapbox://styles/karhu/cikms58yw00dsb5lwhhkbfoeb',    // stylesheet location
            style: 'mapbox://styles/karhu/cik7jh20a00ilbtj7cw5zediq',
            center: [-14.50, 22],
            zoom: 1 // starting zoom
        });
        var features = this.props.model.all_todos().map(function (d) {
            return {
                "type": "Feature",
                "geometry": {
                    "type": "Point",
                    "coordinates": [d.lng, d.lat]
                },
                "properties": {
                    "title": d.name,
                    "marker-symbol": "marker-orange",
                    "location-id": d.id
                }
            };
        });
        this.marker_source = new mapboxgl.GeoJSONSource({
            "data": {
                "type": "FeatureCollection",
                "features": features
            }
        });
        this.marker_source_highlighted = new mapboxgl.GeoJSONSource({
            "data": {
                "type": "FeatureCollection",
                "features": []
            }
        });
        this.map.on('style.load', function () {
            _this.map.addSource("markers", _this.marker_source);
            _this.map.addSource("markers-highlighted", _this.marker_source_highlighted);
            _this.map.addLayer({
                "id": "markers",
                "type": "symbol",
                "source": "markers",
                "interactive": true,
                "layout": {
                    "icon-image": "{marker-symbol}-24",
                    "icon-size": 1.15,
                    "icon-allow-overlap": true
                }
            });
            _this.map.addLayer({
                "id": "markers-highlighted",
                "type": "symbol",
                "source": "markers-highlighted",
                "layout": {
                    "icon-image": "{marker-symbol}-24",
                    "icon-size": 1.25,
                    "icon-allow-overlap": true
                }
            });
        });
        this.updateMarkers();
        // Indicate that the markers are clickable
        this.map.on('mousemove', function (e) {
            _this.map.featuresAt(e.point, { layer: 'markers', radius: 10 }, function (err, features) {
                if (err)
                    throw err;
                _this.map.getCanvas().style.cursor = features.length ? 'pointer' : '';
            });
        });
        this.map.on('click', function (e) {
            _this.map.featuresAt(e.point, { layer: 'markers', radius: 10, includeGeometry: true }, function (err, features) {
                if (err)
                    throw err;
                if (features.length) {
                    var id = features[0].properties['location-id'];
                    if (_this.props.onLocationSelect)
                        _this.props.onLocationSelect(id);
                    _this.setHighlightedMarker(id);
                }
            });
        });
    };
    Map.prototype.updateMarkers = function () {
        var features = this.props.model.all_todos().map(function (d) {
            return {
                "type": "Feature",
                "geometry": {
                    "type": "Point",
                    "coordinates": [d.lng, d.lat]
                },
                "properties": {
                    "title": d.name,
                    "marker-symbol": "marker-orange",
                    "location-id": d.id
                }
            };
        });
        this.marker_source.setData({
            "type": "FeatureCollection",
            "features": features
        });
    };
    Map.prototype.setHighlightedMarker = function (id) {
        if (id) {
            var d = this.props.model.get_todo(id);
            this.marker_source_highlighted.setData({
                "type": "FeatureCollection",
                "features": [{
                        "type": "Feature",
                        "geometry": {
                            "type": "Point",
                            "coordinates": [d.lng, d.lat]
                        },
                        "properties": {
                            "title": d.name,
                            "marker-symbol": "marker-lightorange",
                            "location-id": d.id
                        }
                    }]
            });
        }
        else {
            this.marker_source_highlighted.setData({
                "type": "FeatureCollection",
                "features": []
            });
        }
    };
    Map.prototype.render = function () {
        return (React.createElement("div", {"id": 'map'}));
    };
    return Map;
})(React.Component);
exports.Map = Map;

},{}],7:[function(require,module,exports){
/// <reference path="../../typings/react/react-global.d.ts" />
/// <reference path="../interfaces.d.ts"/>
var __extends = (this && this.__extends) || function (d, b) {
    for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p];
    function __() { this.constructor = d; }
    d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
};
var Map_1 = require('./Map');
var LocationForm_1 = require('./LocationForm');
var LocationList_1 = require('./LocationList');
var App = (function (_super) {
    __extends(App, _super);
    function App(props) {
        _super.call(this, props);
        // this.render = template;
        this.state = {
            mode: "list",
            active_destination: ""
        };
    }
    App.prototype.componentDidMount = function () {
        // todo add router
    };
    App.prototype.initView = function (destination_id) {
        this.mapComponent.setHighlightedMarker(destination_id);
        this.setState({
            mode: "view",
            active_destination: destination_id
        });
    };
    App.prototype.initAdd = function () {
        this.setState({
            mode: "add",
            active_destination: ""
        });
    };
    App.prototype.showList = function () {
        this.mapComponent.setHighlightedMarker(null);
        this.setState({
            mode: "list",
            active_destination: ""
        });
    };
    App.prototype.onDelete = function (id) {
        this.props.model.remove_todo(this.props.model.get_todo(id));
        this.setState({
            mode: "list",
            active_destination: ""
        });
    };
    App.prototype.render = function () {
        var _this = this;
        var button;
        if (this.state.mode == 'list') {
            button = (React.createElement("button", {"onClick": function () { return _this.initAdd(); }, "type": "button", "className": "btn btn-primary navbar-btn navbar-right"}, "Add"));
        }
        var bar = (React.createElement("nav", {"id": 'bar', "className": "navbar navbar-default navbar-fixed-top"}, React.createElement("div", {"className": "container-fluid"}, React.createElement("div", {"className": "navbar-header"}, React.createElement("a", {"className": "navbar-brand", "href": "#"}, "Travelist")), React.createElement("div", {"className": "collapse navbar-collapse"}, React.createElement("ul", {"className": "nav navbar-nav navbar-right"}, React.createElement("li", null, button))))));
        var content;
        if (this.state.mode == 'add') {
            content = (React.createElement(LocationForm_1.LocationForm, {"model": this.props.model, "onClose": function () { return _this.showList(); }}));
        }
        else if (this.state.mode == 'list') {
            content = (React.createElement(LocationList_1.LocationList, {"model": this.props.model, "onSelect": function (id) { return _this.initView(id); }}));
        }
        else if (this.state.mode == 'view') {
            content = (React.createElement(LocationForm_1.LocationForm, {"model": this.props.model, "onClose": function () { return _this.showList(); }, "locationId": this.state.active_destination}));
        }
        return (React.createElement("div", null, bar, React.createElement("div", {"id": 'content', "className": "col-sm-6"}, content), React.createElement("div", {"id": 'map-wrap', "className": "col-sm-offset-6 col-sm-6"}, React.createElement(Map_1.Map, {"ref": function (map) { return _this.mapComponent = map; }, "model": this.props.model, "onLocationSelect": function (id) { return _this.initView(id); }})), React.createElement("div", {"className": "footer-bar"})));
    };
    return App;
})(React.Component);
exports.App = App;

},{"./LocationForm":4,"./LocationList":5,"./Map":6}],8:[function(require,module,exports){
/// <reference path="./components/app.tsx"/>
var app_1 = require("./components/app");
var TodoModel_1 = require("./TodoModel");
var model = new TodoModel_1.TodoModel("travelist-data-2");
function render() {
    ReactDOM.render(React.createElement(app_1.App, {
        "model": model
    }), document.getElementsByClassName('root')[0]);
}
model.subscribe(render);
render();

},{"./TodoModel":3,"./components/app":7}],9:[function(require,module,exports){
function uuid() {
    var i, random;
    var uuid = '';
    for (i = 0; i < 32; i++) {
        random = Math.random() * 16 | 0;
        if (i === 8 || i === 12 || i === 16 || i === 20) {
            uuid += '-';
        }
        uuid += (i === 12 ? 4 : (i === 16 ? (random & 3 | 8) : random))
            .toString(16);
    }
    return uuid;
}
exports.uuid = uuid;

},{}]},{},[8]);
