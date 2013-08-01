function SearchAddress(map, form) {
    this._model = new SearchAddress.Model();
    this._formView = new SearchAddress.FormView(form);
    this._mapView = new SearchAddress.MapView(map);

    this._attachHandlers();
}

SearchAddress.prototype = {
    constructor: SearchAddress,
    _attachHandlers: function () {
        this._formView.events
            .on('searchrequest', $.proxy(this._onSearchRequest, this));
    },
    _detachHandlers: function () {
        this._formView.events
            .off();
    },
    _onSearchRequest: function (e) {
        var promise = this._model.search(e.query);

        this._mapView
            .clear();

        promise.then(
            $.proxy(this._onSearchSuccess, this),
            $.proxy(this._onSearchError, this)
        );
    },
    _onSearchSuccess: function (result) {
        if(this._model.getResult()) {
            this._mapView
                .render(result);
        }
        else {
            this._formView
                .showMessage("Ничего не найдено.");
        }
    },
    _onSearchError: function (e) {
        this._formView.showMessage(
            this._model.getError()
        );
    },
    getModel: function () {
        return this._formModel;
    }
};

SearchAddress.MapView = function (map) {
    this._map = map;
    this._point = null;
};

SearchAddress.MapView.prototype = {
    constructor: SearchAddress.MapView,
    render: function (results) {
        var metaData = results.metaData.geocoder,
            result = results.geoObjects.get(0),
            balloonContent = '<p><small>по запросу:</small>&nbsp;<em>' + metaData.request + '</em></p>' +
                '<p><small>найдено:</small>&nbsp;<strong>' + result.properties.get('text') + '</strong></p>';

        this._point = new ymaps.Placemark(result.geometry.getCoordinates(), {
            balloonContentBody: balloonContent
        });

        this._map.geoObjects
            .add(this._point);

        this._setMapBounds(result.properties.get('boundedBy'));

        return this;
    },
    clear: function () {
        if(this._point) {
            this._map.geoObjects
                .remove(this._point);
            this._point = null;
        }

        return this;
    },
    _setMapBounds: function (bounds) {
        this._map.setBounds(bounds, {
            checkZoomRange: true,
            duration: 200,
            callback: ymaps.util.bind(this._onSetMapBounds, this)
        });
    },
    _onSetMapBounds: function () {
        this._point.balloon
            .open();
    }
};

SearchAddress.FormView = function (form) {
    this._form = form;
    this._controls = form.find('.control-group');
    this._message = form.find('.help-inline');
    this._input = form.find('.search-query');

    this.events = $({});

    this._attachHandlers();
};

SearchAddress.FormView.prototype = {
    constructor: SearchAddress.FormView,
    _attachHandlers: function () {
        this._form
            .on('submit', $.proxy(this._onFormSubmit, this));
        this._input
            .on('keydown', $.proxy(this._onInputChange, this));
    },
    _detachHandlers: function () {
        this._form
            .off("submit");
        this._input
            .off();
    },
    _onFormSubmit: function (e) {
        e.preventDefault();

        var value = this._input.val();

        if(value) {
            this.events.trigger($.Event('searchrequest', {
                query: value
            }));
        }
        else {
            this.showMessage('Задан пустой поисковый запрос.');
        }
    },
    _onInputChange: function (e) {
        this.hideMessage();
    },
    showMessage: function (text) {
        this._controls
            .addClass('error');
        this._message
            .removeClass('invisible')
            .text(text);
    },
    hideMessage: function () {
        this._controls
            .removeClass('error');
        this._message
            .addClass('invisible')
            .text('');
    }
};

SearchAddress.Model = function () {
    this._result = null;
    this._error = null;
};

SearchAddress.Model.prototype = {
    constructor: SearchAddress.Model,
    search: function (request) {
        var promise = ymaps.geocode(request, this.getDefaults());

        this.clear();

        promise.then(
            $.proxy(this._onSearchSuccess, this),
            $.proxy(this._onSearchFailed, this)
        );

        return promise;
    },
    clear: function () {
        this._result = null;
        this._error = null;
    },
    _onSearchSuccess: function (result) {
        this._result = result.geoObjects.get(0);
    },
    _onSearchFailed: function (error) {
        this._error = error;
    },
    getDefaults: function () {
        return {
            results: 1
        };
    },
    getResult: function () {
        return this._result;
    },
    getError: function () {
        return this._error;
    }
};
